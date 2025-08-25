using Microsoft.Extensions.Logging;
using Polygent.Logic.Agent.Interfaces;
using Polygent.Logic.Agent.Models;
using Polygent.Logic.Helpers;
using Polygent.Logic.Interfaces;
using Polygent.Logic.Services;
using RoeiBajayo.Infrastructure.DependencyInjection.Attributes;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace Polygent.Logic.Agent.Providers;

[KeyedService(MessageProcessorProviderType.ClaudeCode)]
internal class ClaudeCodeProvider(
    ILogger<ClaudeCodeProvider> logger)
    : IMessageProcessorProvider, ISingletonService<IMessageProcessorProvider>
{
    public async Task<ProcessMessageResponse> ProcessMessageAsync(
        ProcessMessageRequest message,
        CancellationToken cancellationToken)
    {
        // Detect OS and resolve Claude path with better cross-platform support
        string claudePath;

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            var appData = Environment.GetEnvironmentVariable("APPDATA");
            if (string.IsNullOrEmpty(appData))
            {
                throw new InvalidOperationException("APPDATA environment variable not found on Windows");
            }
            var npmGlobalBin = Path.Combine(appData, "npm");
            claudePath = Path.Combine(npmGlobalBin, "claude.cmd");
        }
        else
        {
            // Works for Linux & macOS
            try
            {
                var npmGlobalBin = RunCommand("npm", "bin -g").Trim();
                if (string.IsNullOrEmpty(npmGlobalBin))
                {
                    throw new InvalidOperationException("Failed to determine npm global bin directory");
                }
                claudePath = Path.Combine(npmGlobalBin, "claude");
            }
            catch (Exception ex)
            {
                throw new InvalidOperationException("Failed to locate npm global bin directory on Unix-like system", ex);
            }
        }

        if (!File.Exists(claudePath))
        {
            throw new FileNotFoundException($"Claude CLI not found at {claudePath}. " +
                "Install it with: npm install -g @anthropic-ai/claude-code");
        }

        var filename = claudePath;
        var arguments = $"--dangerously-skip-permissions --verbose --output-format stream-json -p \"{message.Message.Replace("\"", "\\\"")}\"";

        if (!string.IsNullOrEmpty(message.SystemPrompt))
        {
            arguments += $" --append-system-prompt \"{message.SystemPrompt.Replace("\"", "\\\"")}\"";
        }

        //if (!string.IsNullOrEmpty(message.Model))
        //{
        //    arguments += $" --model {message.Model}";
        //}

        if (!string.IsNullOrEmpty(message.ProviderSessionId))
        {
            arguments += $" --resume {message.ProviderSessionId}";
        }

        // Add MCP config file if available
        if (!string.IsNullOrEmpty(message.McpConfigPath) && File.Exists(message.McpConfigPath))
        {
            arguments += $" --mcp-config \"{message.McpConfigPath}\"";
        }

        // Normalize working directory path for cross-platform compatibility
        var workingDirectory = Path.GetFullPath(message.WorkingDirectory);

        // Verify working directory exists
        if (!Directory.Exists(workingDirectory))
        {
            throw new DirectoryNotFoundException($"Working directory does not exist: {workingDirectory}");
        }

        logger.LogInformation("{WorkingDir}: {FileName} {Arguments}", workingDirectory, filename, arguments);

        var processInfo = new ProcessStartInfo
        {
            FileName = filename,
            Arguments = arguments,
            WorkingDirectory = workingDirectory,
        };
        ProcessHelpers.HideProcessWindow(processInfo);

        using var process = Process.Start(processInfo);
        if (process is null)
        {
            logger.LogError("Failed to start Claude process");
            throw new InvalidOperationException($"Claude process error: {"Failed to start Claude process"}");
        }

        // Set process priority to prevent focus stealing and improve responsiveness
        try
        {
            process.PriorityClass = ProcessPriorityClass.BelowNormal;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to set process priority");
        }

        var errorTask = process.StandardError.ReadToEndAsync(cancellationToken);

        // Process streaming output line by line with optimized performance
        string? sessionId = null;
        string? finalResult = null;
        bool isError = false;
        var jsonOptions = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.SnakeCaseLower };

        using var reader = process.StandardOutput;
        var buffer = new StringBuilder();
        char[] charBuffer = new char[4096];
        int charsRead;

        try
        {
            while (!cancellationToken.IsCancellationRequested && (charsRead = await reader.ReadAsync(charBuffer, cancellationToken)) > 0)
            {
                buffer.Append(charBuffer, 0, charsRead);

                // Process complete lines
                string content = buffer.ToString();
                string[] lines = content.Split('\n');

                // Keep the last incomplete line in buffer
                buffer.Clear();
                if (!content.EndsWith('\n') && lines.Length > 0)
                {
                    buffer.Append(lines[^1]);
                    lines = lines[..^1];
                }

                // Process each complete line
                foreach (var line in lines)
                {
                    if (string.IsNullOrWhiteSpace(line))
                        continue;

                    try
                    {
                        var streamEvent = JsonSerializer.Deserialize<ClaudeStreamEvent>(line, jsonOptions);
                        if (streamEvent == null)
                            continue;

                        // Capture session ID from any event that has it
                        if (streamEvent.SessionId != null)
                            sessionId = streamEvent.SessionId;

                        // Handle different event types according to Claude streaming documentation
                        var processTask = streamEvent.Type switch
                        {
                            // Core message events
                            "message_start" => ProcessMessageStart(streamEvent, message.OnToolStart),
                            "message_delta" => ProcessMessageDelta(streamEvent, message.OnToolUpdate),
                            "message_stop" => ProcessMessageStop(streamEvent, message.OnToolUpdate),

                            // Content block events
                            "content_block_start" => ProcessContentBlockStart(streamEvent, message.OnToolStart, message.OnToolUpdate),
                            "content_block_delta" => ProcessContentBlockDelta(streamEvent, message.OnToolUpdate),
                            "content_block_stop" => ProcessContentBlockStop(streamEvent, message.OnToolUpdate),

                            // Legacy events (for backwards compatibility)
                            "assistant" => ProcessAssistantMessage(streamEvent, message.OnToolStart, message.OnToolUpdate),
                            "user" => ProcessUserMessage(streamEvent, message.OnToolUpdate),

                            // Error event
                            "error" => ProcessErrorEvent(streamEvent, message.OnToolUpdate),

                            // Result event
                            "result" => Task.Run(() =>
                            {
                                finalResult = streamEvent.Result;
                                isError = streamEvent.IsError ?? false;
                            }),

                            _ => ProcessUnknownEvent(streamEvent, message.OnToolUpdate) // Handle any unknown events
                        };

                        // Don't await here to allow parallel processing, but handle exceptions
                        _ = processTask.ContinueWith(t =>
                        {
                            if (t.IsFaulted)
                                logger.LogWarning(t.Exception, "Error processing stream event type: {Type}", streamEvent.Type);
                        }, TaskContinuationOptions.OnlyOnFaulted);
                    }
                    catch (JsonException ex)
                    {
                        logger.LogWarning(ex, "Failed to parse stream event: {Line}", line);
                    }
                }
            }

            var errorOutput = await errorTask;
            await process.WaitForExitAsync(cancellationToken);

            if (!string.IsNullOrEmpty(errorOutput))
            {
                logger.LogError("Claude error: {Error}", errorOutput);
                throw new InvalidOperationException($"Claude process error: {errorOutput}");
            }
        }
        catch (OperationCanceledException)
        {
            return new ProcessMessageResponse(finalResult ?? "", sessionId);
        }

        if (string.IsNullOrEmpty(finalResult))
        {
            logger.LogError("Claude output is empty");
            throw new InvalidOperationException($"Claude process error: {"No output received from Claude"}");
        }

        return new ProcessMessageResponse(finalResult, sessionId);
    }

    private readonly Dictionary<string, int> activeToolMessages = [];
    private readonly Dictionary<string, string> toolOutputBuffer = []; // Track accumulated tool output
    private readonly Dictionary<string, DateTime> toolStartTimes = []; // Track when tools started
    private readonly Dictionary<string, Timer> toolProgressTimers = []; // Timers for periodic updates
    private readonly Dictionary<string, string> toolCallSignatures = []; // Track tool call signatures (e.g., "Glob(**/CLAUDE.md)")

    private async Task ProcessAssistantMessage(ClaudeStreamEvent streamEvent, Func<string, string, Task<int>>? onToolStart, Func<int, string, MessageStatus, Task>? onToolUpdate)
    {
        if (streamEvent.Message?.Content == null || onToolStart == null)
            return;

        foreach (var content in streamEvent.Message.Content)
        {
            if (content.Type == "tool_use" && !string.IsNullOrEmpty(content.Id))
            {
                var toolName = content.Name ?? "Unknown Tool";
                var toolStartMessage = FormatToolUsageMessage(toolName, content.Input);

                try
                {
                    var messageId = await onToolStart(toolName, toolStartMessage);
                    activeToolMessages[content.Id] = messageId;

                    // Store tool name and call signature for later use in completion message
                    toolUseIdToName[content.Id] = toolName;
                    var parsableMessage = GetParsableToolMessage(toolName, content.Input);
                    toolCallSignatures[content.Id] = parsableMessage;

                    // Track start time and set up progressive updates
                    toolStartTimes[content.Id] = DateTime.UtcNow;
                    toolOutputBuffer[content.Id] = string.Empty;

                    // Set up timer for periodic progress updates (every 2 seconds)
                    var timer = new Timer(
                        async _ => await SendProgressUpdate(content.Id, messageId, onToolUpdate),
                        null,
                        TimeSpan.FromSeconds(2),
                        TimeSpan.FromSeconds(2));
                    toolProgressTimers[content.Id] = timer;
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to send tool start notification for {ToolName}", toolName);
                }
            }
            else if (content.Type == "tool_result" && !string.IsNullOrEmpty(content.ToolUseId))
            {
                // Sometimes tool results come through assistant messages
                // Store the tool result content in the buffer
                if (!string.IsNullOrEmpty(content.Content))
                {
                    var existingBuffer = toolOutputBuffer.GetValueOrDefault(content.ToolUseId, string.Empty);
                    toolOutputBuffer[content.ToolUseId] = existingBuffer + content.Content;
                }
            }
        }
    }

    private string FormatToolUsageMessage(string toolName, object? input)
    {
        // Start with the tool name in a format that the frontend parser can understand
        var primaryMessage = GetParsableToolMessage(toolName, input);
        var detailedMessage = GetDetailedToolMessage(toolName, input);

        // Combine both: parsable format first, then detailed info
        return string.IsNullOrEmpty(detailedMessage) ? primaryMessage : $"{primaryMessage}\n\n{detailedMessage}";
    }

    private string GetParsableToolMessage(string toolName, object? input)
    {
        if (input == null)
            return $"{toolName}()";

        try
        {
            var inputElement = JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(input));

            return toolName?.ToLower() switch
            {
                "bash" => inputElement.TryGetProperty("command", out var bashCommand)
                    ? $"Bash({bashCommand.GetString()})"
                    : $"Bash()",

                "edit" => inputElement.TryGetProperty("file_path", out var editFile)
                    ? $"Edit({editFile.GetString()})"
                    : $"Edit()",

                "write" => inputElement.TryGetProperty("file_path", out var writeFile)
                    ? $"Write({writeFile.GetString()})"
                    : $"Write()",

                "read" => inputElement.TryGetProperty("file_path", out var readFile)
                    ? $"Read({readFile.GetString()})"
                    : $"Read()",

                "grep" => inputElement.TryGetProperty("pattern", out var pattern)
                    ? $"Grep({pattern.GetString()})"
                    : $"Grep()",

                "glob" => inputElement.TryGetProperty("pattern", out var globPattern)
                    ? $"Glob({globPattern.GetString()})"
                    : $"Glob()",

                "webfetch" => inputElement.TryGetProperty("url", out var url)
                    ? $"WebFetch({url.GetString()})"
                    : $"WebFetch()",

                _ => $"{toolName}(executing)"
            };
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to create parsable tool message for {ToolName}", toolName);
            return $"{toolName}()";
        }
    }

    private string GetDetailedToolMessage(string toolName, object? input)
    {
        if (input == null)
            return string.Empty;

        try
        {
            var inputElement = JsonSerializer.Deserialize<JsonElement>(JsonSerializer.Serialize(input));

            switch (toolName?.ToLower())
            {
                case "bash":
                    if (inputElement.TryGetProperty("command", out var bashCommand))
                    {
                        return $"```bash\n{bashCommand.GetString()}\n```";
                    }
                    break;

                case "edit":
                    if (inputElement.TryGetProperty("file_path", out var editFile))
                    {
                        var details = $"📝 **File:** `{editFile.GetString()}`";
                        if (inputElement.TryGetProperty("old_string", out var oldStr) &&
                            inputElement.TryGetProperty("new_string", out var newStr))
                        {
                            var oldText = oldStr.GetString() ?? "";
                            var newText = newStr.GetString() ?? "";
                            if (oldText.Length <= 100 && newText.Length <= 100)
                            {
                                details += $"\n**Replace:** `{oldText}` → `{newText}`";
                            }
                            else
                            {
                                details += $"\n**Replace:** {oldText.Length} chars → {newText.Length} chars";
                            }
                        }
                        return details;
                    }
                    break;

                case "write":
                    if (inputElement.TryGetProperty("file_path", out var writeFile))
                    {
                        var details = $"📄 **File:** `{writeFile.GetString()}`";
                        if (inputElement.TryGetProperty("content", out var content))
                        {
                            var contentStr = content.GetString() ?? "";
                            details += $"\n**Content:** {contentStr.Length} characters";
                        }
                        return details;
                    }
                    break;

                case "read":
                    if (inputElement.TryGetProperty("file_path", out var readFile))
                    {
                        return $"📖 **File:** `{readFile.GetString()}`";
                    }
                    break;

                case "grep":
                    if (inputElement.TryGetProperty("pattern", out var pattern))
                    {
                        var details = $"🔍 **Pattern:** `{pattern.GetString()}`";
                        if (inputElement.TryGetProperty("path", out var grepPath))
                        {
                            details += $"\n**In:** `{grepPath.GetString()}`";
                        }
                        return details;
                    }
                    break;

                case "glob":
                    if (inputElement.TryGetProperty("pattern", out var globPattern))
                    {
                        return $"🌐 **Pattern:** `{globPattern.GetString()}`";
                    }
                    break;

                default:
                    // For other tools, show a compact version of the input
                    var inputJson = JsonSerializer.Serialize(input, new JsonSerializerOptions { WriteIndented = false });
                    if (inputJson.Length <= 200)
                    {
                        return $"**Input:** {inputJson}";
                    }
                    break;
            }
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to format detailed tool message for {ToolName}", toolName);
        }

        return string.Empty;
    }

    private async Task ProcessUserMessage(ClaudeStreamEvent streamEvent, Func<int, string, MessageStatus, Task>? onToolUpdate)
    {
        if (streamEvent.Message?.Content == null || onToolUpdate == null)
            return;

        foreach (var content in streamEvent.Message.Content)
        {
            if (content.Type == "tool_result" && !string.IsNullOrEmpty(content.ToolUseId))
            {
                // Check if we have buffered output for this tool
                var bufferedOutput = toolOutputBuffer.GetValueOrDefault(content.ToolUseId, string.Empty);
                var finalContent = content.Content;

                // If we have buffered output but no content in the result, use the buffered output
                if (!string.IsNullOrEmpty(bufferedOutput) && string.IsNullOrEmpty(finalContent))
                {
                    finalContent = bufferedOutput;
                }
                // If we have both, combine them
                else if (!string.IsNullOrEmpty(bufferedOutput) && !string.IsNullOrEmpty(finalContent))
                {
                    finalContent = bufferedOutput + "\n" + finalContent;
                }

                if (activeToolMessages.TryGetValue(content.ToolUseId, out var messageId))
                {
                    var (resultMessage, status) = FormatToolCompletionMessage(content.ToolUseId, finalContent);

                    try
                    {
                        await onToolUpdate(messageId, resultMessage, status);
                        CleanupTool(content.ToolUseId); // Clean up all tool-related data
                    }
                    catch (Exception ex)
                    {
                        logger.LogWarning(ex, "Failed to send tool complete notification for message {MessageId}", messageId);
                    }
                }
                else
                {
                    // Try to find a tool by name if we have buffered output
                    if (!string.IsNullOrEmpty(bufferedOutput) || !string.IsNullOrEmpty(finalContent))
                    {
                        // Look for any active tool that might match
                        var possibleTool = activeToolMessages.FirstOrDefault();
                        if (possibleTool.Value != 0)
                        {
                            var toolName = GetToolNameForUseId(possibleTool.Key) ?? "Tool";
                            var (resultMessage, status) = FormatToolCompletionMessage(content.ToolUseId, finalContent);

                            try
                            {
                                await onToolUpdate(possibleTool.Value, resultMessage, status);
                                CleanupTool(possibleTool.Key);
                            }
                            catch (Exception ex)
                            {
                                logger.LogWarning(ex, "Failed to send fallback tool complete notification");
                            }
                        }
                    }
                }
            }
        }
    }

    private string FormatToolProgressMessage(string toolName, string accumulatedOutput)
    {
        // Format progressive output with streaming indicator
        var message = $"{toolName}(executing...)";

        if (!string.IsNullOrEmpty(accumulatedOutput))
        {
            // For long outputs, show only the last 300 characters to avoid overwhelming the UI
            var displayOutput = accumulatedOutput.Length > 300
                ? "..." + accumulatedOutput[^300..]
                : accumulatedOutput;

            // Check if it looks like streaming content (e.g., terminal output)
            if (accumulatedOutput.Contains('\n') || accumulatedOutput.Length > 50)
            {
                message += $"\n\n```\n{displayOutput}\n```";
            }
            else
            {
                message += $": {displayOutput}";
            }
        }

        return message;
    }

    private (string, MessageStatus) FormatToolCompletionMessage(string toolUseId, string? content)
    {
        var status = MessageStatus.Done;

        // Try to get the tool call signature (e.g., "Glob(**/CLAUDE.md)")
        var toolCallSignature = toolCallSignatures.TryGetValue(toolUseId, out var signature) ? signature : null;

        // Fallback to tool name if signature not found
        if (string.IsNullOrEmpty(toolCallSignature))
        {
            var toolName = GetToolNameForUseId(toolUseId);
            toolCallSignature = !string.IsNullOrEmpty(toolName) ? toolName : "Tool";
        }

        // Format the result message to include the tool call and its output
        var resultMessage = $"{toolCallSignature} completed";

        if (!string.IsNullOrEmpty(content))
        {
            // Include the actual tool output in the message
            resultMessage = content.Length > 1000
                ? $"{toolCallSignature}:\n{content[..1000]}..."
                : $"{toolCallSignature}:\n{content}";

            // Check if content looks like an error
            if (content.Contains("error", StringComparison.OrdinalIgnoreCase) ||
                content.Contains("failed", StringComparison.OrdinalIgnoreCase))
            {
                status = MessageStatus.Failed;
            }
        }
        else
        {
            // If content is empty, show that in the message
            resultMessage = $"{toolCallSignature}: (no output)";
        }

        return (resultMessage, status);
    }

    private readonly Dictionary<string, string> toolUseIdToName = [];

    private string? GetToolNameForUseId(string toolUseId)
    {
        return toolUseIdToName.TryGetValue(toolUseId, out var name) ? name : null;
    }

    private void CleanupTool(string toolUseId)
    {
        activeToolMessages.Remove(toolUseId);
        toolUseIdToName.Remove(toolUseId);
        toolCallSignatures.Remove(toolUseId);
        toolOutputBuffer.Remove(toolUseId);
        toolStartTimes.Remove(toolUseId);

        if (toolProgressTimers.TryGetValue(toolUseId, out var timer))
        {
            timer.Dispose();
            toolProgressTimers.Remove(toolUseId);
        }
    }

    private async Task SendProgressUpdate(string toolUseId, int messageId, Func<int, string, MessageStatus, Task>? onToolUpdate)
    {
        if (onToolUpdate == null || !activeToolMessages.ContainsKey(toolUseId))
            return;

        try
        {
            var toolName = GetToolNameForUseId(toolUseId) ?? "Tool";
            var elapsed = toolStartTimes.TryGetValue(toolUseId, out var startTime)
                ? DateTime.UtcNow - startTime
                : TimeSpan.Zero;

            var progressMessage = $"{toolName}(executing... {elapsed.TotalSeconds:F0}s)";

            // Add any buffered output
            if (toolOutputBuffer.TryGetValue(toolUseId, out var bufferedOutput) && !string.IsNullOrEmpty(bufferedOutput))
            {
                progressMessage = FormatToolProgressMessage(toolName, bufferedOutput);
            }

            await onToolUpdate(messageId, progressMessage, MessageStatus.Working);
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to send periodic progress update for tool {ToolUseId}", toolUseId);
        }
    }

    private async Task ProcessMessageStart(ClaudeStreamEvent streamEvent, Func<string, string, Task<int>>? onToolStart)
    {
        // Message start initializes the conversation
        // Message metadata can be captured here if needed
    }

    private async Task ProcessMessageDelta(ClaudeStreamEvent streamEvent, Func<int, string, MessageStatus, Task>? onToolUpdate)
    {
        // Message delta contains top-level message changes
        // Stop reason and usage information can be captured here
    }

    private async Task ProcessMessageStop(ClaudeStreamEvent streamEvent, Func<int, string, MessageStatus, Task>? onToolUpdate)
    {
        // Message stop indicates the end of the message
    }

    private async Task ProcessContentBlockStart(ClaudeStreamEvent streamEvent, Func<string, string, Task<int>>? onToolStart, Func<int, string, MessageStatus, Task>? onToolUpdate)
    {
        if (streamEvent.ContentBlock == null || streamEvent.Index == null)
            return;

        var blockType = streamEvent.ContentBlock.Type;

        // Handle tool_use content blocks
        if (blockType == "tool_use" && !string.IsNullOrEmpty(streamEvent.ContentBlock.Id) && onToolStart != null)
        {
            var toolName = streamEvent.ContentBlock.Name ?? "Unknown Tool";
            var toolStartMessage = FormatToolUsageMessage(toolName, streamEvent.ContentBlock.Input);

            try
            {
                var messageId = await onToolStart(toolName, toolStartMessage);
                activeToolMessages[streamEvent.ContentBlock.Id] = messageId;
                toolUseIdToName[streamEvent.ContentBlock.Id] = toolName;
                var parsableMessage = GetParsableToolMessage(toolName, streamEvent.ContentBlock.Input);
                toolCallSignatures[streamEvent.ContentBlock.Id] = parsableMessage;

                // Initialize tracking for this tool
                toolStartTimes[streamEvent.ContentBlock.Id] = DateTime.UtcNow;
                toolOutputBuffer[streamEvent.ContentBlock.Id] = string.Empty;
                contentBlockIndexToToolId[streamEvent.Index.Value] = streamEvent.ContentBlock.Id;

                // Set up progress timer
                var timer = new Timer(
                    async _ => await SendProgressUpdate(streamEvent.ContentBlock.Id, messageId, onToolUpdate),
                    null,
                    TimeSpan.FromSeconds(2),
                    TimeSpan.FromSeconds(2));
                toolProgressTimers[streamEvent.ContentBlock.Id] = timer;
            }
            catch (Exception ex)
            {
                logger.LogWarning(ex, "Failed to start tool {ToolName}", toolName);
            }
        }
    }

    private readonly Dictionary<int, string> contentBlockIndexToToolId = [];

    private async Task ProcessContentBlockDelta(ClaudeStreamEvent streamEvent, Func<int, string, MessageStatus, Task>? onToolUpdate)
    {
        if (streamEvent.Delta == null || streamEvent.Index == null || onToolUpdate == null)
            return;

        // Handle text deltas
        if (streamEvent.Delta.Type == "text_delta" && !string.IsNullOrEmpty(streamEvent.Delta.Text))
        {
            // This could be assistant text or tool output
            // If we're tracking a tool at this index, append to its buffer
            if (contentBlockIndexToToolId.TryGetValue(streamEvent.Index.Value, out var toolId)
                && activeToolMessages.TryGetValue(toolId, out var messageId))
            {
                var existingOutput = toolOutputBuffer.GetValueOrDefault(toolId, string.Empty);
                toolOutputBuffer[toolId] = existingOutput + streamEvent.Delta.Text;

                var toolName = GetToolNameForUseId(toolId) ?? "Tool";
                var progressMessage = FormatToolProgressMessage(toolName, toolOutputBuffer[toolId]);

                try
                {
                    await onToolUpdate(messageId, progressMessage, MessageStatus.Working);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to update tool delta for {ToolId}", toolId);
                }
            }
        }
        // Handle partial JSON deltas for tool inputs
        else if (streamEvent.Delta.Type == "input_json_delta" && !string.IsNullOrEmpty(streamEvent.Delta.PartialJson))
        {
            if (contentBlockIndexToToolId.TryGetValue(streamEvent.Index.Value, out var toolId)
                && activeToolMessages.TryGetValue(toolId, out var messageId))
            {
                // Accumulate partial JSON for tool input
                var existingOutput = toolOutputBuffer.GetValueOrDefault(toolId, string.Empty);
                toolOutputBuffer[toolId] = existingOutput + streamEvent.Delta.PartialJson;

                var toolName = GetToolNameForUseId(toolId) ?? "Tool";
                var progressMessage = $"{toolName}(receiving input...)";

                try
                {
                    await onToolUpdate(messageId, progressMessage, MessageStatus.Working);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to update tool input delta for {ToolId}", toolId);
                }
            }
        }
    }

    private async Task ProcessContentBlockStop(ClaudeStreamEvent streamEvent, Func<int, string, MessageStatus, Task>? onToolUpdate)
    {
        if (streamEvent.Index == null)
            return;

        // Check if this was a tool block and it has accumulated output
        if (contentBlockIndexToToolId.TryGetValue(streamEvent.Index.Value, out var toolId))
        {
            // If this tool has output but hasn't been finalized yet, keep the buffer
            // The tool_result event should handle the final output
            contentBlockIndexToToolId.Remove(streamEvent.Index.Value);

            // Note: We don't clean up the tool or send final update here as tool_result will handle it
            // The buffer is preserved for when the tool_result arrives
        }
    }

    private async Task ProcessErrorEvent(ClaudeStreamEvent streamEvent, Func<int, string, MessageStatus, Task>? onToolUpdate)
    {
        if (streamEvent.Error == null)
            return;

        logger.LogError("Received streaming error: Type={Type}, Message={Message}",
                       streamEvent.Error.Type, streamEvent.Error.Message);

        // Update any active tool messages to show error status
        if (onToolUpdate != null)
        {
            foreach (var (toolId, messageId) in activeToolMessages)
            {
                try
                {
                    var toolName = GetToolNameForUseId(toolId) ?? "Tool";
                    var errorMessage = $"{toolName}: Error - {streamEvent.Error.Message}";
                    await onToolUpdate(messageId, errorMessage, MessageStatus.Failed);
                    CleanupTool(toolId);
                }
                catch (Exception ex)
                {
                    logger.LogWarning(ex, "Failed to update tool error for {ToolId}", toolId);
                }
            }
        }
    }

    private async Task ProcessUnknownEvent(ClaudeStreamEvent streamEvent, Func<int, string, MessageStatus, Task>? onToolUpdate)
    {
        // Unknown event types are logged for debugging in development
    }

    // Helper to run a command and capture output with better error handling
    private static string RunCommand(string cmd, string args)
    {
        try
        {
            var psi = new ProcessStartInfo
            {
                FileName = cmd,
                Arguments = args,
            };
            ProcessHelpers.HideProcessWindow(psi);

            using var proc = Process.Start(psi) 
                ?? throw new InvalidOperationException($"Failed to start process: {cmd} {args}");

            // Set priority to prevent focus stealing
            try
            {
                proc.PriorityClass = ProcessPriorityClass.BelowNormal;
            }
            catch
            {
                // Ignore priority setting errors
            }

            proc.WaitForExit(10000); // 10 second timeout

            if (!proc.HasExited)
            {
                proc.Kill();
                throw new TimeoutException($"Command timed out: {cmd} {args}");
            }

            if (proc.ExitCode != 0)
            {
                var stderr = proc.StandardError.ReadToEnd();
                throw new InvalidOperationException($"Command failed with exit code {proc.ExitCode}: {cmd} {args}. Error: {stderr}");
            }

            return proc.StandardOutput.ReadToEnd();
        }
        catch (Exception ex) when (!(ex is InvalidOperationException || ex is TimeoutException))
        {
            throw new InvalidOperationException($"Failed to execute command: {cmd} {args}", ex);
        }
    }

}
file class ClaudeResponse
{
    [JsonPropertyName("result")]
    public string? Result { get; set; }

    [JsonPropertyName("session_id")]
    public int? SessionId { get; set; }

    [JsonPropertyName("error")]
    public string? Error { get; set; }
}
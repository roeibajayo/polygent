using Microsoft.Extensions.Logging;
using Polygent.Logic.Agent.Interfaces;
using Polygent.Logic.Agent.Models;
using Polygent.Logic.Helpers;
using RoeiBajayo.Infrastructure.DependencyInjection.Attributes;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace Polygent.Logic.Agent.Providers;

[KeyedService(MessageProcessorProviderType.GeminiCli)]
internal class GeminiCliProvider(
    ILogger<GeminiCliProvider> logger)
    : IMessageProcessorProvider, ISingletonService<IMessageProcessorProvider>
{
    private const string TEMP_FILE_NAME = "temp_gemini_{0}.md";

    public async Task<ProcessMessageResponse> ProcessMessageAsync(
        ProcessMessageRequest message,
        CancellationToken cancellationToken)
    {
        // Detect OS and resolve Gemini path with cross-platform support
        string geminiPath;

        if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
        {
            // Try multiple common Windows installation paths
            var possiblePaths = new[]
            {
                "gemini.cmd", // If in PATH
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData), "Programs", "gemini", "gemini.cmd"),
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "npm", "gemini.cmd")
            };

            geminiPath = possiblePaths.FirstOrDefault(File.Exists) ?? "gemini.cmd";
        }
        else
        {
            // For Linux/macOS, check common paths
            var possiblePaths = new[]
            {
                "gemini", // If in PATH
                "/usr/local/bin/gemini",
                Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.UserProfile), ".local", "bin", "gemini")
            };

            geminiPath = possiblePaths.FirstOrDefault(File.Exists) ?? "gemini";
        }

        var filename = geminiPath;
        // Use prompt argument as documented in Gemini CLI help
        var arguments = $"--prompt \"{message.Message.Replace("\"", "\\\"")}\"";

        // Add model support (documented: -m, --model)
        if (!string.IsNullOrEmpty(message.Model))
        {
            var model = message.Model switch
            {
                "gemini-cli-pro-2.5" => "gemini-2.5-pro",
                "gemini-cli-flash-2.5" => "gemini-2.5-flash",
                "gemini-cli-flash-1.5" => "gemini-1.5-flash",
                "gemini-cli-pro-1.5" => "gemini-1.5-pro",
                _ => message.Model
            };

            if (!string.IsNullOrEmpty(model))
                arguments += $" --model {model}";
        }

        // Add debug mode (documented: -d, --debug)
        arguments += " --debug";

        // Add YOLO mode for non-interactive execution (documented: -y, --yolo)
        arguments += " --yolo";

        // Normalize working directory path for cross-platform compatibility
        var workingDirectory = Path.GetFullPath(message.WorkingDirectory);

        // Verify working directory exists
        if (!Directory.Exists(workingDirectory))
        {
            throw new DirectoryNotFoundException($"Working directory does not exist: {workingDirectory}");
        }

        // Handle system prompt via GEMINI.md file (documented approach in Gemini CLI docs)
        string? tempFileName = null;
        if (!string.IsNullOrEmpty(message.SystemPrompt))
        {
            tempFileName = string.Format(TEMP_FILE_NAME, Guid.CreateVersion7().ToString());
            var tempFilePath = Path.Combine(workingDirectory, tempFileName);
            File.WriteAllText(tempFilePath, message.SystemPrompt);
        }

        // Note: MCP config via --mcp-config flag is not documented in Gemini CLI help
        // MCP servers are managed via separate 'gemini mcp' command
        // So we skip MCP config file support here

        logger.LogInformation("{WorkingDir}: {FileName} {Arguments}", workingDirectory, filename, arguments);

        var processInfo = new ProcessStartInfo
        {
            FileName = filename,
            Arguments = arguments,
            WorkingDirectory = workingDirectory,
        };
        ProcessHelpers.HideProcessWindow(processInfo);

        // Set environment variables for Gemini system prompt (documented approach)
        if (!string.IsNullOrEmpty(message.SystemPrompt) && tempFileName != null)
        {
            processInfo.EnvironmentVariables["GEMINI_SYSTEM_MD"] = tempFileName;
        }

        using var process = Process.Start(processInfo);
        if (process is null)
        {
            logger.LogError("Failed to start Gemini process");
            throw new InvalidOperationException($"Gemini process error: Failed to start Gemini process");
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

        // Fallback to original implementation when no tool callbacks are provided
        var output = await process.StandardOutput.ReadToEndAsync(cancellationToken);
        var error = await process.StandardError.ReadToEndAsync(cancellationToken);
        await process.WaitForExitAsync(cancellationToken);

        // Clean up temp file
        if (tempFileName != null && File.Exists(Path.Combine(workingDirectory, tempFileName)))
            File.Delete(Path.Combine(workingDirectory, tempFileName));

        if (!string.IsNullOrEmpty(error))
        {
            logger.LogError("Gemini process error: {Error}", error);
            throw new InvalidOperationException($"Gemini process error: {error}");
        }

        if (string.IsNullOrEmpty(output))
        {
            logger.LogError("Gemini process returned empty output");
            throw new InvalidOperationException($"Gemini process error: No output received from Gemini");
        }

        logger.LogDebug("Gemini process output: {Output}", output);
        return new ProcessMessageResponse(output, null);
    }
}
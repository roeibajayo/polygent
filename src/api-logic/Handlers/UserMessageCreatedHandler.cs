using MediatorCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Agent.Interfaces;
using Polygent.Logic.Agent.Models;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;

namespace Polygent.Logic.Handlers;

internal record UserMessageCreateMessage(MessageEntity Message) : IRequestMessage;

internal class UserMessageCreatedHandler(
    PolygentContext context,
    INotificationService notificationService,
    IServiceProvider serviceProvider,
    IStorageService storageService,
    IMessageService messageService,
    ISessionManagement sessionManagement,
    IMessageProcessingManager messageProcessingManager,
    ILogger<UserMessageCreatedHandler> logger)
    : IRequestHandler<UserMessageCreateMessage>
{
    public async Task HandleAsync(UserMessageCreateMessage message, CancellationToken cancellationToken)
    {
        var sessionId = message.Message.SessionId;
        int? agentMessageId = null;

        // Create a combined cancellation token that can be cancelled externally or by the system
        using var processingCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        var processingToken = processingCts.Token;

        await messageService.UpdateMessageAsync(message.Message.Id, new(
            null,
            Status: MessageStatus.Done
        ), processingToken);

        try
        {
            // Get session and agent information
            var session = await context.Sessions
                .Include(s => s.Agent)
                .FirstOrDefaultAsync(s => s.Id == sessionId, processingToken)
                ?? throw new InvalidOperationException($"Session {sessionId} not found");

            // Update session status to InProgress
            session.Status = SessionStatus.InProgress;
            session.UpdatedAt = DateTime.UtcNow;
            context.Sessions.Update(session);
            await context.SaveChangesAsync(processingToken);

            // Send session status update
            await notificationService.SendSessionStatusChanged(sessionId, SessionStatus.InProgress);

            // Get workspace path for the session and ensure it exists
            var workspacePath = storageService.EnsureSessionPath(session.WorkspaceId, sessionId);

            // Get MCP config path if it exists
            var mcpConfigPath = GetMcpConfigPath(session.WorkspaceId, sessionId);

            // Prepare the process message request
            var processRequest = new ProcessMessageRequest
            {
                Message = message.Message.Content,
                SystemPrompt = session.Agent.SystemPrompt,
                Model = session.Agent.Model,
                WorkingDirectory = workspacePath,
                ProviderSessionId = session.ProviderSessionId?.ToString(),
                McpConfigPath = mcpConfigPath,
                OnToolStart = async (toolName, toolMessage) =>
                {
                    var toolMessageId = await messageService.CreateMessageAsync(sessionId, new(
                        MessageType.Tool,
                        toolMessage,
                        null,
                        message.Message.Id,
                        MessageStatus.Working
                    ), processingToken);

                    return toolMessageId;
                },
                OnToolUpdate = async (toolMessageId, content, status) =>
                {
                    // Update the tool message
                    await messageService.UpdateMessageAsync(toolMessageId, new(
                        Content: content,
                        Status: status
                    ), processingToken);

                    // Update the agent message timestamp to be 1ms after the tool message
                    // This ensures the agent message always appears last in chronological order
                    if (agentMessageId.HasValue)
                    {
                        await messageService.UpdateMessageTimestampAsync(agentMessageId.Value, DateTime.UtcNow, processingToken);
                    }
                }
            };

            // Get the appropriate provider based on agent model
            var providerType = GetProviderTypeFromModel(session.Agent.Model);
            var messageProcessorProvider = serviceProvider.GetKeyedService<IMessageProcessorProvider>(providerType)
                ?? throw new InvalidOperationException($"No message processor provider found for agent model: {session.Agent.Model}");

            // Creating a agent message
            agentMessageId = await messageService.CreateMessageAsync(sessionId, new(
                MessageType.Agent,
                "Processing your request...",
                null,
                message.Message.Id,
                Status: MessageStatus.Working
            ), processingToken);

            // Register the agent message for cancellation
            messageProcessingManager.RegisterMessageProcessing(agentMessageId.Value, sessionId, processingCts);

            // Process the message using the provider
            var response = await messageProcessorProvider.ProcessMessageAsync(processRequest, processingToken);

            // Update the session with the provider session ID if available
            if (!string.IsNullOrEmpty(response.ProviderSessionId) && response.ProviderSessionId != session.ProviderSessionId)
            {
                session.ProviderSessionId = response.ProviderSessionId;
                context.Sessions.Update(session);
                await context.SaveChangesAsync(processingToken);
            }

            // Update message status based on success
            await messageService.UpdateMessageAsync(agentMessageId.Value, new(
                response.Content,
                MessageStatus.Done
            ), processingToken);

            // Unregister the message processing since it's completed
            messageProcessingManager.UnregisterMessageProcessing(agentMessageId.Value);

            logger.LogInformation("Successfully processed user message for session {SessionId}", sessionId);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while processing user message for session {SessionId}.", sessionId);

            if (agentMessageId.HasValue)
            {
                // Update the agent message status to Failed
                await messageService.UpdateMessageAsync(agentMessageId.Value, new(
                    Content: "Failed to process your request.",
                    Status: MessageStatus.Failed
                ), CancellationToken.None);

                // Unregister the message processing since it failed
                messageProcessingManager.UnregisterMessageProcessing(agentMessageId.Value);
            }

            if (ex is not OperationCanceledException)
                throw;
        }
        finally
        {
            var updateRequest = new UpdateSessionRequest(SessionStatus.Waiting, null);
            await sessionManagement.UpdateAsync(sessionId, updateRequest, CancellationToken.None);
        }
    }

    public async Task? HandleExceptionAsync(UserMessageCreateMessage message, Exception exception, int retries, Func<Task> retry, CancellationToken cancellationToken)
    {
        logger.LogError(exception, "Failed to process user message for session {SessionId}.", message.Message.SessionId);
        // Optionally, update the message status to Failed
        await messageService.UpdateMessageAsync(message.Message.Id, new(Status: MessageStatus.Failed), cancellationToken);
    }

    private static MessageProcessorProviderType GetProviderTypeFromModel(string model)
    {
        return model.ToLowerInvariant() switch
        {
            var m when m.Contains("claude") => MessageProcessorProviderType.ClaudeCode,
            var m when m.Contains("gemini") => MessageProcessorProviderType.GeminiCli,
            _ => MessageProcessorProviderType.ClaudeCode // Default fallback
        };
    }

    private string? GetMcpConfigPath(int workspaceId, int sessionId)
    {
        try
        {
            var filesPath = storageService.GetFilesPath(workspaceId);
            var mcpConfigFileName = $"mcp-session-{sessionId}.json";
            var mcpConfigPath = Path.Combine(filesPath, mcpConfigFileName);
            
            // Only return the path if the file exists
            return File.Exists(mcpConfigPath) ? mcpConfigPath : null;
        }
        catch (Exception ex)
        {
            logger.LogWarning(ex, "Failed to get MCP config path for workspace {WorkspaceId}, session {SessionId}.", workspaceId, sessionId);
            return null;
        }
    }
}

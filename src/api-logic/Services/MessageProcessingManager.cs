using Microsoft.Extensions.Logging;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;
using System.Collections.Concurrent;

namespace Polygent.Logic.Services;

internal sealed class MessageProcessingManager(
    IMessageRepository messageRepository,
    IMessageService messageService,
    ILogger<MessageProcessingManager> logger)
    : IMessageProcessingManager, IScopedService<IMessageProcessingManager>
{
    private static readonly ConcurrentDictionary<int, (CancellationTokenSource TokenSource, int SessionId)> _processingMessages = new();

    public void RegisterMessageProcessing(int messageId, int sessionId, CancellationTokenSource cancellationTokenSource)
    {
        _processingMessages.TryAdd(messageId, (cancellationTokenSource, sessionId));
        logger.LogInformation("Registered message processing for message {MessageId} in session {SessionId}", messageId, sessionId);
    }

    public async Task<bool> CancelMessageProcessingAsync(int messageId)
    {
        try
        {
            if (_processingMessages.TryRemove(messageId, out var processing))
            {
                processing.TokenSource.Cancel();
                logger.LogInformation("Canceled processing for message {MessageId}", messageId);

                // Update message status to Failed
                await UpdateMessageStatusToFailed(messageId);
                return true;
            }

            logger.LogWarning("Message {MessageId} not found in processing operations", messageId);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to cancel processing for message {MessageId}", messageId);
            return false;
        }
    }

    public async Task<bool> CancelSessionWorkingMessagesAsync(int sessionId)
    {
        try
        {
            var sessionMessages = _processingMessages
                .Where(kvp => kvp.Value.SessionId == sessionId)
                .ToList();

            if (sessionMessages.Count == 0)
            {
                var messages = await messageRepository.GetBySessionIdAsync(sessionId, CancellationToken.None);
                foreach (var message in messages.Where(m => m.Status == MessageStatus.Working))
                {
                    await UpdateMessageStatusToFailed(message.Id);
                }
            }

            var cancelledCount = 0;
            foreach (var (messageId, (tokenSource, _)) in sessionMessages)
            {
                if (_processingMessages.TryRemove(messageId, out _))
                {
                    tokenSource.Cancel();
                    cancelledCount++;
                }
            }

            logger.LogInformation("Canceled {CanceledCount} working messages for session {SessionId}", cancelledCount, sessionId);
            return cancelledCount > 0;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to cancel working messages for session {SessionId}", sessionId);
            return false;
        }
    }

    public void UnregisterMessageProcessing(int messageId)
    {
        if (_processingMessages.TryRemove(messageId, out _))
        {
            logger.LogInformation("Unregistered message processing for message {MessageId}", messageId);
        }
    }

    public IEnumerable<int> GetProcessingMessageIds(int sessionId)
    {
        return _processingMessages
            .Where(kvp => kvp.Value.SessionId == sessionId)
            .Select(kvp => kvp.Key);
    }

    private async Task UpdateMessageStatusToFailed(int messageId)
    {
        try
        {
            var message = await messageRepository.GetByIdAsync(messageId, CancellationToken.None);
            if (message != null)
            {
                // Use MessageService to update status - this handles SignalR notifications automatically
                await messageService.UpdateMessageAsync(messageId, new UpdateMessageRequest(
                    Status: MessageStatus.Failed
                ), CancellationToken.None);

                logger.LogInformation("Updated message {MessageId} status to Failed", messageId);
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to update message {MessageId} status to Failed", messageId);
        }
    }
}
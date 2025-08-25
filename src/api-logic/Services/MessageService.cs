using MediatorCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Context;
using Polygent.Logic.Handlers;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Services;

internal sealed class MessageService(
    ILogger<MessageService> logger,
    IMessageRepository messageRepository,
    ISessionRepository sessionRepository,
    INotificationService notificationService,
    IPublisher publisher,
    ISessionPresenceService sessionPresenceService,
    PolygentContext context)
    : IMessageService, IScopedService<IMessageService>
{
    public async Task<MessageEntity[]> GetMessagesAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            return await messageRepository.GetBySessionIdAsync(sessionId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting messages for session {SessionId}.", sessionId);
            throw;
        }
    }

    public async Task<MessageEntity?> GetMessageAsync(int messageId, CancellationToken cancellationToken)
    {
        try
        {
            return await messageRepository.GetByIdAsync(messageId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting message {MessageId}.", messageId);
            throw;
        }
    }

    public async Task<int> CreateMessageAsync(int sessionId, CreateMessageRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var now = DateTime.UtcNow;

            var messageEntity = new MessageEntity(
                0, // Id will be set by the repository
                sessionId,
                request.Type,
                request.Content,
                request.Status,
                request.Metadata,
                request.ParentMessageId,
                now,
                now
            );

            var messageId = await messageRepository.CreateAsync(messageEntity, cancellationToken);
            var notificationEntity = messageEntity with { Id = messageId };

            logger.LogInformation("Created message {MessageId} for session {SessionId}.", messageId, sessionId);

            if (request.Type == MessageType.User)
            {
                publisher.Publish(new TryPullUserMessageMessage(), CancellationToken.None);
            }
            else
            {
                // Send SignalR notification
                await notificationService.SendMessageReceived(sessionId, notificationEntity);
            }

            return messageId;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating message for session {SessionId}.", sessionId);
            throw;
        }
    }

    public async Task<bool> UpdateMessageAsync(int messageId, UpdateMessageRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var message = await messageRepository.GetByIdAsync(messageId, cancellationToken);

            if (message is null)
            {
                logger.LogWarning("Message {MessageId} not found for update.", messageId);
                return false;
            }

            var hasChanges = false;
            var updatedContent = message.Content;
            var updatedStatus = message.Status;
            var updatedMetadata = message.Metadata;

            if (request.Content is not null && request.Content != message.Content)
            {
                updatedContent = request.Content;
                hasChanges = true;
            }

            if (request.Status is not null && request.Status != message.Status)
            {
                updatedStatus = request.Status.Value;
                hasChanges = true;
            }

            if (request.Metadata is not null && request.Metadata != message.Metadata)
            {
                updatedMetadata = request.Metadata;
                hasChanges = true;
            }

            if (!hasChanges)
            {
                return true; // No changes needed
            }

            var updatedMessage = message with
            {
                Content = updatedContent,
                Status = updatedStatus,
                Metadata = updatedMetadata,
                UpdatedAt = DateTime.UtcNow
            };

            var result = await messageRepository.UpdateAsync(updatedMessage, cancellationToken);

            if (result)
            {
                logger.LogInformation("Updated message {MessageId}.", messageId);

                // Handle Agent messages - set HasUnreadMessage if user is not currently active in session
                if (updatedMessage.Type == MessageType.Agent && updatedMessage.Status is not MessageStatus.Working and not MessageStatus.Pending)
                {
                    var isSessionActive = await sessionPresenceService.IsSessionActive(updatedMessage.SessionId);
                    if (!isSessionActive)
                    {
                        // User is not currently active in this session, mark as having unread messages
                        var session = await sessionRepository.GetByIdAsync(updatedMessage.SessionId, cancellationToken);
                        if (session != null)
                        {
                            var updatedSession = session with
                            {
                                HasUnreadMessage = true,
                                UpdatedAt = DateTime.UtcNow
                            };
                            await sessionRepository.UpdateAsync(updatedSession, cancellationToken);
                            await notificationService.SendSessionUnreadMessageChanged(updatedMessage.SessionId, true);
                            logger.LogInformation("Marked session {SessionId} as having unread messages.", updatedMessage.SessionId);
                        }
                    }
                }

                // Send SignalR notification with content if it changed
                var contentToSend = request.Content is not null && request.Content != message.Content
                    ? updatedContent
                    : null;
                await notificationService.SendMessageStatusChanged(message.SessionId, messageId, updatedStatus, contentToSend, updatedMessage.UpdatedAt);
            }

            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating message {MessageId}.", messageId);
            throw;
        }
    }

    public async Task<bool> UpdateMessageTimestampAsync(int messageId, DateTime updatedAt, CancellationToken cancellationToken)
    {
        try
        {
            var message = await messageRepository.GetByIdAsync(messageId, cancellationToken);

            if (message is null)
            {
                logger.LogWarning("Message {MessageId} not found for timestamp update.", messageId);
                return false;
            }

            var updatedMessage = message with
            {
                UpdatedAt = updatedAt
            };

            var result = await messageRepository.UpdateAsync(updatedMessage, cancellationToken);

            if (result)
            {
                logger.LogInformation("Updated message {MessageId} timestamp to {UpdatedAt}.", messageId, updatedAt);

                // Send SignalR notification for timestamp update (no content change)
                await notificationService.SendMessageStatusChanged(message.SessionId, messageId, message.Status, null, updatedAt);
            }

            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating message {MessageId} timestamp.", messageId);
            throw;
        }
    }

    public async Task<bool> DeleteMessageAsync(int messageId, CancellationToken cancellationToken)
    {
        try
        {
            var result = await messageRepository.DeleteAsync(messageId, cancellationToken);

            if (result)
            {
                logger.LogInformation("Deleted message {MessageId}.", messageId);
            }
            else
            {
                logger.LogWarning("Message {MessageId} not found for deletion.", messageId);
            }

            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting message {MessageId}.", messageId);
            throw;
        }
    }
}
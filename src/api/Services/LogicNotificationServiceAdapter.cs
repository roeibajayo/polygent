using Polygent.Dtos;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Services;

internal sealed class LogicNotificationServiceAdapter(INotificationService notificationService)
    : Logic.Interfaces.INotificationService, IScopedService<Logic.Interfaces.INotificationService>
{
    public async Task SendSessionStatusChanged(int sessionId, SessionStatus status)
    {
        await notificationService.SendSessionStatusChanged(sessionId, status);
    }

    public async Task SendSessionUnreadMessageChanged(int sessionId, bool hasUnreadMessage)
    {
        await notificationService.SendSessionUnreadMessageChanged(sessionId, hasUnreadMessage);
    }

    public async Task SendMessageReceived(int sessionId, MessageEntity message)
    {
        var messageDto = new MessageDto(
            message.Id,
            message.SessionId,
            message.Type,
            message.Content,
            message.Status,
            message.Metadata,
            message.ParentMessageId,
            message.CreatedAt,
            message.UpdatedAt
        );

        await notificationService.SendMessageReceived(sessionId, messageDto);
    }

    public async Task SendMessageStatusChanged(int sessionId, int messageId, MessageStatus status, string? content = null, DateTime? updatedAt = null)
    {
        await notificationService.SendMessageStatusChanged(sessionId, messageId, status, content, updatedAt);
    }

    public Task SendTaskStatusChanged(int taskId, int contextId, bool isSession, Guid taskExecutionId, Logic.Interfaces.TaskStatus status)
    {
        return notificationService.SendTaskStatusChanged(taskId, contextId, isSession, taskExecutionId, status);
    }

    public Task SendTaskOutputChanged(int taskId, int contextId, bool isSession, Guid taskExecutionId, string output)
    {
        return notificationService.SendTaskOutputChanged(taskId, contextId, isSession, taskExecutionId, output);
    }
}
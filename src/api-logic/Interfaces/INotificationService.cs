namespace Polygent.Logic.Interfaces;

public interface INotificationService
{
    Task SendSessionStatusChanged(int sessionId, SessionStatus status);
    Task SendSessionUnreadMessageChanged(int sessionId, bool hasUnreadMessage);
    Task SendMessageReceived(int sessionId, MessageEntity message);
    Task SendMessageStatusChanged(int sessionId, int messageId, MessageStatus status, string? content = null, DateTime? updatedAt = null);
    Task SendTaskStatusChanged(int taskId, int contextId, bool isSession, Guid taskExecutionId, TaskStatus status);
    Task SendTaskOutputChanged(int taskId, int contextId, bool isSession, Guid taskExecutionId, string output);
}
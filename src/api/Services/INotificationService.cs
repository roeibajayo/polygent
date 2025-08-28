using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Services;

public interface INotificationService
{
    Task SendSessionStatusChanged(int sessionId, SessionStatus status);
    Task SendSessionUnreadMessageChanged(int sessionId, bool hasUnreadMessage);
    Task SendMessageReceived(int sessionId, MessageDto message);
    Task SendMessageStatusChanged(int sessionId, int messageId, MessageStatus status, string? content = null, DateTime? updatedAt = null);
    Task SendTaskStatusChanged(int taskId, int contextId, bool isSession, Guid taskExecutionId, Logic.Interfaces.TaskStatus status);
    Task SendTaskOutputChanged(int taskId, int contextId, bool isSession, Guid taskExecutionId, string output);
}
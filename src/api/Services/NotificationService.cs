using Microsoft.AspNetCore.SignalR;
using Polygent.Api.Dtos;
using Polygent.Api.Hubs;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Api.Services;

public class NotificationService(IHubContext<PolygentHub> hubContext) 
    : INotificationService, IScopedService<INotificationService>
{
    public async Task SendSessionStatusChanged(int sessionId, SessionStatus status)
    {
        await hubContext.Clients.All
            .SendAsync("SessionStatusChanged", sessionId, status);
    }

    public async Task SendSessionUnreadMessageChanged(int sessionId, bool hasUnreadMessage)
    {
        await hubContext.Clients.All
            .SendAsync("SessionUnreadMessageChanged", sessionId, hasUnreadMessage);
    }

    public async Task SendMessageReceived(int sessionId, MessageDto message)
    {
        await hubContext.Clients.All
            .SendAsync("MessageReceived", sessionId, message);
    }

    public async Task SendMessageStatusChanged(int sessionId, int messageId, MessageStatus status, string? content = null, DateTime? updatedAt = null)
    {
        await hubContext.Clients.All
            .SendAsync("MessageStatusChanged", sessionId, messageId, status, content, updatedAt ?? DateTime.UtcNow);
    }

    public Task SendTaskStatusChanged(int taskId, int contextId, bool isSession, Guid taskExecutionId, Logic.Interfaces.TaskStatus status)
    {
        return hubContext.Clients.All
            .SendAsync("TaskStatusChanged", taskId, contextId, isSession, taskExecutionId, status);
    }

    public Task SendTaskOutputChanged(int taskId, int contextId, bool isSession, Guid taskExecutionId, string output)
    {
        return hubContext.Clients.All
            .SendAsync("TaskOutputChanged", taskId, contextId, isSession, taskExecutionId, output);
    }
}
using MediatorCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;

namespace Polygent.Logic.Handlers;

internal record TryPullUserMessageMessage : IRequestMessage;

internal class TryPullUserMessageHandler(
    PolygentContext context,
    IPublisher publisher,
    ILogger<TryPullUserMessageHandler> logger)
    : IRequestHandler<TryPullUserMessageMessage>
{
    const int MAX_ACTIVE_SESSIONS = 2;

    public async Task HandleAsync(TryPullUserMessageMessage message, CancellationToken cancellationToken)
    {
        var activeSessions = await context.Sessions
            .Where(s => s.Status == SessionStatus.InProgress)
            .CountAsync(cancellationToken);

        var left = MAX_ACTIVE_SESSIONS - activeSessions;

        if (left <= 0)
        {
            logger.LogInformation("Maximum active sessions reached. Cannot pull user message.");
            return;
        }

        var messages = await context.Messages
            .Where(s => s.Type == MessageType.User && s.Status == MessageStatus.Pending)
            .OrderBy(x => x.CreatedAt)
            .Take(left)
            .ToArrayAsync(cancellationToken);

        foreach (var x in messages)
        {
            publisher.Publish(new UserMessageCreateMessage(new MessageEntity(
                x.Id,
                x.SessionId,
                x.Type,
                x.Content,
                x.Status,
                x.Metadata,
                x.ParentMessageId,
                x.CreatedAt,
                x.UpdatedAt
            )), cancellationToken);
        }
    }

    public Task? HandleExceptionAsync(TryPullUserMessageMessage message, Exception exception, int retries, Func<Task> retry, CancellationToken cancellationToken)
    {
        logger.LogError(exception, "Exception occurred while trying to pull user message");
        return Task.CompletedTask;
    }
}

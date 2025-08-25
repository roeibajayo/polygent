using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Context;
using Polygent.Logic.Interfaces;
using Polygent.Logic.Models;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Repositories;

internal sealed class MessageRepository(ILogger<MessageRepository> logger, PolygentContext context)
    : IMessageRepository, IScopedService<IMessageRepository>
{
    public async Task<int> CreateAsync(MessageEntity message, CancellationToken cancellationToken)
    {
        try
        {
            // Use a transaction to ensure atomicity
            using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // Validate that the session exists
                var sessionExists = await context.Sessions
                    .AsNoTracking()
                    .AnyAsync(s => s.Id == message.SessionId, cancellationToken);

                if (!sessionExists)
                {
                    logger.LogError("Session {SessionId} does not exist when creating message.", message.SessionId);
                    throw new InvalidOperationException($"Session {message.SessionId} does not exist. Cannot create message.");
                }

                // Validate that the parent message exists (if provided)
                if (message.ParentMessageId > 0)
                {
                    logger.LogInformation("Validating parent message {ParentMessageId} exists.", message.ParentMessageId.Value);
                    var parentMessageExists = await context.Messages
                        .AsNoTracking()
                        .AnyAsync(m => m.Id == message.ParentMessageId.Value, cancellationToken);

                    if (!parentMessageExists)
                    {
                        logger.LogError("Parent message {ParentMessageId} does not exist when creating message.", message.ParentMessageId.Value);
                        throw new InvalidOperationException($"Parent message {message.ParentMessageId.Value} does not exist. Cannot create message.");
                    }
                }

                var model = new MessageModel
                {
                    SessionId = message.SessionId,
                    Type = message.Type,
                    Content = message.Content,
                    Status = message.Status,
                    Metadata = message.Metadata,
                    ParentMessageId = message.ParentMessageId,
                    CreatedAt = message.CreatedAt,
                    UpdatedAt = message.UpdatedAt
                };

                context.Messages.Add(model);
                await context.SaveChangesAsync(cancellationToken);
                await transaction.CommitAsync(cancellationToken);

                logger.LogInformation("Successfully created message {MessageId}.", model.Id);
                return model.Id;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
        catch (Microsoft.Data.Sqlite.SqliteException ex) when (ex.SqliteErrorCode == 19) // Foreign key constraint
        {
            logger.LogError(ex, "Foreign key constraint failed while creating message for session {SessionId} with parentMessageId {ParentMessageId}.",
                message.SessionId, message.ParentMessageId);
            throw new InvalidOperationException($"Foreign key constraint failed. Session {message.SessionId} or parent message {message.ParentMessageId} may not exist.", ex);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating message for session {SessionId}.", message.SessionId);
            throw;
        }
    }

    public async Task<MessageEntity?> GetByIdAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            var model = await context.Messages
                .AsNoTracking()
                .FirstOrDefaultAsync(x => x.Id == id, CancellationToken.None);

            if (model is null)
            {
                logger.LogWarning("Message {MessageId} not found.", id);
                return null;
            }

            return new MessageEntity(
                model.Id,
                model.SessionId,
                model.Type,
                model.Content,
                model.Status,
                model.Metadata,
                model.ParentMessageId,
                model.CreatedAt,
                model.UpdatedAt
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting message {MessageId}.", id);
            throw;
        }
    }

    public async Task<MessageEntity[]> GetBySessionIdAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Messages
                .AsNoTracking()
                .Where(x => x.SessionId == sessionId)
                .OrderBy(x => x.CreatedAt)
                .ToArrayAsync(cancellationToken);

            return models.Select(static m => new MessageEntity(
                m.Id,
                m.SessionId,
                m.Type,
                m.Content,
                m.Status,
                m.Metadata,
                m.ParentMessageId,
                m.CreatedAt,
                m.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting messages for session {SessionId}.", sessionId);
            throw;
        }
    }

    public async Task<bool> UpdateAsync(MessageEntity message, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Updating message {MessageId}.", message.Id);

            var model = await context.Messages
                .FirstOrDefaultAsync(x => x.Id == message.Id, CancellationToken.None);

            if (model is null)
            {
                logger.LogWarning("Message {MessageId} not found for update.", message.Id);
                return false;
            }

            model.Type = message.Type;
            model.Content = message.Content;
            model.Status = message.Status;
            model.Metadata = message.Metadata;
            model.ParentMessageId = message.ParentMessageId;
            model.UpdatedAt = message.UpdatedAt;

            await context.SaveChangesAsync(CancellationToken.None);

            logger.LogInformation("Successfully updated message {MessageId}.", message.Id);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating message {MessageId}.", message.Id);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int id, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deleting message {MessageId}.", id);

            var model = await context.Messages
                .FirstOrDefaultAsync(x => x.Id == id, cancellationToken);

            if (model is null)
            {
                logger.LogWarning("Message {MessageId} not found for deletion.", id);
                return false;
            }

            context.Messages.Remove(model);
            await context.SaveChangesAsync(cancellationToken);

            logger.LogInformation("Successfully deleted message {MessageId}.", id);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting message {MessageId}.", id);
            throw;
        }
    }

    public async Task<bool> DeleteBySessionIdAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deleting all messages for session {SessionId}.", sessionId);

            // Use a transaction to ensure atomicity
            using var transaction = await context.Database.BeginTransactionAsync(cancellationToken);
            try
            {
                // First, clear all parent-child relationships by setting ParentMessageId to null
                // This removes the foreign key constraints that are preventing deletion
                await context.Messages
                    .Where(x => x.SessionId == sessionId && x.ParentMessageId != null)
                    .ExecuteUpdateAsync(m => m.SetProperty(x => x.ParentMessageId, (int?)null), cancellationToken);

                // Now delete all messages for the session
                var deletedCount = await context.Messages
                    .Where(x => x.SessionId == sessionId)
                    .ExecuteDeleteAsync(cancellationToken);

                await transaction.CommitAsync(cancellationToken);

                logger.LogInformation("Successfully deleted {DeletedCount} messages for session {SessionId}.", deletedCount, sessionId);
                return true;
            }
            catch
            {
                await transaction.RollbackAsync(cancellationToken);
                throw;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting messages for session {SessionId}.", sessionId);
            throw;
        }
    }

    public async Task<MessageEntity[]> GetByParentMessageIdAsync(int parentMessageId, CancellationToken cancellationToken)
    {
        try
        {
            var models = await context.Messages
                .AsNoTracking()
                .Where(x => x.ParentMessageId == parentMessageId)
                .OrderBy(x => x.CreatedAt)
                .ToArrayAsync(cancellationToken);

            return models.Select(static m => new MessageEntity(
                m.Id,
                m.SessionId,
                m.Type,
                m.Content,
                m.Status,
                m.Metadata,
                m.ParentMessageId,
                m.CreatedAt,
                m.UpdatedAt
            )).ToArray();
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting messages with parent message ID {ParentMessageId}.", parentMessageId);
            throw;
        }
    }

    public async Task<bool> UpdatePendingMessagesStatusAsync(int sessionId, MessageStatus newStatus, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Updating pending messages status to {NewStatus} for session {SessionId}.", newStatus, sessionId);

            var updatedCount = await context.Messages
                .Where(x => x.SessionId == sessionId && x.Status == MessageStatus.Pending)
                .ExecuteUpdateAsync(m => m
                    .SetProperty(x => x.Status, newStatus)
                    .SetProperty(x => x.UpdatedAt, DateTime.UtcNow), cancellationToken);

            logger.LogInformation("Successfully updated {UpdatedCount} pending messages to {NewStatus} for session {SessionId}.", updatedCount, newStatus, sessionId);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating pending messages status for session {SessionId}.", sessionId);
            throw;
        }
    }
}
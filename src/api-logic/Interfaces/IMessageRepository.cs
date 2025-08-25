namespace Polygent.Logic.Interfaces;

public interface IMessageRepository
{
    Task<int> CreateAsync(MessageEntity message, CancellationToken cancellationToken);
    Task<MessageEntity?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<MessageEntity[]> GetBySessionIdAsync(int sessionId, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(MessageEntity message, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> DeleteBySessionIdAsync(int sessionId, CancellationToken cancellationToken);
    Task<MessageEntity[]> GetByParentMessageIdAsync(int parentMessageId, CancellationToken cancellationToken);
    Task<bool> UpdatePendingMessagesStatusAsync(int sessionId, MessageStatus newStatus, CancellationToken cancellationToken);
}

public sealed record MessageEntity(
    int Id,
    int SessionId,
    MessageType Type,
    string Content,
    MessageStatus Status,
    string? Metadata,
    int? ParentMessageId,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
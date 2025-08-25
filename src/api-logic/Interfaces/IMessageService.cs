namespace Polygent.Logic.Interfaces;

public interface IMessageService
{
    Task<MessageEntity[]> GetMessagesAsync(int sessionId, CancellationToken cancellationToken);
    Task<MessageEntity?> GetMessageAsync(int messageId, CancellationToken cancellationToken);
    Task<int> CreateMessageAsync(int sessionId, CreateMessageRequest request, CancellationToken cancellationToken);
    Task<bool> UpdateMessageAsync(int messageId, UpdateMessageRequest request, CancellationToken cancellationToken);
    Task<bool> UpdateMessageTimestampAsync(int messageId, DateTime updatedAt, CancellationToken cancellationToken);
    Task<bool> DeleteMessageAsync(int messageId, CancellationToken cancellationToken);
}

public sealed record CreateMessageRequest(
    MessageType Type,
    string Content,
    string? Metadata = null,
    int? ParentMessageId = null,
    MessageStatus Status = MessageStatus.Pending
);

public sealed record ProcessUserMessageRequest(
    string Content,
    string? Metadata = null
);

public sealed record UpdateMessageRequest(
    string? Content = null,
    MessageStatus? Status = null,
    string? Metadata = null
);


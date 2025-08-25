namespace Polygent.Logic.Interfaces;

public interface IMessageManagement
{
    Task<MessageEntity[]> GetBySessionIdAsync(int sessionId, CancellationToken cancellationToken);
    Task<MessageEntity?> GetByIdAsync(int messageId, CancellationToken cancellationToken);
    Task<bool> UpdateMessageAsync(int messageId, UpdateMessageRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteMessageAsync(int messageId, CancellationToken cancellationToken);
}
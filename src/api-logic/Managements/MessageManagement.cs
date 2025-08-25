using Microsoft.Extensions.Logging;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Managements;

internal sealed class MessageManagement(
    ILogger<MessageManagement> logger,
    IMessageService messageService) 
    : IMessageManagement, IScopedService<IMessageManagement>
{
    public async Task<MessageEntity[]> GetBySessionIdAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            return await messageService.GetMessagesAsync(sessionId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting messages for session {SessionId}.", sessionId);
            throw;
        }
    }

    public async Task<MessageEntity?> GetByIdAsync(int messageId, CancellationToken cancellationToken)
    {
        try
        {
            return await messageService.GetMessageAsync(messageId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting message {MessageId}.", messageId);
            throw;
        }
    }

    public async Task<bool> UpdateMessageAsync(int messageId, Interfaces.UpdateMessageRequest request, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Updating message {MessageId}.", messageId);
            
            var serviceRequest = new UpdateMessageRequest(
                request.Content,
                request.Status,
                request.Metadata
            );
            
            return await messageService.UpdateMessageAsync(messageId, serviceRequest, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating message {MessageId}.", messageId);
            throw;
        }
    }

    public async Task<bool> DeleteMessageAsync(int messageId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deleting message {MessageId}.", messageId);
            return await messageService.DeleteMessageAsync(messageId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting message {MessageId}.", messageId);
            throw;
        }
    }
}
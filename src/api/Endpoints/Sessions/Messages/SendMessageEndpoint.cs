using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Messages;

internal sealed class SendMessageEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/messages/send";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromBody] SendMessageRequestDto request,
        IMessageService messageService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            var createRequest = new CreateMessageRequest(
                MessageType.User,
                request.Content,
                request.Metadata,
                request.ParentMessageId,
                MessageStatus.Pending
            );
            
            var messageId = await messageService.CreateMessageAsync(sessionId, createRequest, cancellationToken);
            
            return Results.Ok(new { 
                success = true, 
                messageId
            });
        }
        catch (InvalidOperationException ex)
        {
            return Results.NotFound(new { error = ex.Message });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: "An error occurred while processing the message",
                statusCode: 500
            );
        }
    };
}
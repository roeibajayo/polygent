using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions.Messages;

internal sealed class GetMessageEndpoint : IGetEndpoint
{
    public string Route => "/api/sessions/{sessionId}/messages/{messageId}";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromRoute] int messageId,
        IMessageManagement messageManagement,
        CancellationToken cancellationToken) =>
    {
        try
        {
            var message = await messageManagement.GetByIdAsync(messageId, cancellationToken);
            
            if (message is null)
            {
                return Results.NotFound(new { error = "Message not found" });
            }

            var messageDto = new MessageDto(
                message.Id,
                message.SessionId,
                message.Type,
                message.Content,
                message.Status,
                message.Metadata,
                message.ParentMessageId,
                message.CreatedAt,
                message.UpdatedAt
            );
            
            return Results.Ok(messageDto);
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: "An error occurred while retrieving the message",
                statusCode: 500
            );
        }
    };
}
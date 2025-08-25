using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Messages;

internal sealed class GetSessionMessagesEndpoint : IGetEndpoint
{
    public string Route => "/api/sessions/{sessionId}/messages";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        IMessageManagement messageManagement,
        CancellationToken cancellationToken) =>
    {
        try
        {
            var messages = await messageManagement.GetBySessionIdAsync(sessionId, cancellationToken);
            var messageDtos = messages.Select(static x => new MessageDto(
                x.Id,
                x.SessionId,
                x.Type,
                x.Content,
                x.Status,
                x.Metadata,
                x.ParentMessageId,
                x.CreatedAt,
                x.UpdatedAt
            )).ToArray();
            
            return Results.Ok(messageDtos);
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: "An error occurred while retrieving messages",
                statusCode: 500
            );
        }
    };
}
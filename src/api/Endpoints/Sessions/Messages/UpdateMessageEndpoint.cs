using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions.Messages;

internal sealed class UpdateMessageEndpoint : IPutEndpoint
{
    public string Route => "/api/sessions/{sessionId}/messages/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromRoute] int id,
        [FromBody] UpdateMessageDto dto,
        IMessageManagement messageManagement,
        CancellationToken cancellationToken) =>
    {
        try
        {
            var request = new UpdateMessageRequest(
                dto.Content,
                dto.Status,
                dto.Metadata
            );
            
            var success = await messageManagement.UpdateMessageAsync(id, request, cancellationToken);
            
            return success ? Results.NoContent() : Results.NotFound();
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: "An error occurred while updating the message",
                statusCode: 500
            );
        }
    };
}
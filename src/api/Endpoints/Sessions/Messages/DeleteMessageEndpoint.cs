using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Messages;

internal sealed class DeleteMessageEndpoint : IDeleteEndpoint
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
            var result = await messageManagement.DeleteMessageAsync(messageId, cancellationToken);
            
            return result 
                ? Results.NoContent() 
                : Results.NotFound(new { error = "Message not found" });
        }
        catch (Exception ex)
        {
            return Results.Problem(
                detail: "An error occurred while deleting the message",
                statusCode: 500
            );
        }
    };
}
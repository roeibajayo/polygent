using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions.Actions;

internal sealed class StopWorkingMessagesEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/actions/stop";

    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromQuery] int? messageId,
        ISessionManagement sessionManagement,
        CancellationToken cancellationToken) =>
    {
        bool result;
        string successMessage;

        if (messageId.HasValue)
        {
            // Cancel a specific message
            result = await sessionManagement.CancelMessageAsync(messageId.Value, cancellationToken);
            successMessage = "Successfully stopped message";
        }
        else
        {
            // Cancel all working messages in the session
            result = await sessionManagement.CancelWorkingMessagesAsync(sessionId, cancellationToken);
            successMessage = "Successfully stopped working messages";
        }

        if (result)
            return Results.Ok(new { message = successMessage });

        return Results.Problem(messageId.HasValue ? "Failed to stop message" : "Failed to stop working messages");
    };
}
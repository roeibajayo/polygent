using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Actions;

internal sealed class ResetSessionEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/actions/reset";

    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        ISessionManagement sessionManagement,
        CancellationToken cancellationToken) =>
    {
        var result = await sessionManagement.ResetSessionAsync(sessionId, cancellationToken);

        if (result)
            return Results.Ok(new { message = "Successfully reset session" });

        return Results.Problem("Failed to reset session");
    };
}
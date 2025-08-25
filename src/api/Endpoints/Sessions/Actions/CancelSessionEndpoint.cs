using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Actions;

internal sealed class CancelSessionEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/actions/cancel";

    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        ISessionManagement sessionManagement,
        CancellationToken cancellationToken) =>
    {
        var result = await sessionManagement.CancelSessionAsync(sessionId, cancellationToken);

        if (result)
            return Results.Ok(new { message = "Successfully canceled session" });

        return Results.Problem("Failed to cancel session");
    };
}
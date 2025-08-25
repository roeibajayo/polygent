using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Actions;

internal sealed class PullFromStarterBranchEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/actions/pull-from-starter";

    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        ISessionManagement sessionManagement,
        CancellationToken cancellationToken) =>
    {
        var result = await sessionManagement.PullFromStarterBranchAsync(sessionId, cancellationToken);

        if (result)
            return Results.Ok(new { message = "Successfully pulled from starter branch" });

        return Results.Problem("Failed to pull from starter branch");
    };
}
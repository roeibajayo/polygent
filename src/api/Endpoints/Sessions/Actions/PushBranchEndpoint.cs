using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions.Actions;

internal sealed class PushBranchEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/actions/push-branch";

    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        ISessionManagement sessionManagement,
        CancellationToken cancellationToken) =>
    {
        var result = await sessionManagement.PushBranchAsync(sessionId, cancellationToken);

        if (result)
            return Results.Ok(new { message = "Successfully pushed branch" });

        return Results.Problem("Failed to push branch");
    };
}
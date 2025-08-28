using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions.Actions;

internal sealed class MergeToMainEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/actions/merge-to-main";

    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        ISessionManagement sessionManagement,
        CancellationToken cancellationToken) =>
    {
        var result = await sessionManagement.MergeToMainAsync(sessionId, cancellationToken);

        if (result)
            return Results.Ok(new { message = "Successfully merged to main branch" });

        return Results.Problem("Failed to merge to main branch");
    };
}
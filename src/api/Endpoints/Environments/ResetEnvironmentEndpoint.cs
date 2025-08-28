using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Environments;

internal sealed class ResetEnvironmentEndpoint : IPostEndpoint
{
    public string Route => "/api/environments/{environmentId}/reset";

    public Delegate Execute => static async (
        [FromRoute] int environmentId,
        IEnvironmentManagement environmentManagement,
        CancellationToken cancellationToken) =>
    {
        var result = await environmentManagement.ResetEnvironmentAsync(environmentId, cancellationToken);

        if (result)
            return Results.Ok(new { message = "Successfully reset environment git repository" });

        return Results.Problem("Failed to reset environment git repository");
    };
}
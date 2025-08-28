using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Environments;

internal sealed class DeleteEnvironmentVariableEndpoint : IDeleteEndpoint
{
    public string Route => "/api/environments/{environmentId}/variables/{key}";
    
    public Delegate Execute => static async (
        [FromRoute] int environmentId,
        [FromRoute] string key,
        IEnvironmentManagement environmentManagement,
        CancellationToken cancellationToken) =>
    {
        var result = await environmentManagement.DeleteEnvironmentVariableAsync(environmentId, key, cancellationToken);
        
        if (!result)
            return Results.NotFound($"Environment with ID {environmentId} not found or environment variable '{key}' does not exist.");
        
        return Results.NoContent();
    };
}
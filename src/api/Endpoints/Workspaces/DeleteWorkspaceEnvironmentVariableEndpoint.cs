using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Workspaces;

internal sealed class DeleteWorkspaceEnvironmentVariableEndpoint : IDeleteEndpoint
{
    public string Route => "/api/workspaces/{workspaceId}/variables/{key}";
    
    public Delegate Execute => static async (
        [FromRoute] int workspaceId,
        [FromRoute] string key,
        IWorkspaceManagement workspaceManagement,
        CancellationToken cancellationToken) =>
    {
        var success = await workspaceManagement.DeleteEnvironmentVariableAsync(workspaceId, key, cancellationToken);
        
        if (!success)
            return Results.NotFound($"Environment variable '{key}' not found for workspace {workspaceId}.");
        
        return Results.NoContent();
    };
}
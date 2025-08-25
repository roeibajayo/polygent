using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Workspaces;

internal sealed class UpdateWorkspaceEnvironmentVariableEndpoint : IPutEndpoint
{
    public string Route => "/api/workspaces/{workspaceId}/variables/{key}";
    
    public Delegate Execute => static async (
        [FromRoute] int workspaceId,
        [FromRoute] string key,
        [FromBody] UpdateWorkspaceEnvironmentVariableDto dto,
        IWorkspaceManagement workspaceManagement,
        CancellationToken cancellationToken) =>
    {
        var success = await workspaceManagement.UpdateEnvironmentVariableAsync(workspaceId, key, dto.Value, cancellationToken);
        
        if (!success)
            return Results.NotFound($"Environment variable '{key}' not found for workspace {workspaceId}.");
        
        var responseDto = new WorkspaceEnvironmentVariableDto(key, dto.Value);
        return Results.Ok(responseDto);
    };
}
using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Workspaces;

internal sealed class GetWorkspaceEnvironmentVariablesEndpoint : IGetEndpoint
{
    public string Route => "/api/workspaces/{workspaceId}/variables";
    
    public Delegate Execute => static async (
        [FromRoute] int workspaceId,
        IWorkspaceManagement workspaceManagement,
        CancellationToken cancellationToken) =>
    {
        var variables = await workspaceManagement.GetEnvironmentVariablesAsync(workspaceId, cancellationToken);
        
        if (variables is null)
            return Results.NotFound($"Workspace with ID {workspaceId} not found.");
        
        var variableDtos = variables.Select(static kvp => new WorkspaceEnvironmentVariableDto(kvp.Key, kvp.Value)).ToArray();
        
        return Results.Ok(variableDtos);
    };
}
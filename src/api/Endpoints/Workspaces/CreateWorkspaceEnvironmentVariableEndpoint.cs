using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Workspaces;

internal sealed class CreateWorkspaceEnvironmentVariableEndpoint : IPostEndpoint
{
    public string Route => "/api/workspaces/{workspaceId}/variables";
    
    public Delegate Execute => static async (
        [FromRoute] int workspaceId,
        [FromBody] CreateWorkspaceEnvironmentVariableDto dto,
        IWorkspaceManagement workspaceManagement,
        CancellationToken cancellationToken) =>
    {
        var success = await workspaceManagement.SetEnvironmentVariableAsync(workspaceId, dto.Key, dto.Value, cancellationToken);
        
        if (!success)
            return Results.BadRequest("Failed to create environment variable. Variable may already exist or workspace not found.");
        
        var responseDto = new WorkspaceEnvironmentVariableDto(dto.Key, dto.Value);
        return Results.Created($"/api/workspaces/{workspaceId}/variables/{Uri.EscapeDataString(dto.Key)}", responseDto);
    };
}
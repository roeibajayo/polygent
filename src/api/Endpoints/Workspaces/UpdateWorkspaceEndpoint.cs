using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Workspaces;

internal sealed class UpdateWorkspaceEndpoint : IPutEndpoint
{
    public string Route => "/api/workspaces/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        [FromBody] UpdateWorkspaceDto dto,
        IWorkspaceManagement workspaceManagement,
        CancellationToken cancellationToken) =>
    {
        var request = new UpdateWorkspaceRequest(
            dto.Name
        );
        
        var success = await workspaceManagement.UpdateAsync(id, request, cancellationToken);
        
        if (!success)
            return Results.NotFound();
        
        var updated = await workspaceManagement.GetAsync(id, cancellationToken);
        
        if (updated is null)
            return Results.Problem("Failed to retrieve updated workspace.");
        
        var workspaceDto = new WorkspaceDto(
            updated.Id,
            updated.Name,
            updated.GitRepository,
            updated.CreatedAt,
            updated.UpdatedAt
        );
        
        return Results.Ok(workspaceDto);
    };
}
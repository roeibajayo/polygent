using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Workspaces;

internal sealed class GetWorkspaceEndpoint : IGetEndpoint
{
    public string Route => "/api/workspaces/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        IWorkspaceManagement workspaceManagement,
        CancellationToken cancellationToken) =>
    {
        var workspace = await workspaceManagement.GetAsync(id, cancellationToken);
        
        if (workspace is null)
            return Results.NotFound();
        
        var workspaceDto = new WorkspaceDto(
            workspace.Id,
            workspace.Name,
            workspace.GitRepository,
            workspace.CreatedAt,
            workspace.UpdatedAt
        );
        
        return Results.Ok(workspaceDto);
    };
}
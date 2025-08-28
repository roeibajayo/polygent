using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Workspaces;

internal sealed class CreateWorkspaceEndpoint : IPostEndpoint
{
    public string Route => "/api/workspaces";
    
    public Delegate Execute => static async (
        [FromBody] CreateWorkspaceDto dto,
        IWorkspaceManagement workspaceManagement,
        CancellationToken cancellationToken) =>
    {
        var request = new CreateWorkspaceRequest(
            dto.Name,
            dto.GitRepository
        );
        
        var id = await workspaceManagement.EnsureCreatedAsync(request, cancellationToken);
        var created = await workspaceManagement.GetAsync(id, cancellationToken);
        
        if (created is null)
            return Results.Problem("Failed to create workspace.");
        
        var workspaceDto = new WorkspaceDto(
            created.Id,
            created.Name,
            created.GitRepository,
            created.CreatedAt,
            created.UpdatedAt
        );
        
        return Results.Created($"/api/workspaces/{id}", workspaceDto);
    };
}
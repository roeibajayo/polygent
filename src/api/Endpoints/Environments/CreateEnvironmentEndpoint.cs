using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Environments;

internal sealed class CreateEnvironmentEndpoint : IPostEndpoint
{
    public string Route => "/api/workspaces/{workspaceId}/environments";
    
    public Delegate Execute => static async (
        [FromRoute] int workspaceId,
        [FromBody] CreateEnvironmentDto dto,
        IEnvironmentManagement environmentManagement,
        CancellationToken cancellationToken) =>
    {
        var request = new CreateEnvironmentRequest(
            workspaceId,
            dto.Name,
            dto.GitBranch,
            dto.Url,
            dto.EnvironmentVariables
        );
        
        var id = await environmentManagement.CreateAsync(request, cancellationToken);
        var created = await environmentManagement.GetAsync(id, cancellationToken);
        
        if (created is null)
            return Results.Problem("Failed to create environment.");
        
        var environmentDto = new EnvironmentDto(
            created.Id,
            created.WorkspaceId,
            created.Name,
            created.GitBranch,
            created.Url,
            created.EnvironmentVariables,
            created.CreatedAt,
            created.UpdatedAt
        );
        
        return Results.Created($"/api/environments/{id}", environmentDto);
    };
}
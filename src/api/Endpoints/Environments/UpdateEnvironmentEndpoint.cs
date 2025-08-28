using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Environments;

internal sealed class UpdateEnvironmentEndpoint : IPutEndpoint
{
    public string Route => "/api/environments/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        [FromBody] UpdateEnvironmentDto dto,
        IEnvironmentManagement environmentManagement,
        Services.INotificationService notificationService,
        CancellationToken cancellationToken) =>
    {
        var existing = await environmentManagement.GetAsync(id, cancellationToken);
        
        if (existing is null)
            return Results.NotFound();
        
        var request = new UpdateEnvironmentRequest(
            dto.Name,
            dto.Url,
            dto.EnvironmentVariables
        );
        
        var success = await environmentManagement.UpdateAsync(id, request, cancellationToken);
        
        if (!success)
            return Results.Problem("Failed to update environment.");
        
        var updated = await environmentManagement.GetAsync(id, cancellationToken);
        
        if (updated is null)
            return Results.Problem("Failed to retrieve updated environment.");
        
        var environmentDto = new EnvironmentDto(
            updated.Id,
            updated.WorkspaceId,
            updated.Name,
            updated.GitBranch,
            updated.Url,
            updated.EnvironmentVariables,
            updated.CreatedAt,
            updated.UpdatedAt
        );
        
        return Results.Ok(environmentDto);
    };
}
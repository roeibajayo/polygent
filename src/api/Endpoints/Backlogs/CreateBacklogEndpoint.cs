using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Backlogs;

internal sealed class CreateBacklogEndpoint : IPostEndpoint
{
    public string Route => "/api/backlogs";
    
    public Delegate Execute => static async (
        [FromBody] CreateBacklogDto dto,
        IBacklogRepository backlogRepo,
        CancellationToken cancellationToken) =>
    {
        var backlog = new BacklogEntity(
            0,
            dto.Title,
            dto.Description,
            dto.Status,
            dto.Tags,
            dto.WorkspaceId,
            dto.SessionId,
            DateTime.UtcNow,
            DateTime.UtcNow
        );
        
        var id = await backlogRepo.CreateAsync(backlog, cancellationToken);
        var created = await backlogRepo.GetByIdAsync(id, cancellationToken);
        
        if (created is null)
            return Results.Problem("Failed to create backlog.");
        
        var backlogDto = new BacklogDto(
            created.Id,
            created.Title,
            created.Description,
            created.Status,
            created.Tags,
            created.WorkspaceId,
            created.SessionId,
            created.CreatedAt,
            created.UpdatedAt
        );
        
        return Results.Created($"/api/backlogs/{id}", backlogDto);
    };
}
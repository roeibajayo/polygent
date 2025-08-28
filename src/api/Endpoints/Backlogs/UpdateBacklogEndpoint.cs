using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Backlogs;

internal sealed class UpdateBacklogEndpoint : IPutEndpoint
{
    public string Route => "/api/backlogs/{id}";

    public Delegate Execute => static async (
        [FromRoute] int id,
        [FromBody] UpdateBacklogDto dto,
        IBacklogRepository backlogRepo,
        CancellationToken cancellationToken) =>
    {
        var existing = await backlogRepo.GetByIdAsync(id, cancellationToken);

        if (existing is null)
            return Results.NotFound();

        var updated = new BacklogEntity(
            existing.Id,
            dto.Title ?? existing.Title,
            dto.Description ?? existing.Description,
            dto.Status ?? existing.Status,
            dto.Tags ?? [],
            dto.WorkspaceId,
            dto.SessionId ?? existing.SessionId,
            existing.CreatedAt,
            DateTime.UtcNow
        );

        var success = await backlogRepo.UpdateAsync(updated, cancellationToken);

        if (!success)
            return Results.Problem("Failed to update backlog.");

        var backlogDto = new BacklogDto(
            updated.Id,
            updated.Title,
            updated.Description,
            updated.Status,
            updated.Tags,
            updated.WorkspaceId,
            updated.SessionId,
            updated.CreatedAt,
            updated.UpdatedAt
        );

        return Results.Ok(backlogDto);
    };
}
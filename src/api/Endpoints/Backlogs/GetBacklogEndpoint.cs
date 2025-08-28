using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Backlogs;

internal sealed class GetBacklogEndpoint : IGetEndpoint
{
    public string Route => "/api/backlogs/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        IBacklogRepository backlogRepo,
        CancellationToken cancellationToken) =>
    {
        var backlog = await backlogRepo.GetByIdAsync(id, cancellationToken);
        
        if (backlog is null)
            return Results.NotFound();
        
        var backlogDto = new BacklogDto(
            backlog.Id,
            backlog.Title,
            backlog.Description,
            backlog.Status,
            backlog.Tags,
            backlog.WorkspaceId,
            backlog.SessionId,
            backlog.CreatedAt,
            backlog.UpdatedAt
        );
        
        return Results.Ok(backlogDto);
    };
}
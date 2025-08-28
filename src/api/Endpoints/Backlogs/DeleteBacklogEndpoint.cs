using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Backlogs;

internal sealed class DeleteBacklogEndpoint : IDeleteEndpoint
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
        
        var success = await backlogRepo.DeleteAsync(id, cancellationToken);
        
        if (!success)
            return Results.Problem("Failed to delete backlog.");
        
        return Results.NoContent();
    };
}
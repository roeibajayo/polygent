using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Tasks;

internal sealed class DeleteTaskEndpoint : IDeleteEndpoint
{
    public string Route => "/api/tasks/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        ITaskRepository taskRepository,
        CancellationToken cancellationToken) =>
    {
        var success = await taskRepository.DeleteAsync(id, cancellationToken);
        
        if (!success)
            return Results.NotFound();
        
        return Results.NoContent();
    };
}
using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Tasks;

internal sealed class GetTaskEndpoint : IGetEndpoint
{
    public string Route => "/api/tasks/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        ITaskRepository taskRepository,
        CancellationToken cancellationToken) =>
    {
        var task = await taskRepository.GetByIdAsync(id, cancellationToken);
        
        if (task is null)
            return Results.NotFound();
        
        var taskDto = new TaskDto(
            task.Id,
            task.WorkspaceId,
            task.Name,
            task.Type,
            task.WorkingDirectory,
            task.ScriptType,
            task.ScriptContent,
            task.CreatedAt,
            task.UpdatedAt
        );
        
        return Results.Ok(taskDto);
    };
}
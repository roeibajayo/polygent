using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Tasks;

internal sealed class UpdateTaskEndpoint : IPutEndpoint
{
    public string Route => "/api/tasks/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        [FromBody] UpdateTaskDto dto,
        ITaskRepository taskRepository,
        CancellationToken cancellationToken) =>
    {
        var exists = await taskRepository.GetByIdAsync(id, cancellationToken);

        if (exists is null)
            return Results.NotFound();


        exists = exists with
        {
            Name = dto.Name,
            Type = dto.Type,
            WorkingDirectory = dto.WorkingDirectory,
            ScriptType = dto.ScriptType,
            ScriptContent = dto.ScriptContent,
            UpdatedAt = DateTime.UtcNow,
        };

        var success = await taskRepository.UpdateAsync(exists, cancellationToken);
        
        var taskDto = new TaskDto(
            exists.Id,
            exists.WorkspaceId,
            exists.Name,
            exists.Type,
            exists.WorkingDirectory,
            exists.ScriptType,
            exists.ScriptContent,
            exists.CreatedAt,
            exists.UpdatedAt
        );
        
        return Results.Ok(taskDto);
    };
}
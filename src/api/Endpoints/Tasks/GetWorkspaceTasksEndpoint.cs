using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Tasks;

internal sealed class GetWorkspaceTasksEndpoint : IGetEndpoint
{
    public string Route => "/api/workspaces/{workspaceId}/tasks";
    
    public Delegate Execute => static async (
        [FromRoute] int workspaceId,
        ITaskRepository taskRepository,
        CancellationToken cancellationToken) =>
    {
        var tasks = await taskRepository.GetByWorkspaceIdAsync(workspaceId, cancellationToken);
        var taskDtos = tasks.Select(static x => new TaskDto(
            x.Id,
            x.WorkspaceId,
            x.Name,
            x.Type,
            x.WorkingDirectory,
            x.ScriptType,
            x.ScriptContent,
            x.CreatedAt,
            x.UpdatedAt
        )).ToArray();
        
        return Results.Ok(taskDtos);
    };
}
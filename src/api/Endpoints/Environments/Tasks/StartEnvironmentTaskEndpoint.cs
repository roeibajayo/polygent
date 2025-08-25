using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Environments.Tasks;

internal sealed class StartEnvironmentTaskEndpoint : IPostEndpoint
{
    public string Route => "/api/environments/{environmentId}/tasks/{taskId}/start";

    public Delegate Execute => static async (
        [FromRoute] int environmentId,
        [FromRoute] int taskId,
        ITaskExecutionService taskExecutionService,
        CancellationToken cancellationToken) =>
    {
        var taskExecutionId = await taskExecutionService.StartEnvironmentTaskAsync(environmentId, taskId, cancellationToken);        
        return Results.Ok(new StartEnvironmentTaskResponseDto(taskExecutionId));
    };
}
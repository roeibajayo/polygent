using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Environments.Tasks;

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
using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Environments.Tasks;

internal sealed class GetEnvironmentTasksEndpoint : IGetEndpoint
{
    public string Route => "/api/environments/{environmentId}/tasks";

    public Delegate Execute => static async (
        [FromRoute] int environmentId,
        IEnvironmentRepository environmentRepository,
        ITaskExecutionService taskExecutionService,
        CancellationToken cancellationToken) =>
    {
        // Get the environment to access its workspace ID
        var environment = await environmentRepository.GetByIdAsync(environmentId, cancellationToken);
        if (environment is null)
        {
            return Results.NotFound($"Environment with ID {environmentId} not found.");
        }

        // Get all tasks for the environment
        var tasks = await taskExecutionService.GetTaskStatusesAsync(environment.WorkspaceId, environmentId, false, cancellationToken);

        // Map to EnvironmentTaskDto
        var environmentTaskDtos = tasks.Select(static task => new EnvironmentTaskDto(
            task.TaskId,
            task.Name,
            task.Type,
            task.Status,
            task.TaskExecutionId
        )).ToArray();

        return Results.Ok(environmentTaskDtos);
    };
}
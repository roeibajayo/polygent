using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Tasks;

internal sealed class StopSessionTaskEndpoint : IPostEndpoint
{
    public string Route => "/api/tasks/{taskExecutionId}/stop";

    public Delegate Execute => static async (
        [FromRoute] Guid taskExecutionId,
        ITaskExecutionService taskExecutionService,
        CancellationToken cancellationToken) =>
    {
        var result = await taskExecutionService.StopTaskAsync(taskExecutionId, cancellationToken);
        
        return result 
            ? Results.NoContent()
            : Results.NotFound($"Task execution with ID {taskExecutionId} not found.");
    };
}
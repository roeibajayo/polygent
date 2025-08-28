using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Tasks;

internal sealed class GetSessionTaskOutputEndpoint : IGetEndpoint
{
    public string Route => "/api/tasks/{taskExecutionId}/output";

    public Delegate Execute => static async (
        [FromRoute] Guid taskExecutionId,
        IProcessService processService,
        ILogger<GetSessionTaskOutputEndpoint> logger,
        CancellationToken cancellationToken) =>
    {
        var output = await processService.GetProcessOutputAsync(taskExecutionId, cancellationToken);
        
        if (output is null)
        {
            logger.LogWarning("Task execution {TaskExecutionId} not found or has no output", taskExecutionId);
            return Results.NotFound($"Task execution with ID {taskExecutionId} not found.");
        }
        
        var status = await processService.GetProcessStatusAsync(taskExecutionId, cancellationToken);

        return Results.Ok(new GetTaskOutputResponseDto(
            taskExecutionId,
            output,
            status.Status
        ));
    };
}
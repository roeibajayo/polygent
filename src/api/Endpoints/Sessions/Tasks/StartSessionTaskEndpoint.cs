using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Tasks;

internal sealed class StartSessionTaskEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/tasks/{taskId}/start";

    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromRoute] int taskId,
        ITaskExecutionService taskExecutionService,
        CancellationToken cancellationToken) =>
    {

        var taskExecutionId = await taskExecutionService.StartSessionTaskAsync(sessionId, taskId, cancellationToken);        
        return Results.Ok(new StartSessionTaskResponseDto(taskExecutionId));
    };
}
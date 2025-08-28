using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions.Tasks;

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
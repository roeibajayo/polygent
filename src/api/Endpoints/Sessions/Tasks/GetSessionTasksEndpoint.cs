using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions.Tasks;

internal sealed class GetSessionTasksEndpoint : IGetEndpoint
{
    public string Route => "/api/sessions/{sessionId}/tasks";

    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        ISessionRepository sessionRepository,
        ITaskExecutionService taskExecutionService,
        CancellationToken cancellationToken) =>
    {
        // Get the session to access its workspace ID
        var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
        if (session is null)
        {
            return Results.NotFound($"Session with ID {sessionId} not found.");
        }

        // Get all tasks for the session's workspace
        var tasks = await taskExecutionService.GetTaskStatusesAsync(session.WorkspaceId, sessionId, true, cancellationToken);

        // Map to SessionTaskDto with default status and no execution ID for now
        var sessionTaskDtos = tasks.Select(static task => new SessionTaskDto(
            task.TaskId,
            task.Name,
            task.Type,
            task.Status,
            task.TaskExecutionId
        )).ToArray();

        return Results.Ok(sessionTaskDtos);
    };
}
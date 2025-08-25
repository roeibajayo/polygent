namespace Polygent.Logic.Interfaces;

public interface ITaskExecutionService
{
    Task<Guid> StartSessionTaskAsync(int sessionId, int taskId, CancellationToken cancellationToken);
    Task<Guid> StartEnvironmentTaskAsync(int environmentId, int taskId, CancellationToken cancellationToken);
    Task<bool> StopTaskAsync(Guid taskExecutionId, CancellationToken cancellationToken);
    Task<TaskStatusInfo[]> GetTaskStatusesAsync(int workspaceId, int contextId, bool isSession, CancellationToken cancellationToken);
}
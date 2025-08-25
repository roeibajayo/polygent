namespace Polygent.Logic.Interfaces;

public interface IProcessService
{
    Task<Guid> StartProcessAsync(bool isSession, int contextId, int taskId, string command, string[] arguments, string? workingDirectory, Dictionary<string, string>? environmentVariables, CancellationToken cancellationToken);
    Task<bool> StopProcessAsync(Guid processId, CancellationToken cancellationToken);
    Task<string?> GetProcessOutputAsync(Guid processId, CancellationToken cancellationToken);
    Task<ProcessResult> GetProcessStatusAsync(Guid processId, CancellationToken cancellationToken);
    Task<ProcessResult[]> GetProcessStatusesAsync(bool isSession, int contextId, CancellationToken cancellationToken);
}

public sealed record ProcessResult(
    int TaskId,
    Guid TaskExecutionId,
    TaskStatus Status,
    string? Output);
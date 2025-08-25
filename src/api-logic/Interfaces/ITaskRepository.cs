namespace Polygent.Logic.Interfaces;

public interface ITaskRepository
{
    Task<int> CreateAsync(TaskEntity task, CancellationToken cancellationToken);
    Task<TaskEntity?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<TaskEntity[]> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken);
    Task<TaskEntity[]> GetByTypeAsync(TaskType type, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(TaskEntity task, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public sealed record TaskEntity(
    int Id,
    int WorkspaceId,
    string Name,
    TaskType? Type,
    string? WorkingDirectory,
    ScriptType ScriptType,
    string ScriptContent,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public enum TaskType
{
    Build = 1,
    Test = 2,
    Start = 3
}

public enum ScriptType
{
    Bash = 1,
    PowerShell = 2,
    NodeJs = 3
}
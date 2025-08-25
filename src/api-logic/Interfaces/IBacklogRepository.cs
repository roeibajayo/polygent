namespace Polygent.Logic.Interfaces;

public interface IBacklogRepository
{
    Task<int> CreateAsync(BacklogEntity backlog, CancellationToken cancellationToken);
    Task<BacklogEntity?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<BacklogEntity[]> GetAllAsync(CancellationToken cancellationToken);
    Task<BacklogEntity[]> GetByStatusAsync(BacklogStatus status, CancellationToken cancellationToken);
    Task<BacklogEntity[]> GetByWorkspaceAsync(int workspaceId, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(BacklogEntity backlog, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public sealed record BacklogEntity(
    int Id,
    string Title,
    string Description,
    BacklogStatus Status,
    string[] Tags,
    int? WorkspaceId,
    int? SessionId,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public enum BacklogStatus
{
    InMind = 1,
    Ready = 2,
    InProgress = 3,
    Done = 4,
    Canceled = 5
}
namespace Polygent.Logic.Interfaces;

public interface ISessionRepository
{
    Task<int> CreateAsync(SessionEntity session, CancellationToken cancellationToken);
    Task<SessionEntity?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<SessionEntity[]> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(SessionEntity session, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<SessionEntity[]> GetActiveSessionsAsync(CancellationToken cancellationToken);
}

public sealed record SessionEntity(
    int Id,
    int WorkspaceId,
    SessionStatus Status,
    string StarterGitBranch,
    int AgentId,
    string? ProviderSessionId,
    bool HasUnreadMessage,
    string? Name,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public enum SessionStatus
{
    Waiting = 2,
    InProgress = 3,
    Done = 4,
    Canceled = 5
}
namespace Polygent.Logic.Interfaces;

public interface ISessionManagement
{
    Task<int> CreateAsync(CreateSessionRequest request, CancellationToken cancellationToken);
    Task<SessionEntity?> GetAsync(int sessionId, CancellationToken cancellationToken);
    Task<SessionEntity[]> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken);
    Task<SessionEntity[]> GetActiveSessionsAsync(CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int sessionId, UpdateSessionRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int sessionId, CancellationToken cancellationToken);

    Task<bool> MergeToMainAsync(int sessionId, CancellationToken cancellationToken);
    Task<bool> PushBranchAsync(int sessionId, CancellationToken cancellationToken);
    Task<bool> PullFromStarterBranchAsync(int sessionId, CancellationToken cancellationToken);
    Task<bool> ResetSessionAsync(int sessionId, CancellationToken cancellationToken);
    Task<bool> CancelSessionAsync(int sessionId, CancellationToken cancellationToken);
    Task<bool> CancelWorkingMessagesAsync(int sessionId, CancellationToken cancellationToken);
    Task<bool> CancelMessageAsync(int messageId, CancellationToken cancellationToken);
    Task<bool> OpenWithVSCodeAsync(int sessionId, CancellationToken cancellationToken);
    Task StopAllWorkingSessionsAsync(CancellationToken cancellationToken);
}

public sealed record CreateSessionRequest(
    int WorkspaceId,
    string StarterGitBranch,
    int AgentId,
    string? Name = null
);

public sealed record AddMessageRequest(
    MessageType Type,
    string Content,
    string? Metadata = null,
    int? ParentMessageId = null
);


public sealed record UpdateSessionRequest(
    SessionStatus? Status,
    string? StarterGitBranch = null,
    bool ResetProviderSessionId = false,
    string? Name = null,
    bool? HasUnreadMessage = null
);


public sealed record TaskStatusInfo(
    int TaskId,
    string Name,
    TaskType? Type,
    TaskStatus Status,
    Guid? TaskExecutionId);

public enum MessageType
{
    System = 1,
    User = 2,
    Agent = 3,
    Tool = 4
}

public enum MessageStatus
{
    Pending = 1,
    Working = 2,
    Done = 3,
    Failed = 4,
    Canceled = 5
}

public enum TaskStatus
{
    Pending = 1,
    Running = 2,
    Completed = 3,
    Failed = 4,
    Canceled = 5
}
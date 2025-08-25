namespace Polygent.Logic.Interfaces;

public interface IGitService
{
    Task<bool> CloneRepositoryAsync(string repositoryUrl, string localPath, CancellationToken cancellationToken);
    Task<bool> CreateWorktreeAsync(string repositoryPath, string branch, string worktreePath, CancellationToken cancellationToken);
    Task<bool> DeleteWorktreeAsync(string worktreePath, CancellationToken cancellationToken);
    Task<bool> CreateBranchAsync(string repositoryPath, string branchName, CancellationToken cancellationToken);
    Task<bool> CheckoutBranchAsync(string repositoryPath, string branchName, CancellationToken cancellationToken);
    Task<string?> GetCurrentBranchAsync(string repositoryPath, CancellationToken cancellationToken);
    Task<string[]> GetBranchesAsync(string repositoryPath, CancellationToken cancellationToken);
    Task<bool> BranchExistsAsync(string repositoryPath, string branchName, CancellationToken cancellationToken);
    Task<bool> StageChangesAsync(string repositoryPath, CancellationToken cancellationToken);
    Task<bool> DiscardStagedChangesAsync(string repositoryPath, CancellationToken cancellationToken);
    Task<bool> DiscardChangesAsync(string repositoryPath, CancellationToken cancellationToken);
    Task<bool> CommitStagedChangesAsync(string repositoryPath, string message, CancellationToken cancellationToken);
    Task<bool> PushChangesAsync(string repositoryPath, CancellationToken cancellationToken);
    Task<bool> PullChangesAsync(string repositoryPath, CancellationToken cancellationToken);
    Task<bool> MergeBranchAsync(string repositoryPath, string sourceBranch, string targetBranch, CancellationToken cancellationToken);
    Task<bool> ResetBranchAsync(string repositoryPath, string branchName, bool hard, CancellationToken cancellationToken);
    Task<GitStatusResult?> GetStatusAsync(string repositoryPath, CancellationToken cancellationToken);
    Task<string?> GetFileContentAsync(string repositoryPath, string filePath, GitFileMode mode, CancellationToken cancellationToken);
    Task<GitCommandResult> ExecuteGitCommandAsync(string command, string[] arguments, string? repositoryPath, CancellationToken cancellationToken);
}

public sealed record GitStatusResult(
    GitFileStatus[] StagedFiles,
    GitFileStatus[] UnstagedFiles,
    string[] UntrackedFiles
);

public sealed record GitFileStatus(
    string FilePath,
    GitChangeType ChangeType
);

public enum GitChangeType
{
    Added,
    Modified,
    Deleted,
    Renamed,
    Copied
}

public enum GitFileMode
{
    Working,    // Current working directory version
    Head,       // HEAD commit version
    Staged      // Staged/index version
}

public sealed record GitCommandResult(
    bool Success,
    string? Output,
    string? Error,
    int ExitCode
);
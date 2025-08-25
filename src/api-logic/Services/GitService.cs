using Microsoft.Extensions.Logging;
using Polygent.Logic.Helpers;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;
using System.Diagnostics;
using System.Text;

namespace Polygent.Logic.Services;

internal sealed class GitService(ILogger<GitService> logger)
    : IGitService, ISingletonService<IGitService>
{
    public async Task<bool> CloneRepositoryAsync(string repositoryUrl, string localPath, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Cloning repository {RepositoryUrl} to {LocalPath}.", repositoryUrl, localPath);

            var result = await ExecuteGitCommandAsync("clone", [repositoryUrl, localPath], null, cancellationToken);

            if (result.Success)
            {
                logger.LogInformation("Successfully cloned repository {RepositoryUrl} to {LocalPath}.", repositoryUrl, localPath);
                return true;
            }

            logger.LogError("Failed to clone repository {RepositoryUrl}. Error: {Error}", repositoryUrl, result.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while cloning repository {RepositoryUrl}.", repositoryUrl);
            return false;
        }
    }

    public async Task<bool> CreateWorktreeAsync(string repositoryPath, string branch, string worktreePath, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Creating worktree for branch {Branch} at {WorktreePath}.", branch, worktreePath);

            // First try to create worktree with the specified branch
            var result = await ExecuteGitCommandAsync("worktree", ["add", worktreePath, branch], repositoryPath, cancellationToken);

            if (result.Success)
            {
                logger.LogInformation("Successfully created worktree for branch {Branch} at {WorktreePath}.", branch, worktreePath);
                return true;
            }

            // If failed due to branch already in use, try creating with detached HEAD from the branch
            if (result.Error?.Contains("already used by worktree") == true)
            {
                logger.LogInformation("Branch {Branch} already in use, creating worktree with detached HEAD.", branch);

                var detachedResult = await ExecuteGitCommandAsync("worktree", ["add", "--detach", worktreePath, branch], repositoryPath, cancellationToken);

                if (detachedResult.Success)
                {
                    logger.LogInformation("Successfully created detached worktree from branch {Branch} at {WorktreePath}.", branch, worktreePath);
                    return true;
                }

                logger.LogError("Failed to create detached worktree from branch {Branch}. Error: {Error}", branch, detachedResult.Error);
                return false;
            }

            logger.LogError("Failed to create worktree for branch {Branch}. Error: {Error}", branch, result.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating worktree for branch {Branch}.", branch);
            return false;
        }
    }

    public async Task<bool> DeleteWorktreeAsync(string worktreePath, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deleting worktree at {WorktreePath}.", worktreePath);

            var result = await ExecuteGitCommandAsync("worktree", ["remove", worktreePath, "--force"], null, cancellationToken);

            if (result.Success)
            {
                logger.LogInformation("Successfully deleted worktree at {WorktreePath}.", worktreePath);
                return true;
            }

            // Handle the case where the path is not a valid worktree
            if (result.Error?.Contains("is not a working tree") == true)
            {
                logger.LogWarning("Path {WorktreePath} is not a valid Git worktree. Checking if directory exists for cleanup.", worktreePath);
                
                // If the directory exists, try to remove it directly
                if (Directory.Exists(worktreePath))
                {
                    try
                    {
                        Directory.Delete(worktreePath, recursive: true);
                        logger.LogInformation("Successfully cleaned up directory at {WorktreePath} that was not a valid worktree.", worktreePath);
                        return true;
                    }
                    catch (Exception cleanupEx)
                    {
                        logger.LogError(cleanupEx, "Failed to clean up invalid worktree directory at {WorktreePath}.", worktreePath);
                        return false;
                    }
                }
                else
                {
                    logger.LogInformation("Worktree path {WorktreePath} does not exist. Considering deletion successful.", worktreePath);
                    return true;
                }
            }

            logger.LogError("Failed to delete worktree at {WorktreePath}. Error: {Error}", worktreePath, result.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting worktree at {WorktreePath}.", worktreePath);
            return false;
        }
    }

    public async Task<bool> CreateBranchAsync(string repositoryPath, string branchName, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Creating branch {BranchName} in repository {RepositoryPath}.", branchName, repositoryPath);

            var result = await ExecuteGitCommandAsync("branch", [branchName], repositoryPath, cancellationToken);

            if (result.Success)
            {
                logger.LogInformation("Successfully created branch {BranchName}.", branchName);
                return true;
            }

            logger.LogError("Failed to create branch {BranchName}. Error: {Error}", branchName, result.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating branch {BranchName}.", branchName);
            return false;
        }
    }

    public async Task<bool> CheckoutBranchAsync(string repositoryPath, string branchName, CancellationToken cancellationToken)
    {
        try
        {
            var result = await ExecuteGitCommandAsync("checkout", [branchName], repositoryPath, cancellationToken);

            if (result.Success)
            {
                logger.LogInformation("Successfully checked out branch {BranchName}.", branchName);
                return true;
            }

            logger.LogError("Failed to checkout branch {BranchName}. Error: {Error}", branchName, result.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while checking out branch {BranchName}.", branchName);
            return false;
        }
    }

    public async Task<string?> GetCurrentBranchAsync(string repositoryPath, CancellationToken cancellationToken)
    {
        try
        {
            var result = await ExecuteGitCommandAsync("branch", ["--show-current"], repositoryPath, cancellationToken);

            if (result.Success)
            {
                var branchName = result.Output?.Trim();
                logger.LogInformation("Current branch is {BranchName}.", branchName);
                return branchName;
            }

            logger.LogError("Failed to get current branch. Error: {Error}", result.Error);
            return null;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting current branch.");
            return null;
        }
    }

    public async Task<string[]> GetBranchesAsync(string repositoryPath, CancellationToken cancellationToken)
    {
        try
        {
            var result = await ExecuteGitCommandAsync("branch", ["-a"], repositoryPath, cancellationToken);

            if (result.Success && result.Output is not null)
            {
                var branches = result.Output
                    .Split('\n', StringSplitOptions.RemoveEmptyEntries)
                    .Select(static x => x.Trim().TrimStart('*').Trim())
                    .Where(static x => !string.IsNullOrWhiteSpace(x))
                    .ToArray();

                return branches;
            }

            logger.LogError("Failed to get branches. Error: {Error}", result.Error);
            return [];
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting branches.");
            return [];
        }
    }

    public async Task<bool> BranchExistsAsync(string repositoryPath, string branchName, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Checking if branch {BranchName} exists in repository {RepositoryPath}.", branchName, repositoryPath);

            var result = await ExecuteGitCommandAsync("show-ref", ["--verify", $"refs/heads/{branchName}"], repositoryPath, cancellationToken);

            if (result.Success)
            {
                logger.LogInformation("Branch {BranchName} exists.", branchName);
                return true;
            }

            // Also check remote branches
            var remoteResult = await ExecuteGitCommandAsync("show-ref", ["--verify", $"refs/remotes/origin/{branchName}"], repositoryPath, cancellationToken);

            if (remoteResult.Success)
            {
                logger.LogInformation("Branch {BranchName} exists on remote.", branchName);
                return true;
            }

            logger.LogInformation("Branch {BranchName} does not exist.", branchName);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while checking if branch {BranchName} exists.", branchName);
            return false;
        }
    }

    public async Task<bool> StageChangesAsync(string repositoryPath, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Staging all changes in repository {RepositoryPath}.", repositoryPath);

            var result = await ExecuteGitCommandAsync("add", ["."], repositoryPath, cancellationToken);

            if (result.Success)
            {
                logger.LogInformation("Successfully staged all changes.");
                return true;
            }

            logger.LogError("Failed to stage changes. Error: {Error}", result.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while staging changes.");
            return false;
        }
    }

    public async Task<bool> DiscardStagedChangesAsync(string repositoryPath, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Discarding staged changes in repository {RepositoryPath}.", repositoryPath);

            var result = await ExecuteGitCommandAsync("reset", ["HEAD"], repositoryPath, cancellationToken);

            if (result.Success)
            {
                logger.LogInformation("Successfully discarded staged changes.");
                return true;
            }

            logger.LogError("Failed to discard staged changes. Error: {Error}", result.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while discarding staged changes.");
            return false;
        }
    }

    public async Task<bool> DiscardChangesAsync(string repositoryPath, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Discarding all changes in repository {RepositoryPath}.", repositoryPath);

            var result = await ExecuteGitCommandAsync("checkout", ["--", "."], repositoryPath, cancellationToken);

            if (result.Success)
            {
                logger.LogInformation("Successfully discarded all changes.");
                return true;
            }

            logger.LogError("Failed to discard changes. Error: {Error}", result.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while discarding changes.");
            return false;
        }
    }

    public async Task<bool> CommitStagedChangesAsync(string repositoryPath, string message, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Committing staged changes with message: {CommitMessage}.", message);

            var result = await ExecuteGitCommandAsync("commit", ["-m", message], repositoryPath, cancellationToken);

            if (result.Success)
            {
                logger.LogInformation("Successfully committed staged changes.");
                return true;
            }

            logger.LogError("Failed to commit staged changes. Error: {Error}", result.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while committing staged changes.");
            return false;
        }
    }

    public async Task<bool> PushChangesAsync(string repositoryPath, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Pushing changes for repository {RepositoryPath}.", repositoryPath);

            // Check current branch status
            var currentBranch = await GetCurrentBranchAsync(repositoryPath, cancellationToken);

            if (string.IsNullOrEmpty(currentBranch))
            {
                // We're in detached HEAD state, need to create a branch
                logger.LogInformation("Detached HEAD detected, creating branch for push.");

                // Extract session ID from path to create branch name
                var pathParts = repositoryPath.Split(Path.DirectorySeparatorChar, StringSplitOptions.RemoveEmptyEntries);
                var sessionId = pathParts.LastOrDefault();
                var branchName = $"sessions/s-{sessionId}";

                // Create and checkout the branch
                var createBranchResult = await ExecuteGitCommandAsync("checkout", ["-b", branchName], repositoryPath, cancellationToken);
                if (!createBranchResult.Success)
                {
                    logger.LogError("Failed to create branch {BranchName}. Error: {Error}", branchName, createBranchResult.Error);
                    return false;
                }

                // Push with upstream tracking
                var pushResult = await ExecuteGitCommandAsync("push", ["-u", "origin", branchName], repositoryPath, cancellationToken);

                if (pushResult.Success)
                {
                    logger.LogInformation("Successfully pushed new branch {BranchName}.", branchName);
                    return true;
                }

                logger.LogError("Failed to push new branch {BranchName}. Error: {Error}", branchName, pushResult.Error);
                return false;
            }
            else
            {
                // Try normal push first
                var result = await ExecuteGitCommandAsync("push", [], repositoryPath, cancellationToken);

                if (result.Success)
                {
                    logger.LogInformation("Successfully pushed changes.");
                    return true;
                }

                // If push failed due to no upstream, try with upstream tracking
                if (result.Error?.Contains("has no upstream branch") == true)
                {
                    logger.LogInformation("No upstream branch detected, setting upstream for branch {CurrentBranch}.", currentBranch);
                    var pushWithUpstreamResult = await ExecuteGitCommandAsync("push", ["-u", "origin", currentBranch], repositoryPath, cancellationToken);

                    if (pushWithUpstreamResult.Success)
                    {
                        logger.LogInformation("Successfully pushed changes with upstream tracking for branch {CurrentBranch}.", currentBranch);
                        return true;
                    }

                    logger.LogError("Failed to push changes with upstream tracking. Error: {Error}", pushWithUpstreamResult.Error);
                    return false;
                }

                logger.LogError("Failed to push changes. Error: {Error}", result.Error);
                return false;
            }
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while pushing changes.");
            return false;
        }
    }

    public async Task<bool> PullChangesAsync(string repositoryPath, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Pulling changes for repository {RepositoryPath}.", repositoryPath);

            var result = await ExecuteGitCommandAsync("pull", [], repositoryPath, cancellationToken);

            if (result.Success)
            {
                logger.LogInformation("Successfully pulled changes.");
                return true;
            }

            logger.LogError("Failed to pull changes. Error: {Error}", result.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while pulling changes.");
            return false;
        }
    }

    public async Task<GitStatusResult?> GetStatusAsync(string repositoryPath, CancellationToken cancellationToken)
    {
        try
        {
            var result = await ExecuteGitCommandAsync("status", ["--porcelain=v1"], repositoryPath, cancellationToken);

            if (!result.Success)
            {
                logger.LogError("Failed to get git status. Error: {Error}", result.Error);
                return null;
            }

            // Empty output is valid - it means no changes
            var output = result.Output ?? string.Empty;

            var stagedFiles = new List<GitFileStatus>();
            var unstagedFiles = new List<GitFileStatus>();
            var untrackedFiles = new List<string>();

            var lines = output.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries);

            foreach (var line in lines)
            {
                if (line.Length < 3) continue;

                var stagedStatus = line[0];
                var unstagedStatus = line[1];
                var filePath = line[2..].Trim();
                
                logger.LogDebug("Processing git status line: '{Line}' -> staged: '{StagedStatus}', unstaged: '{UnstagedStatus}', file: '{FilePath}'",
                    line, stagedStatus, unstagedStatus, filePath);

                // Handle staged changes
                if (stagedStatus != ' ' && stagedStatus != '?')
                {
                    var changeType = MapGitStatusToChangeType(stagedStatus);
                    if (changeType.HasValue)
                    {
                        stagedFiles.Add(new GitFileStatus(filePath, changeType.Value));
                    }
                }

                // Handle unstaged changes
                if (unstagedStatus != ' ' && unstagedStatus != '?')
                {
                    var changeType = MapGitStatusToChangeType(unstagedStatus);
                    if (changeType.HasValue)
                    {
                        unstagedFiles.Add(new GitFileStatus(filePath, changeType.Value));
                    }
                }

                // Handle untracked files
                if (stagedStatus == '?' && unstagedStatus == '?')
                {
                    untrackedFiles.Add(filePath);
                }
            }

            logger.LogInformation("Git status retrieved: {StagedCount} staged, {UnstagedCount} unstaged, {UntrackedCount} untracked files.",
                stagedFiles.Count, unstagedFiles.Count, untrackedFiles.Count);

            return new GitStatusResult(
                [.. stagedFiles],
                [.. unstagedFiles],
                [.. untrackedFiles]
            );
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting git status.");
            return null;
        }
    }

    public async Task<string?> GetFileContentAsync(string repositoryPath, string filePath, GitFileMode mode, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Getting file content for {FilePath} in {Mode} mode from repository {RepositoryPath}.", filePath, mode, repositoryPath);

            string? content = mode switch
            {
                GitFileMode.Working => await GetWorkingFileContentAsync(repositoryPath, filePath, cancellationToken),
                GitFileMode.Head => await GetHeadFileContentAsync(repositoryPath, filePath, cancellationToken),
                GitFileMode.Staged => await GetStagedFileContentAsync(repositoryPath, filePath, cancellationToken),
                _ => throw new ArgumentException($"Unsupported file mode: {mode}")
            };

            logger.LogInformation("Successfully retrieved {Mode} content for file {FilePath}. Content length: {ContentLength}", mode, filePath, content?.Length ?? 0);
            return content;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting {Mode} content for file {FilePath}.", mode, filePath);
            return null;
        }
    }

    private async Task<string?> GetWorkingFileContentAsync(string repositoryPath, string filePath, CancellationToken cancellationToken)
    {
        try
        {
            var fullFilePath = Path.Combine(repositoryPath, filePath);
            if (!File.Exists(fullFilePath))
            {
                logger.LogWarning("Working file {FilePath} does not exist.", filePath);
                return null;
            }

            var content = await File.ReadAllTextAsync(fullFilePath, cancellationToken);
            return content;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to read working file content for {FilePath}.", filePath);
            return null;
        }
    }

    private async Task<string?> GetHeadFileContentAsync(string repositoryPath, string filePath, CancellationToken cancellationToken)
    {
        try
        {
            var result = await ExecuteGitCommandAsync("show", [$"HEAD:{filePath}"], repositoryPath, cancellationToken);
            
            if (result.Success)
            {
                return result.Output ?? string.Empty;
            }

            logger.LogWarning("Failed to get HEAD content for file {FilePath}. Error: {Error}", filePath, result.Error);
            return null;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting HEAD content for file {FilePath}.", filePath);
            return null;
        }
    }

    private async Task<string?> GetStagedFileContentAsync(string repositoryPath, string filePath, CancellationToken cancellationToken)
    {
        try
        {
            var result = await ExecuteGitCommandAsync("show", [$":{filePath}"], repositoryPath, cancellationToken);
            
            if (result.Success)
            {
                return result.Output ?? string.Empty;
            }

            logger.LogWarning("Failed to get staged content for file {FilePath}. Error: {Error}", filePath, result.Error);
            return null;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting staged content for file {FilePath}.", filePath);
            return null;
        }
    }


    public async Task<bool> MergeBranchAsync(string repositoryPath, string sourceBranch, string targetBranch, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Merging branch {SourceBranch} into {TargetBranch} in repository {RepositoryPath}.", sourceBranch, targetBranch, repositoryPath);

            // First checkout the target branch
            var checkoutResult = await ExecuteGitCommandAsync("checkout", [targetBranch], repositoryPath, cancellationToken);
            if (!checkoutResult.Success)
            {
                logger.LogError("Failed to checkout target branch {TargetBranch}. Error: {Error}", targetBranch, checkoutResult.Error);
                return false;
            }

            // Then merge the source branch
            var mergeResult = await ExecuteGitCommandAsync("merge", [sourceBranch], repositoryPath, cancellationToken);

            if (mergeResult.Success)
            {
                logger.LogInformation("Successfully merged branch {SourceBranch} into {TargetBranch}.", sourceBranch, targetBranch);
                return true;
            }

            logger.LogError("Failed to merge branch {SourceBranch} into {TargetBranch}. Error: {Error}", sourceBranch, targetBranch, mergeResult.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while merging branch {SourceBranch} into {TargetBranch}.", sourceBranch, targetBranch);
            return false;
        }
    }

    public async Task<bool> ResetBranchAsync(string repositoryPath, string branchName, bool hard, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Resetting branch {BranchName} in repository {RepositoryPath} (hard: {Hard}).", branchName, repositoryPath, hard);

            // First checkout the branch
            var checkoutResult = await ExecuteGitCommandAsync("checkout", [branchName], repositoryPath, cancellationToken);
            if (!checkoutResult.Success)
            {
                logger.LogError("Failed to checkout branch {BranchName}. Error: {Error}", branchName, checkoutResult.Error);
                return false;
            }

            // Reset the branch
            string[] resetArgs = hard ? ["--hard", "HEAD"] : ["HEAD"];
            var resetResult = await ExecuteGitCommandAsync("reset", resetArgs, repositoryPath, cancellationToken);

            if (resetResult.Success)
            {
                logger.LogInformation("Successfully reset branch {BranchName}.", branchName);
                return true;
            }

            logger.LogError("Failed to reset branch {BranchName}. Error: {Error}", branchName, resetResult.Error);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while resetting branch {BranchName}.", branchName);
            return false;
        }
    }

    private static GitChangeType? MapGitStatusToChangeType(char statusChar)
    {
        return statusChar switch
        {
            'A' => GitChangeType.Added,
            'M' => GitChangeType.Modified,
            'D' => GitChangeType.Deleted,
            'R' => GitChangeType.Renamed,
            'C' => GitChangeType.Copied,
            _ => null
        };
    }

    public async Task<GitCommandResult> ExecuteGitCommandAsync(
        string command,
        string[] arguments,
        string? workingDirectory,
        CancellationToken cancellationToken)
    {
        var startInfo = new ProcessStartInfo
        {
            FileName = "git",
            WorkingDirectory = workingDirectory ?? Environment.CurrentDirectory,
            // Set environment variables to prevent Git from waiting for input
            Environment =
            {
                ["GIT_TERMINAL_PROMPT"] = "0",  // Disable terminal prompts
                ["GIT_ASKPASS"] = "echo",        // Prevent password prompts
                ["SSH_ASKPASS"] = "echo",       // Prevent SSH password prompts
                ["GIT_SSH_COMMAND"] = "ssh -o BatchMode=yes -o StrictHostKeyChecking=no" // Non-interactive SSH
            }
        };
        ProcessHelpers.HideProcessWindow(startInfo, setInput: true);

        // Add command as first argument
        startInfo.ArgumentList.Add(command);

        // Add each argument separately to handle spaces properly
        foreach (var argument in arguments)
        {
            startInfo.ArgumentList.Add(argument);
        }

        using var process = Process.Start(startInfo);
        if (process == null)
        {
            throw new InvalidOperationException("Failed to start git process");
        }

        // Close stdin immediately to prevent hanging
        process.StandardInput.Close();

        // Create a timeout for the entire operation
        using var timeoutCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        timeoutCts.CancelAfter(TimeSpan.FromSeconds(30)); // 30 second timeout for all Git operations

        try
        {
            // Read output and error streams concurrently with the process
            var outputTask = process.StandardOutput.ReadToEndAsync(timeoutCts.Token);
            var errorTask = process.StandardError.ReadToEndAsync(timeoutCts.Token);
            var processTask = process.WaitForExitAsync(timeoutCts.Token);

            // Wait for all tasks to complete
            await Task.WhenAll(outputTask, errorTask, processTask);

            var output = await outputTask;
            var error = await errorTask;

            return new GitCommandResult(
                Success: process.ExitCode == 0,
                Output: string.IsNullOrWhiteSpace(output) ? null : output,
                Error: string.IsNullOrWhiteSpace(error) ? null : error,
                ExitCode: process.ExitCode
            );
        }
        catch (OperationCanceledException) when (timeoutCts.Token.IsCancellationRequested && !cancellationToken.IsCancellationRequested)
        {
            // Timeout occurred, kill the process
            try
            {
                if (!process.HasExited)
                {
                    process.Kill(true); // Kill process tree
                }
            }
            catch (Exception killEx)
            {
                // Log kill exception but don't throw it
                System.Diagnostics.Debug.WriteLine($"Failed to kill git process: {killEx.Message}");
            }

            throw new TimeoutException($"Git command 'git {command} {string.Join(" ", arguments)}' timed out after 30 seconds");
        }
        catch (OperationCanceledException)
        {
            // User cancellation, kill the process
            try
            {
                if (!process.HasExited)
                {
                    process.Kill(true);
                }
            }
            catch (Exception killEx)
            {
                System.Diagnostics.Debug.WriteLine($"Failed to kill git process: {killEx.Message}");
            }

            throw;
        }
    }
}


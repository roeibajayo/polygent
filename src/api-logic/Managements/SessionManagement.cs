using MediatorCore;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Handlers;
using Polygent.Logic.Helpers;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;
using System.Text.Json;

namespace Polygent.Logic.Managements;

public record McpServerConfig(string Command, string[] Args, Dictionary<string, string> Env);
public record McpConfig(Dictionary<string, McpServerConfig> McpServers);

internal sealed class SessionManagement(
    INotificationService notificationService,
    ISessionRepository sessionRepository,
    IMessageRepository messageRepository,
    IGitService gitService,
    IStorageService storageService,
    IMessageProcessingManager messageProcessingManager,
    IPublisher publisher,
    IMCPRepository mcpRepository,
    ILogger<SessionManagement> logger)
    : ISessionManagement, IScopedService<ISessionManagement>
{
    public async Task<int> CreateAsync(CreateSessionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Creating session for workspace {WorkspaceId}.", request.WorkspaceId);

            var now = DateTime.UtcNow;

            var session = new SessionEntity(
                0,
                request.WorkspaceId,
                SessionStatus.Waiting,
                request.StarterGitBranch,
                request.AgentId,
                null, // ProviderSessionId - will be set later during message processing
                false, // HasUnreadMessage - new sessions start without unread messages
                request.Name, // Use provided name (can be null)
                now,
                now
            );

            var sessionId = await sessionRepository.CreateAsync(session, cancellationToken);

            // Create MCP config file for session
            var mcpConfigPath = await CreateMcpConfigFileAsync(request.WorkspaceId, sessionId, cancellationToken);

            // Create git worktree for session
            var workspacePath = storageService.GetWorkspacePath(request.WorkspaceId);
            var gitPath = storageService.GetGitPath(session.WorkspaceId);
            var sessionPath = storageService.GetSessionPath(request.WorkspaceId, sessionId);

            // GitService now handles branch conflicts automatically with detached HEAD fallback
            var worktreeResult = await gitService.CreateWorktreeAsync(
                gitPath,
                request.StarterGitBranch,
                sessionPath,
                cancellationToken);

            if (!worktreeResult)
            {
                logger.LogError("Failed to create worktree for session {SessionId}.", sessionId);
                await sessionRepository.DeleteAsync(sessionId, cancellationToken);
                throw new InvalidOperationException($"Failed to create worktree for session {sessionId}");
            }

            logger.LogInformation("Successfully created session {SessionId}.", sessionId);
            return sessionId;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating session for workspace {WorkspaceId}.", request.WorkspaceId);
            throw;
        }
    }

    public async Task<SessionEntity?> GetAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            return await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting session {SessionId}.", sessionId);
            throw;
        }
    }

    public async Task<SessionEntity[]> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken)
    {
        try
        {
            return await sessionRepository.GetByWorkspaceIdAsync(workspaceId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting sessions for workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<SessionEntity[]> GetActiveSessionsAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await sessionRepository.GetActiveSessionsAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting active sessions.");
            throw;
        }
    }

    public async Task<bool> UpdateAsync(int sessionId, UpdateSessionRequest request, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Updating session {SessionId}.", sessionId);

            var existing = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (existing is null)
            {
                logger.LogWarning("Session {SessionId} not found for update.", sessionId);
                return false;
            }

            var updated = new SessionEntity(
                existing.Id,
                existing.WorkspaceId,
                request.Status ?? existing.Status,
                request.StarterGitBranch ?? existing.StarterGitBranch,
                existing.AgentId,
                request.ResetProviderSessionId ? null : existing.ProviderSessionId,
                request.HasUnreadMessage ?? existing.HasUnreadMessage, // Allow updating HasUnreadMessage
                request.Name ?? existing.Name, // Allow name updates
                existing.CreatedAt,
                DateTime.UtcNow
            );

            var result = await sessionRepository.UpdateAsync(updated, cancellationToken);

            if (request.Status is not null && request.Status != existing.Status)
            {
                await notificationService.SendSessionStatusChanged(sessionId, request.Status.Value);

                if (request.Status != SessionStatus.InProgress)
                    publisher.Publish(new TryPullUserMessageMessage(), CancellationToken.None);
            }

            if (request.HasUnreadMessage is not null && request.HasUnreadMessage != existing.HasUnreadMessage)
            {
                await notificationService.SendSessionUnreadMessageChanged(sessionId, request.HasUnreadMessage.Value);
            }

            if (result)
            {
                logger.LogInformation("Successfully updated session {SessionId}.", sessionId);
            }

            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating session {SessionId}.", sessionId);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deleting session {SessionId}.", sessionId);

            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session is null)
            {
                logger.LogWarning("Session {SessionId} not found for deletion.", sessionId);
                return false;
            }

            // Delete worktree
            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);
            await gitService.DeleteWorktreeAsync(sessionPath, cancellationToken);

            // Delete session from database
            var result = await sessionRepository.DeleteAsync(sessionId, cancellationToken);

            if (result)
            {
                logger.LogInformation("Successfully deleted session {SessionId}.", sessionId);
            }

            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting session {SessionId}.", sessionId);
            throw;
        }
    }

    public async Task<bool> MergeToMainAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Merging session {SessionId} to main branch.", sessionId);

            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session is null)
            {
                logger.LogWarning("Session {SessionId} not found.", sessionId);
                return false;
            }

            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);
            var workspacePath = storageService.GetWorkspacePath(session.WorkspaceId);
            var gitPath = storageService.GetGitPath(session.WorkspaceId);

            // Get current branch name from session worktree (should be the session's working branch)
            var currentBranch = await gitService.GetCurrentBranchAsync(sessionPath, cancellationToken);
            if (string.IsNullOrEmpty(currentBranch))
            {
                // We're in detached HEAD state, need to create a branch
                logger.LogInformation("Detached HEAD detected for session {SessionId}, creating branch.", sessionId);

                var branchName = $"sessions/s-{sessionId}";

                // Create and checkout the branch
                var createBranchResult = await gitService.ExecuteGitCommandAsync("checkout", ["-b", branchName], sessionPath, cancellationToken);
                if (!createBranchResult.Success)
                {
                    logger.LogError("Failed to create branch {BranchName} for session {SessionId}. Error: {Error}", branchName, sessionId, createBranchResult.Error);
                    return false;
                }

                currentBranch = branchName;
                logger.LogInformation("Created and switched to branch {BranchName} for session {SessionId}.", branchName, sessionId);
            }

            // Step 1: Stage all changes in session worktree
            logger.LogInformation("Staging all changes for session {SessionId}.", sessionId);
            var stageResult = await gitService.StageChangesAsync(sessionPath, cancellationToken);
            if (!stageResult)
            {
                logger.LogError("Failed to stage changes for session {SessionId}.", sessionId);
                return false;
            }

            // Step 2: Commit staged changes in session worktree
            logger.LogInformation("Committing staged changes for session {SessionId}.", sessionId);
            var commitMessage = session.Name ?? $"Polygent #{sessionId}";
            var commitResult = await gitService.CommitStagedChangesAsync(sessionPath, commitMessage, cancellationToken);
            if (!commitResult)
            {
                logger.LogInformation("No changes to commit for session {SessionId}.", sessionId);
                // Continue anyway - might be no new changes since last commit
            }

            // Step 3: Push session branch to remote
            logger.LogInformation("Pushing session branch {CurrentBranch} for session {SessionId}.", currentBranch, sessionId);
            var pushSessionResult = await gitService.PushChangesAsync(sessionPath, cancellationToken);
            if (!pushSessionResult)
            {
                logger.LogError("Failed to push session branch for session {SessionId}.", sessionId);
                return false;
            }

            // Step 4: Merge session branch into main (in main git repository)
            logger.LogInformation("Merging session branch {CurrentBranch} into main for session {SessionId}.", currentBranch, sessionId);
            var mergeResult = await gitService.MergeBranchAsync(gitPath, currentBranch, "main", cancellationToken);
            if (!mergeResult)
            {
                logger.LogError("Failed to merge session {SessionId} to main branch.", sessionId);
                return false;
            }

            // Step 5: Push updated main branch to remote
            logger.LogInformation("Pushing updated main branch after merging session {SessionId}.", sessionId);
            var pushMainResult = await gitService.PushChangesAsync(gitPath, cancellationToken);
            if (!pushMainResult)
            {
                logger.LogError("Failed to push main branch after merging session {SessionId}.", sessionId);
                return false;
            }

            logger.LogInformation("Successfully completed merge to main workflow for session {SessionId}.", sessionId);

            // Mark session as completed
            logger.LogInformation("Marking session {SessionId} as completed after successful merge to main.", sessionId);
            var updateResult = await UpdateAsync(sessionId, new UpdateSessionRequest(SessionStatus.Done), cancellationToken);

            if (updateResult)
            {
                // Cleanup session folder after successful completion
                logger.LogInformation("Cleaning up session folder after completion for session {SessionId}.", sessionId);
                var sessionPathForCleanup = storageService.GetSessionPath(session.WorkspaceId, sessionId);
                await gitService.DeleteWorktreeAsync(sessionPathForCleanup, cancellationToken);

                logger.LogInformation("Successfully marked session {SessionId} as completed and cleaned up after merge to main.", sessionId);
                return true;
            }

            logger.LogError("Failed to mark session {SessionId} as completed after merge to main.", sessionId);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while merging session {SessionId} to main.", sessionId);
            return false;
        }
    }

    public async Task<bool> PushBranchAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Pushing changes for session {SessionId}.", sessionId);

            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session is null)
            {
                logger.LogWarning("Session {SessionId} not found.", sessionId);
                return false;
            }

            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);

            var pushResult = await gitService.PushChangesAsync(sessionPath, cancellationToken);

            if (!pushResult)
            {
                logger.LogError("Failed to push changes for session {SessionId}.", sessionId);
                return false;
            }

            logger.LogInformation("Successfully pushed changes for session {SessionId}.", sessionId);

            // Mark session as completed
            logger.LogInformation("Marking session {SessionId} as completed.", sessionId);
            var updateResult = await UpdateAsync(sessionId, new UpdateSessionRequest(SessionStatus.Done), cancellationToken);

            if (updateResult)
            {
                // Cleanup session folder after successful completion
                logger.LogInformation("Cleaning up session folder after completion for session {SessionId}.", sessionId);
                var sessionPathForCleanup = storageService.GetSessionPath(session.WorkspaceId, sessionId);
                await gitService.DeleteWorktreeAsync(sessionPathForCleanup, cancellationToken);

                logger.LogInformation("Successfully marked session {SessionId} as completed and cleaned up.", sessionId);
                return true;
            }

            logger.LogError("Failed to mark session {SessionId} as completed.", sessionId);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while pushing changes for session {SessionId}.", sessionId);
            return false;
        }
    }

    public async Task<bool> PullFromStarterBranchAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Pulling from starter branch for session {SessionId}.", sessionId);

            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session is null)
            {
                logger.LogWarning("Session {SessionId} not found.", sessionId);
                return false;
            }

            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);
            var workspacePath = storageService.GetWorkspacePath(session.WorkspaceId);
            var gitPath = storageService.GetGitPath(session.WorkspaceId);

            // Get current session branch
            var currentBranch = await gitService.GetCurrentBranchAsync(sessionPath, cancellationToken);
            if (string.IsNullOrEmpty(currentBranch))
            {
                // We're in detached HEAD state, need to create a branch first
                logger.LogInformation("Detached HEAD detected for session {SessionId}, creating branch.", sessionId);

                var branchName = $"sessions/s-{sessionId}";

                // Create and checkout the branch
                var createBranchResult = await gitService.ExecuteGitCommandAsync("checkout", ["-b", branchName], sessionPath, cancellationToken);
                if (!createBranchResult.Success)
                {
                    logger.LogError("Failed to create branch {BranchName} for session {SessionId}. Error: {Error}", branchName, sessionId, createBranchResult.Error);
                    return false;
                }

                currentBranch = branchName;
                logger.LogInformation("Created and switched to branch {BranchName} for session {SessionId}.", branchName, sessionId);
            }

            // Pull latest changes from starter branch in the main repository
            logger.LogInformation("Pulling latest changes from starter branch {StarterBranch} in main repository.", session.StarterGitBranch);
            var pullResult = await gitService.PullChangesAsync(gitPath, cancellationToken);
            if (!pullResult)
            {
                logger.LogError("Failed to pull latest changes from starter branch {StarterBranch}.", session.StarterGitBranch);
                return false;
            }

            // Merge the starter branch into the current session branch (in session worktree)
            // We use git merge directly to avoid the worktree checkout conflict
            logger.LogInformation("Merging starter branch {StarterBranch} into session branch {CurrentBranch} in session worktree.", session.StarterGitBranch, currentBranch);
            var mergeResult = await gitService.ExecuteGitCommandAsync("merge", [session.StarterGitBranch], sessionPath, cancellationToken);
            if (!mergeResult.Success)
            {
                logger.LogError("Failed to merge starter branch {StarterBranch} into session branch {CurrentBranch}. Error: {Error}", session.StarterGitBranch, currentBranch, mergeResult.Error);
                return false;
            }

            logger.LogInformation("Successfully pulled from starter branch and merged into session {SessionId}.", sessionId);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while pulling from starter branch for session {SessionId}.", sessionId);
            return false;
        }
    }

    public async Task<bool> ResetSessionAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Resetting session {SessionId}.", sessionId);

            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session is null)
            {
                logger.LogWarning("Session {SessionId} not found.", sessionId);
                return false;
            }

            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);

            // For session worktrees, we can directly reset to the origin branch without checking out
            // since worktrees are designed to work in detached HEAD state
            logger.LogInformation("Resetting session {SessionId} to origin/{StarterBranch}.", sessionId, session.StarterGitBranch);

            // First, fetch the latest changes from origin to ensure we have the most recent commits
            var fetchResult = await gitService.ExecuteGitCommandAsync("fetch", ["origin", session.StarterGitBranch], sessionPath, cancellationToken);
            if (!fetchResult.Success)
            {
                logger.LogWarning("Failed to fetch latest changes for session {SessionId}. Proceeding with reset. Error: {Error}", sessionId, fetchResult.Error);
                // Continue anyway as the reset might still work with cached refs
            }

            // Reset to match the origin/starter branch (hard reset)
            var resetResult = await gitService.ExecuteGitCommandAsync("reset", ["--hard", $"origin/{session.StarterGitBranch}"], sessionPath, cancellationToken);
            if (!resetResult.Success)
            {
                logger.LogError("Failed to reset session {SessionId} to origin/{StarterBranch}. Error: {Error}", sessionId, session.StarterGitBranch, resetResult.Error);
                return false;
            }

            // Clean any untracked files
            var cleanResult = await gitService.ExecuteGitCommandAsync("clean", ["-fd"], sessionPath, cancellationToken);
            if (!cleanResult.Success)
            {
                logger.LogWarning("Failed to clean untracked files for session {SessionId}. Error: {Error}", sessionId, cleanResult.Error);
                // Don't fail the operation for this
            }

            // Delete all messages in the session
            logger.LogInformation("Deleting all messages for session {SessionId}.", sessionId);
            var deleteMessagesResult = await messageRepository.DeleteBySessionIdAsync(sessionId, cancellationToken);
            if (!deleteMessagesResult)
            {
                logger.LogWarning("Failed to delete messages for session {SessionId}.", sessionId);
                // Continue with the reset even if message deletion fails
            }

            // Update session status to Ready
            var updateRequest = new UpdateSessionRequest(SessionStatus.Waiting, session.StarterGitBranch, ResetProviderSessionId: true);
            var updateResult = await UpdateAsync(sessionId, updateRequest, cancellationToken);

            if (updateResult)
            {
                logger.LogInformation("Successfully reset session {SessionId}.", sessionId);
                return true;
            }

            logger.LogError("Failed to update session status after reset for session {SessionId}.", sessionId);
            return false;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while resetting session {SessionId}.", sessionId);
            return false;
        }
    }

    public async Task<bool> CancelSessionAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Canceling session {SessionId}.", sessionId);

            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session is null)
            {
                logger.LogWarning("Session {SessionId} not found.", sessionId);
                return false;
            }

            // Cancel all pending messages for this session
            logger.LogInformation("Canceling pending messages for session {SessionId}.", sessionId);
            var cancelMessagesResult = await messageRepository.UpdatePendingMessagesStatusAsync(sessionId, MessageStatus.Canceled, cancellationToken);
            if (!cancelMessagesResult)
            {
                logger.LogWarning("Failed to cancel pending messages for session {SessionId}.", sessionId);
                // Continue with session cancellation even if message cancellation fails
            }

            // Update session status to Canceled
            var updateRequest = new UpdateSessionRequest(SessionStatus.Canceled, session.StarterGitBranch);
            await UpdateAsync(sessionId, updateRequest, cancellationToken);

            // Cleanup session folder after cancellation
            logger.LogInformation("Cleaning up session folder after cancellation for session {SessionId}.", sessionId);
            var sessionPathForCancellation = storageService.GetSessionPath(session.WorkspaceId, sessionId);
            await gitService.DeleteWorktreeAsync(sessionPathForCancellation, cancellationToken);

            logger.LogInformation("Successfully canceled and cleaned up session {SessionId}.", sessionId);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while canceling session {SessionId}.", sessionId);
            return false;
        }
    }

    public async Task<bool> CancelWorkingMessagesAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Canceling working messages for session {SessionId}.", sessionId);

            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session is null)
            {
                logger.LogWarning("Session {SessionId} not found.", sessionId);
                return false;
            }

            // Cancel all pending messages for this session
            logger.LogInformation("Canceling pending messages for session {SessionId}.", sessionId);
            var cancelMessagesResult = await messageRepository.UpdatePendingMessagesStatusAsync(sessionId, MessageStatus.Canceled, cancellationToken);
            if (!cancelMessagesResult)
            {
                logger.LogWarning("Failed to cancel pending messages for session {SessionId}.", sessionId);
                // Continue with session cancellation even if message cancellation fails
            }

            // Also Cancel actively processing messages first (this will interrupt the agent)
            var activelyProcessingCancelled = await messageProcessingManager.CancelSessionWorkingMessagesAsync(sessionId);

            var success = activelyProcessingCancelled || cancelMessagesResult;

            if (success)
            {
                logger.LogInformation("Successfully canceled working messages for session {SessionId}.", sessionId);
            }
            else
            {
                logger.LogWarning("No working messages found to cancel for session {SessionId}.", sessionId);
            }

            return success;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while canceling working messages for session {SessionId}.", sessionId);
            return false;
        }
    }

    public async Task<bool> CancelMessageAsync(int messageId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Canceling message {MessageId}.", messageId);

            // Cancel the actively processing message (this will interrupt the agent)
            var result = await messageProcessingManager.CancelMessageProcessingAsync(messageId);

            if (result)
            {
                logger.LogInformation("Successfully canceled message {MessageId}.", messageId);
            }
            else
            {
                logger.LogWarning("Message {MessageId} was not actively processing or not found.", messageId);
            }

            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while canceling message {MessageId}.", messageId);
            return false;
        }
    }

    public async Task<bool> OpenWithVSCodeAsync(int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Opening session {SessionId} with VSCode.", sessionId);

            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session is null)
            {
                logger.LogWarning("Session {SessionId} not found.", sessionId);
                return false;
            }

            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);

            if (!Directory.Exists(sessionPath))
            {
                logger.LogWarning("Session directory {SessionPath} not found for session {SessionId}.", sessionPath, sessionId);
                return false;
            }

            var success = OpenFolderWithVSCode(sessionPath);

            if (success)
            {
                logger.LogInformation("Successfully opened session {SessionId} with VSCode at path {SessionPath}.", sessionId, sessionPath);
            }
            else
            {
                logger.LogWarning("Failed to open session {SessionId} with VSCode.", sessionId);
            }

            return success;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while opening session {SessionId} with VSCode.", sessionId);
            return false;
        }
    }

    public async Task StopAllWorkingSessionsAsync(CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Stopping all working (InProgress) sessions on application start.");

            var allSessions = await sessionRepository.GetActiveSessionsAsync(cancellationToken);
            var workingSessions = allSessions.Where(s => s.Status == SessionStatus.InProgress).ToArray();

            logger.LogInformation("Found {WorkingSessionCount} working sessions to stop.", workingSessions.Length);

            foreach (var session in workingSessions)
            {
                logger.LogInformation("Stopping working messages for session {SessionId}.", session.Id);

                // Cancel working messages
                var stopResult = await CancelWorkingMessagesAsync(session.Id, cancellationToken);

                // Change session status to Waiting and set unread indicator
                var updateResult = await UpdateAsync(session.Id, new UpdateSessionRequest(SessionStatus.Waiting, HasUnreadMessage: true), cancellationToken);

                if (stopResult || updateResult)
                {
                    logger.LogInformation("Successfully stopped working messages, set status to Waiting, and marked as unread for session {SessionId}.", session.Id);
                }
                else
                {
                    logger.LogWarning("Failed to stop working messages or update status for session {SessionId}.", session.Id);
                }
            }

            logger.LogInformation("Completed stopping working messages for all working sessions. Processed {ProcessedCount} sessions.", workingSessions.Length);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while stopping working messages for all working sessions on application start.");
            throw;
        }
    }

    private static bool OpenFolderWithVSCode(string folderPath)
    {
        try
        {
            var success = ProcessHelpers.OpenFileWithEditor("vscode", folderPath);

            if (!success)
                throw new InvalidOperationException("Failed to open folder with 'code' command.");

            return success;
        }
        catch
        {
            // If 'code' command fails, try VSCode Insiders as fallback
            try
            {
                var fallbackProcessInfo = ProcessHelpers.OpenFileWithEditor("vscode-insiders", folderPath);

                if (!fallbackProcessInfo)
                    throw new InvalidOperationException("Failed to open folder with 'code-insiders' command.");

                return true;
            }
            catch
            {
                // Ignore fallback errors
            }

            return false;
        }
    }

    private async Task<string?> CreateMcpConfigFileAsync(int workspaceId, int sessionId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Creating MCP config file for session {SessionId}.", sessionId);

            // Get all available MCPs
            var mcps = await mcpRepository.GetAllAsync(cancellationToken);

            if (mcps.Length == 0)
            {
                logger.LogInformation("No MCPs found, skipping MCP config file creation for session {SessionId}.", sessionId);
                return null;
            }

            // Ensure files directory exists
            var filesPath = storageService.EnsureFilesPath(workspaceId);

            // Create MCP config file name
            var mcpConfigFileName = $"mcp-session-{sessionId}.json";
            var mcpConfigPath = Path.Combine(filesPath, mcpConfigFileName);

            // Create MCP configuration from real MCPs
            var mcpServers = new Dictionary<string, McpServerConfig>();

            foreach (var mcp in mcps)
            {
                var serverConfig = new McpServerConfig(
                    Command: mcp.Path,
                    Args: Array.Empty<string>(),
                    Env: new Dictionary<string, string>()
                );

                mcpServers[mcp.Name] = serverConfig;
            }

            var mcpConfig = new McpConfig(mcpServers);

            // Serialize to JSON with indentation
            var options = new JsonSerializerOptions
            {
                WriteIndented = true,
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            var jsonContent = JsonSerializer.Serialize(mcpConfig, options);

            // Write to file
            await File.WriteAllTextAsync(mcpConfigPath, jsonContent, cancellationToken);

            logger.LogInformation("Successfully created MCP config file for session {SessionId} at {McpConfigPath} with {McpCount} servers.", sessionId, mcpConfigPath, mcps.Length);
            return mcpConfigPath;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating MCP config file for session {SessionId}.", sessionId);
            // Don't throw - this shouldn't fail session creation
            return null;
        }
    }
}
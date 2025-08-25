using Microsoft.Extensions.Logging;
using Polygent.Logic.Interfaces;
using Polygent.Logic.Services;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Managements;

internal sealed class EnvironmentManagement(
    ILogger<EnvironmentManagement> logger,
    IEnvironmentRepository environmentRepository,
    IGitService gitService,
    IStorageService storageService,
    IFileSystemService fileSystemService,
    ITaskRepository taskRepository,
    FileSyncService fileSyncService,
    ITaskExecutionService taskExecutionService)
    : IEnvironmentManagement, IScopedService<IEnvironmentManagement>
{
    public async Task<int> CreateAsync(CreateEnvironmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Creating environment {EnvironmentName} for workspace {WorkspaceId}.", request.Name, request.WorkspaceId);

            // Check environment limit (max 1 environment per workspace)
            var existingEnvironments = await environmentRepository.GetByWorkspaceIdAsync(request.WorkspaceId, cancellationToken);
            if (existingEnvironments.Length >= 1)
            {
                throw new InvalidOperationException("Maximum of 1 environment allowed per workspace. Please delete the existing environment first.");
            }

            var environmentId = 0;
            var now = DateTime.UtcNow;

            var environment = new EnvironmentEntity(
                environmentId,
                request.WorkspaceId,
                request.Name,
                request.GitBranch,
                request.Url,
                request.EnvironmentVariables,
                now,
                now
            );

            var id = await environmentRepository.CreateAsync(environment, cancellationToken);

            // Create environment directory structure
            var environmentPath = storageService.GetEnvironmentPath(request.WorkspaceId, request.Name);
            await fileSystemService.CreateDirectoryAsync(environmentPath, cancellationToken);

            // Clone the specific branch to the environment directory
            var workspacePath = storageService.GetWorkspacePath(request.WorkspaceId);
            var gitPath = storageService.GetGitPath(request.WorkspaceId);

            // Copy git repository to environment and checkout the specific branch
            await fileSystemService.CopyDirectoryAsync(gitPath, environmentPath, cancellationToken);
            await gitService.CheckoutBranchAsync(environmentPath, request.GitBranch, cancellationToken);

            logger.LogInformation("Successfully created environment {EnvironmentName} with ID {EnvironmentId}.", request.Name, id);
            return id;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating environment {EnvironmentName}.", request.Name);
            throw;
        }
    }

    public async Task<EnvironmentEntity?> GetAsync(int environmentId, CancellationToken cancellationToken)
    {
        try
        {
            return await environmentRepository.GetByIdAsync(environmentId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting environment {EnvironmentId}.", environmentId);
            throw;
        }
    }

    public async Task<EnvironmentEntity[]> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken)
    {
        try
        {
            return await environmentRepository.GetByWorkspaceIdAsync(workspaceId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting environments for workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<bool> UpdateAsync(int environmentId, UpdateEnvironmentRequest request, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Updating environment {EnvironmentId}.", environmentId);

            var existing = await environmentRepository.GetByIdAsync(environmentId, cancellationToken);
            if (existing is null)
            {
                logger.LogWarning("Environment {EnvironmentId} not found for update.", environmentId);
                return false;
            }

            var updated = new EnvironmentEntity(
                existing.Id,
                existing.WorkspaceId,
                request.Name ?? existing.Name,
                existing.GitBranch, // Git branch cannot be changed after creation
                request.Url ?? existing.Url,
                request.EnvironmentVariables ?? existing.EnvironmentVariables,
                existing.CreatedAt,
                DateTime.UtcNow
            );

            var result = await environmentRepository.UpdateAsync(updated, cancellationToken);

            if (result)
            {
                logger.LogInformation("Successfully updated environment {EnvironmentId}.", environmentId);
            }

            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating environment {EnvironmentId}.", environmentId);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int environmentId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deleting environment {EnvironmentId}.", environmentId);

            var environment = await environmentRepository.GetByIdAsync(environmentId, cancellationToken);
            if (environment is null)
            {
                logger.LogWarning("Environment {EnvironmentId} not found for deletion.", environmentId);
                return false;
            }

            // Delete environment directory structure
            var environmentPath = storageService.GetEnvironmentPath(environment.WorkspaceId, environment.Name);
            if (await fileSystemService.DirectoryExistsAsync(environmentPath, cancellationToken))
            {
                await fileSystemService.DeleteDirectoryAsync(environmentPath, cancellationToken);
            }

            var result = await environmentRepository.DeleteAsync(environmentId, cancellationToken);

            if (result)
            {
                logger.LogInformation("Successfully deleted environment {EnvironmentName} with ID {EnvironmentId}.", environment.Name, environmentId);
            }

            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting environment {EnvironmentId}.", environmentId);
            throw;
        }
    }

    public async Task<bool> DeployFromSessionAsync(int environmentId, int sessionId, bool restartAfterSync, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deploying session {SessionId} to environment {EnvironmentId}.", sessionId, environmentId);

            var environment = await environmentRepository.GetByIdAsync(environmentId, cancellationToken);
            if (environment is null)
            {
                logger.LogError("Environment {EnvironmentId} not found for deployment.", environmentId);
                return false;
            }

            var sessionPath = storageService.GetSessionPath(environment.WorkspaceId, sessionId);
            var environmentPath = storageService.GetEnvironmentPath(environment.WorkspaceId, environment.Name);

            // Copy session changes to environment
            fileSyncService.SyncDirectories(environmentPath, sessionPath);

            // If restart after sync is requested, stop all running tasks and start them again
            if (restartAfterSync)
            {
                logger.LogInformation("Restarting environment {EnvironmentId} after deployment.", environmentId);

                // Get all currently running tasks
                var tasks = await taskRepository.GetByWorkspaceIdAsync(environment.WorkspaceId, cancellationToken);
                var taskStatuses = await taskExecutionService.GetTaskStatusesAsync(environment.WorkspaceId, environmentId, false, cancellationToken);
                var runningTaskIds = taskStatuses
                    .Where(t => t.Status == Interfaces.TaskStatus.Running)
                    .ToArray();
                var executeTaskIds = runningTaskIds
                    .Select(x => x.TaskId)
                    .ToArray();

                if (runningTaskIds.Length > 0)
                {
                    // Stop all running tasks
                    foreach (var task in runningTaskIds)
                    {
                        if (task.TaskExecutionId.HasValue)
                        {
                            await taskExecutionService.StopTaskAsync(task.TaskExecutionId.Value, cancellationToken);
                            logger.LogInformation("Stopped task {TaskName} (ID: {TaskId}) in environment {EnvironmentId}.", task.Name, task.TaskId, environmentId);
                        }
                    }

                    // Wait a moment for tasks to fully stop
                    await Task.Delay(1000, cancellationToken);
                }
                else
                {
                    // If no tasks are running, start all tasks that are defined in the environment
                    executeTaskIds = [.. tasks
                        .Where(t => t.Type == TaskType.Start)
                        .Select(t => t.Id)];
                }

                if (executeTaskIds.Length > 0)
                {
                    tasks = [.. tasks.Where(t => executeTaskIds.Contains(t.Id))];

                    // Restart the stopped tasks
                    foreach (var task in tasks)
                    {
                        if (task.Type.HasValue)
                        {
                            try
                            {
                                await taskExecutionService.StartEnvironmentTaskAsync(environmentId, task.Id, cancellationToken);
                                logger.LogInformation("Restarted task {TaskName} (ID: {TaskId}) in environment {EnvironmentId}.", task.Name, task.Id, environmentId);
                            }
                            catch (Exception ex)
                            {
                                logger.LogWarning(ex, "Failed to restart task {TaskName} (ID: {TaskId}) in environment {EnvironmentId}.", task.Name, task.Id, environmentId);
                            }
                        }
                    }
                }

                logger.LogInformation("Environment restart completed for environment {EnvironmentId}.", environmentId);
            }

            logger.LogInformation("Successfully deployed session {SessionId} to environment {EnvironmentId}.", sessionId, environmentId);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deploying session {SessionId} to environment {EnvironmentId}.", sessionId, environmentId);
            throw;
        }
    }

    public async Task<Dictionary<string, string>?> GetEnvironmentVariablesAsync(int environmentId, CancellationToken cancellationToken)
    {
        try
        {
            var environment = await environmentRepository.GetByIdAsync(environmentId, cancellationToken);
            if (environment is null)
            {
                logger.LogWarning("Environment {EnvironmentId} not found.", environmentId);
                return null;
            }

            return environment.EnvironmentVariables;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting environment variables for environment {EnvironmentId}.", environmentId);
            throw;
        }
    }

    public async Task<bool> SetEnvironmentVariableAsync(int environmentId, string key, string value, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Setting environment variable {Key} for environment {EnvironmentId}.", key, environmentId);

            var environment = await environmentRepository.GetByIdAsync(environmentId, cancellationToken);
            if (environment is null)
            {
                logger.LogWarning("Environment {EnvironmentId} not found.", environmentId);
                return false;
            }

            var updatedVariables = new Dictionary<string, string>(environment.EnvironmentVariables)
            {
                [key] = value
            };

            var updated = new EnvironmentEntity(
                environment.Id,
                environment.WorkspaceId,
                environment.Name,
                environment.GitBranch,
                environment.Url,
                updatedVariables,
                environment.CreatedAt,
                DateTime.UtcNow
            );

            var result = await environmentRepository.UpdateAsync(updated, cancellationToken);

            if (result)
            {
                logger.LogInformation("Successfully set environment variable {Key} for environment {EnvironmentId}.", key, environmentId);
            }

            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while setting environment variable {Key} for environment {EnvironmentId}.", key, environmentId);
            throw;
        }
    }

    public async Task<bool> UpdateEnvironmentVariableAsync(int environmentId, string key, string value, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Updating environment variable {Key} for environment {EnvironmentId}.", key, environmentId);

            var environment = await environmentRepository.GetByIdAsync(environmentId, cancellationToken);
            if (environment is null)
            {
                logger.LogWarning("Environment {EnvironmentId} not found.", environmentId);
                return false;
            }

            if (!environment.EnvironmentVariables.ContainsKey(key))
            {
                logger.LogWarning("Environment variable {Key} not found in environment {EnvironmentId}.", key, environmentId);
                return false;
            }

            var updatedVariables = new Dictionary<string, string>(environment.EnvironmentVariables)
            {
                [key] = value
            };

            var updated = new EnvironmentEntity(
                environment.Id,
                environment.WorkspaceId,
                environment.Name,
                environment.GitBranch,
                environment.Url,
                updatedVariables,
                environment.CreatedAt,
                DateTime.UtcNow
            );

            var result = await environmentRepository.UpdateAsync(updated, cancellationToken);

            if (result)
            {
                logger.LogInformation("Successfully updated environment variable {Key} for environment {EnvironmentId}.", key, environmentId);
            }

            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating environment variable {Key} for environment {EnvironmentId}.", key, environmentId);
            throw;
        }
    }

    public async Task<bool> DeleteEnvironmentVariableAsync(int environmentId, string key, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deleting environment variable {Key} from environment {EnvironmentId}.", key, environmentId);

            var environment = await environmentRepository.GetByIdAsync(environmentId, cancellationToken);
            if (environment is null)
            {
                logger.LogWarning("Environment {EnvironmentId} not found.", environmentId);
                return false;
            }

            if (!environment.EnvironmentVariables.ContainsKey(key))
            {
                logger.LogWarning("Environment variable {Key} not found in environment {EnvironmentId}.", key, environmentId);
                return false;
            }

            var updatedVariables = new Dictionary<string, string>(environment.EnvironmentVariables);
            updatedVariables.Remove(key);

            var updated = new EnvironmentEntity(
                environment.Id,
                environment.WorkspaceId,
                environment.Name,
                environment.GitBranch,
                environment.Url,
                updatedVariables,
                environment.CreatedAt,
                DateTime.UtcNow
            );

            var result = await environmentRepository.UpdateAsync(updated, cancellationToken);

            if (result)
            {
                logger.LogInformation("Successfully deleted environment variable {Key} from environment {EnvironmentId}.", key, environmentId);
            }

            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting environment variable {Key} from environment {EnvironmentId}.", key, environmentId);
            throw;
        }
    }

    public async Task<bool> ResetEnvironmentAsync(int environmentId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Resetting environment {EnvironmentId} git repository.", environmentId);

            var environment = await environmentRepository.GetByIdAsync(environmentId, cancellationToken);
            if (environment is null)
            {
                logger.LogWarning("Environment {EnvironmentId} not found for reset.", environmentId);
                return false;
            }

            var environmentPath = storageService.GetEnvironmentPath(environment.WorkspaceId, environment.Name);
            var gitPath = storageService.GetGitPath(environment.WorkspaceId);

            // Check if environment directory has a proper git repository
            var gitDirPath = Path.Combine(environmentPath, ".git");
            if (!await fileSystemService.DirectoryExistsAsync(gitDirPath, cancellationToken))
            {
                logger.LogInformation("Environment {EnvironmentId} does not have a git repository. Recreating from workspace git.", environmentId);

                // Remove existing environment directory and recreate
                if (await fileSystemService.DirectoryExistsAsync(environmentPath, cancellationToken))
                {
                    await fileSystemService.DeleteDirectoryAsync(environmentPath, cancellationToken);
                }
                
                await fileSystemService.CreateDirectoryAsync(environmentPath, cancellationToken);

                // Copy git repository to environment
                await fileSystemService.CopyDirectoryAsync(gitPath, environmentPath, cancellationToken);

                // Checkout the specific branch
                var checkoutResult = await gitService.CheckoutBranchAsync(environmentPath, environment.GitBranch, cancellationToken);
                if (!checkoutResult)
                {
                    logger.LogError("Failed to checkout branch {GitBranch} for environment {EnvironmentId}.", environment.GitBranch, environmentId);
                    return false;
                }
            }
            else
            {
                // Reset all git changes (hard reset to remove any local changes)
                var resetResult = await gitService.ResetBranchAsync(environmentPath, environment.GitBranch, hard: true, cancellationToken);
                if (!resetResult)
                {
                    logger.LogError("Failed to reset git repository for environment {EnvironmentId}.", environmentId);
                    return false;
                }
            }

            // Pull latest changes from remote
            var pullResult = await gitService.PullChangesAsync(environmentPath, cancellationToken);
            if (!pullResult)
            {
                logger.LogError("Failed to pull latest changes for environment {EnvironmentId}.", environmentId);
                return false;
            }

            logger.LogInformation("Successfully reset and pulled latest changes for environment {EnvironmentId}.", environmentId);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while resetting environment {EnvironmentId}.", environmentId);
            throw;
        }
    }

}
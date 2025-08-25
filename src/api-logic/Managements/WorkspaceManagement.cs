using Microsoft.Extensions.Logging;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Managements;

internal sealed class WorkspaceManagement(
    ILogger<WorkspaceManagement> logger,
    IWorkspaceRepository workspaceRepository,
    IWorkspaceEnvironmentVariableRepository workspaceEnvironmentVariableRepository,
    IGitService gitService,
    IStorageService storageService,
    IFileSystemService fileSystemService) 
    : IWorkspaceManagement, IScopedService<IWorkspaceManagement>
{
    public async Task<int> EnsureCreatedAsync(CreateWorkspaceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Creating workspace {WorkspaceName}.", request.Name);
            
            // Check workspace limit (max 1 workspace allowed)
            var existingWorkspaces = await workspaceRepository.GetAllAsync(cancellationToken);
            if (existingWorkspaces.Length >= 1)
            {
                throw new InvalidOperationException("Maximum of 1 workspace allowed. Please delete the existing workspace first.");
            }
            
            var workspaceId = 0;
            var now = DateTime.UtcNow;
            
            var workspace = new WorkspaceEntity(
                workspaceId,
                request.Name,
                request.GitRepository,
                [],
                now,
                now);

            var id = await workspaceRepository.CreateAsync(workspace, cancellationToken);
            
            // Initialize workspace storage and clone repository
            await InitializeAsync(id, cancellationToken);
            
            logger.LogInformation("Successfully created workspace {WorkspaceName} with ID {WorkspaceId}.", request.Name, id);
            return id;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while creating workspace {WorkspaceName}.", request.Name);
            throw;
        }
    }

    public async Task<bool> DeleteAsync(int workspaceId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deleting workspace {WorkspaceId}.", workspaceId);
            
            // Delete workspace storage
            var workspacePath = storageService.GetWorkspacePath(workspaceId);
            await fileSystemService.DeleteDirectoryAsync(workspacePath, cancellationToken);
            
            // Delete workspace from database
            var result = await workspaceRepository.DeleteAsync(workspaceId, cancellationToken);
            
            if (result)
            {
                logger.LogInformation("Successfully deleted workspace {WorkspaceId}.", workspaceId);
            }
            else
            {
                logger.LogWarning("Workspace {WorkspaceId} not found for deletion.", workspaceId);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<WorkspaceEntity?> GetAsync(int workspaceId, CancellationToken cancellationToken)
    {
        try
        {
            return await workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<WorkspaceEntity[]> ListAsync(CancellationToken cancellationToken)
    {
        try
        {
            return await workspaceRepository.GetAllAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while listing workspaces.");
            throw;
        }
    }

    public async Task<bool> UpdateAsync(int workspaceId, UpdateWorkspaceRequest request, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Updating workspace {WorkspaceId}.", workspaceId);
            
            var workspace = await workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
            if (workspace is null)
            {
                logger.LogWarning("Workspace {WorkspaceId} not found for update.", workspaceId);
                return false;
            }

            var updatedWorkspace = new WorkspaceEntity(
                workspace.Id,
                request.Name ?? workspace.Name,
                workspace.GitRepository,
                workspace.EnvironmentVariables,
                workspace.CreatedAt,
                DateTime.UtcNow);

            var result = await workspaceRepository.UpdateAsync(updatedWorkspace, cancellationToken);
            
            if (result)
            {
                logger.LogInformation("Successfully updated workspace {WorkspaceId}.", workspaceId);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<bool> InitializeAsync(int workspaceId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Initializing workspace {WorkspaceId}.", workspaceId);
            
            var workspace = await workspaceRepository.GetByIdAsync(workspaceId, cancellationToken);
            if (workspace is null)
            {
                logger.LogError("Workspace {WorkspaceId} not found for initialization.", workspaceId);
                return false;
            }

            // Create workspace directory structure
            var workspacePath = storageService.GetWorkspacePath(workspaceId);
            await fileSystemService.CreateDirectoryAsync(workspacePath, cancellationToken);
            
            var gitPath = storageService.GetGitPath(workspaceId);
            
            await fileSystemService.CreateDirectoryAsync(gitPath, cancellationToken);
            
            // Clone repository
            var cloneResult = await gitService.CloneRepositoryAsync(
                workspace.GitRepository, 
                gitPath, 
                cancellationToken);
            
            if (!cloneResult)
            {
                logger.LogError("Failed to clone repository {GitRepository} for workspace {WorkspaceId}.", workspace.GitRepository, workspaceId);
                return false;
            }
            
            logger.LogInformation("Successfully initialized workspace {WorkspaceId}.", workspaceId);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while initializing workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<Dictionary<string, string>?> GetEnvironmentVariablesAsync(int workspaceId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogDebug("Getting environment variables for workspace {WorkspaceId}.", workspaceId);
            return await workspaceEnvironmentVariableRepository.GetByWorkspaceIdAsync(workspaceId, cancellationToken);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while getting environment variables for workspace {WorkspaceId}.", workspaceId);
            throw;
        }
    }

    public async Task<bool> SetEnvironmentVariableAsync(int workspaceId, string key, string value, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Setting environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            var result = await workspaceEnvironmentVariableRepository.SetAsync(workspaceId, key, value, cancellationToken);
            
            if (result)
            {
                logger.LogInformation("Successfully set environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            }
            else
            {
                logger.LogWarning("Failed to set environment variable {Key} for workspace {WorkspaceId}. Variable may already exist or workspace not found.", key, workspaceId);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while setting environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            throw;
        }
    }

    public async Task<bool> UpdateEnvironmentVariableAsync(int workspaceId, string key, string value, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Updating environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            var result = await workspaceEnvironmentVariableRepository.UpdateAsync(workspaceId, key, value, cancellationToken);
            
            if (result)
            {
                logger.LogInformation("Successfully updated environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            }
            else
            {
                logger.LogWarning("Environment variable {Key} not found for workspace {WorkspaceId}.", key, workspaceId);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while updating environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            throw;
        }
    }

    public async Task<bool> DeleteEnvironmentVariableAsync(int workspaceId, string key, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Deleting environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            var result = await workspaceEnvironmentVariableRepository.DeleteAsync(workspaceId, key, cancellationToken);
            
            if (result)
            {
                logger.LogInformation("Successfully deleted environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            }
            else
            {
                logger.LogWarning("Environment variable {Key} not found for workspace {WorkspaceId}.", key, workspaceId);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while deleting environment variable {Key} for workspace {WorkspaceId}.", key, workspaceId);
            throw;
        }
    }
}
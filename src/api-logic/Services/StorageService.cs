using Microsoft.Extensions.Logging;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Services;

public sealed class StorageService(
    ILogger<StorageService> logger)
    : IStorageService, ISingletonService<IStorageService>
{
    public static readonly string StoragePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "Polygent");

    public bool InitializeStorage()
    {
        try
        {
            logger.LogInformation("Initializing storage at {StoragePath}.", StoragePath);

            if (!Directory.Exists(StoragePath))
            {
                Directory.CreateDirectory(StoragePath);
            }

            var workspacesPath = Path.Combine(StoragePath, "workspaces");
            if (!Directory.Exists(workspacesPath))
            {
                Directory.CreateDirectory(workspacesPath);
            }

            logger.LogInformation("Successfully initialized storage at {StoragePath}.", StoragePath);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while initializing storage at {StoragePath}.", StoragePath);
            return false;
        }
    }

    public string GetStoragePath()
    {
        return StoragePath;
    }

    public string GetWorkspacePath(int workspaceId)
    {
        return Path.Combine(StoragePath, "workspaces", workspaceId.ToString());
    }

    public string GetGitPath(int workspaceId)
    {
        return Path.Combine(GetWorkspacePath(workspaceId), "git");
    }

    public string GetSessionPath(int workspaceId, int sessionId)
    {
        return Path.Combine(GetWorkspacePath(workspaceId), "sessions", sessionId.ToString());
    }

    public string EnsureSessionPath(int workspaceId, int sessionId)
    {
        try
        {
            var sessionPath = GetSessionPath(workspaceId, sessionId);
            
            // Ensure all parent directories exist
            if (!Directory.Exists(sessionPath))
            {
                logger.LogInformation("Creating session directory at {SessionPath}.", sessionPath);
                Directory.CreateDirectory(sessionPath);
            }
            
            // Normalize path for cross-platform compatibility
            return Path.GetFullPath(sessionPath);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while ensuring session path for workspace {WorkspaceId}, session {SessionId}.", workspaceId, sessionId);
            throw new InvalidOperationException($"Failed to create session directory for workspace {workspaceId}, session {sessionId}: {ex.Message}", ex);
        }
    }

    public string GetEnvironmentPath(int workspaceId, string environmentAlias)
    {
        return Path.Combine(GetWorkspacePath(workspaceId), "environments", environmentAlias);
    }

    public string GetFilesPath(int workspaceId)
    {
        return Path.Combine(GetWorkspacePath(workspaceId), "files");
    }

    public string EnsureFilesPath(int workspaceId)
    {
        try
        {
            var filesPath = GetFilesPath(workspaceId);
            
            // Ensure the files directory exists
            if (!Directory.Exists(filesPath))
            {
                logger.LogInformation("Creating files directory at {FilesPath}.", filesPath);
                Directory.CreateDirectory(filesPath);
            }
            
            // Normalize path for cross-platform compatibility
            return Path.GetFullPath(filesPath);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while ensuring files path for workspace {WorkspaceId}.", workspaceId);
            throw new InvalidOperationException($"Failed to create files directory for workspace {workspaceId}: {ex.Message}", ex);
        }
    }

    public StorageUsage GetStorageUsage()
    {
        try
        {
            logger.LogInformation("Calculating storage usage for {StoragePath}.", StoragePath);
            return CalculateDirectoryUsage(StoragePath);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while calculating storage usage for {StoragePath}.", StoragePath);
            return new StorageUsage(0, 0, 0);
        }
    }

    public StorageUsage GetWorkspaceStorageUsage(int workspaceId)
    {
        try
        {
            var workspacePath = GetWorkspacePath(workspaceId);
            logger.LogInformation("Calculating storage usage for workspace {WorkspaceId} at {WorkspacePath}.", workspaceId, workspacePath);
            return CalculateDirectoryUsage(workspacePath);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while calculating storage usage for workspace {WorkspaceId}.", workspaceId);
            return new StorageUsage(0, 0, 0);
        }
    }

    public StorageUsage GetSessionStorageUsage(int workspaceId, int sessionId)
    {
        try
        {
            var sessionPath = GetSessionPath(workspaceId, sessionId);
            logger.LogInformation("Calculating storage usage for session {SessionId} at {SessionPath}.", sessionId, sessionPath);
            return CalculateDirectoryUsage(sessionPath);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while calculating storage usage for session {SessionId}.", sessionId);
            return new StorageUsage(0, 0, 0);
        }
    }

    public StorageUsage GetEnvironmentStorageUsage(int workspaceId, string environmentAlias)
    {
        try
        {
            var environmentPath = GetEnvironmentPath(workspaceId, environmentAlias);
            logger.LogInformation("Calculating storage usage for environment {EnvironmentAlias} at {EnvironmentPath}.", environmentAlias, environmentPath);
            return CalculateDirectoryUsage(environmentPath);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while calculating storage usage for environment {EnvironmentAlias}.", environmentAlias);
            return new StorageUsage(0, 0, 0);
        }
    }

    private static StorageUsage CalculateDirectoryUsage(string directoryPath)
    {
        if (!Directory.Exists(directoryPath))
        {
            return new StorageUsage(0, 0, 0);
        }

        var directoryInfo = new DirectoryInfo(directoryPath);
        long totalSize = 0;
        int fileCount = 0;
        int directoryCount = 0;

        var files = directoryInfo.GetFiles("*", SearchOption.AllDirectories);
        fileCount = files.Length;
        totalSize = files.Sum(static file => file.Length);

        var directories = directoryInfo.GetDirectories("*", SearchOption.AllDirectories);
        directoryCount = directories.Length;

        return new StorageUsage(totalSize, fileCount, directoryCount);
    }
}
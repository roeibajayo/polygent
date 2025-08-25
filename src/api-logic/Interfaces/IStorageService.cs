namespace Polygent.Logic.Interfaces;

public interface IStorageService
{
    bool InitializeStorage();
    string GetStoragePath();
    string GetWorkspacePath(int workspaceId);
    string GetSessionPath(int workspaceId, int sessionId);
    string EnsureSessionPath(int workspaceId, int sessionId);
    string GetGitPath(int workspaceId);
    string GetEnvironmentPath(int workspaceId, string environmentAlias);
    string GetFilesPath(int workspaceId);
    string EnsureFilesPath(int workspaceId);
    StorageUsage GetStorageUsage();
    StorageUsage GetWorkspaceStorageUsage(int workspaceId);
    StorageUsage GetSessionStorageUsage(int workspaceId, int sessionId);
    StorageUsage GetEnvironmentStorageUsage(int workspaceId, string environmentAlias);
}

public sealed record StorageUsage(
    long SizeInBytes,
    int FileCount,
    int DirectoryCount
);
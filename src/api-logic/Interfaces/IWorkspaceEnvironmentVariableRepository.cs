namespace Polygent.Logic.Interfaces;

public interface IWorkspaceEnvironmentVariableRepository
{
    Task<Dictionary<string, string>?> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken);
    Task<bool> SetAsync(int workspaceId, string key, string value, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int workspaceId, string key, string value, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int workspaceId, string key, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int workspaceId, string key, CancellationToken cancellationToken);
}
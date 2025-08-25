namespace Polygent.Logic.Interfaces;

public interface IWorkspaceManagement
{
    Task<int> EnsureCreatedAsync(CreateWorkspaceRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int workspaceId, CancellationToken cancellationToken);
    Task<WorkspaceEntity?> GetAsync(int workspaceId, CancellationToken cancellationToken);
    Task<WorkspaceEntity[]> ListAsync(CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int workspaceId, UpdateWorkspaceRequest request, CancellationToken cancellationToken);
    Task<bool> InitializeAsync(int workspaceId, CancellationToken cancellationToken);
    
    // Workspace Environment Variables
    Task<Dictionary<string, string>?> GetEnvironmentVariablesAsync(int workspaceId, CancellationToken cancellationToken);
    Task<bool> SetEnvironmentVariableAsync(int workspaceId, string key, string value, CancellationToken cancellationToken);
    Task<bool> UpdateEnvironmentVariableAsync(int workspaceId, string key, string value, CancellationToken cancellationToken);
    Task<bool> DeleteEnvironmentVariableAsync(int workspaceId, string key, CancellationToken cancellationToken);
}

public sealed record CreateWorkspaceRequest(
    string Name,
    string GitRepository
);

public sealed record UpdateWorkspaceRequest(
    string? Name
);
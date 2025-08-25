namespace Polygent.Logic.Interfaces;

public interface IEnvironmentManagement
{
    Task<int> CreateAsync(CreateEnvironmentRequest request, CancellationToken cancellationToken);
    Task<EnvironmentEntity?> GetAsync(int environmentId, CancellationToken cancellationToken);
    Task<EnvironmentEntity[]> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(int environmentId, UpdateEnvironmentRequest request, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int environmentId, CancellationToken cancellationToken);
    Task<bool> DeployFromSessionAsync(int environmentId, int sessionId, bool restartAfterSync, CancellationToken cancellationToken);
    
    // Environment Variables Management
    Task<Dictionary<string, string>?> GetEnvironmentVariablesAsync(int environmentId, CancellationToken cancellationToken);
    Task<bool> SetEnvironmentVariableAsync(int environmentId, string key, string value, CancellationToken cancellationToken);
    Task<bool> UpdateEnvironmentVariableAsync(int environmentId, string key, string value, CancellationToken cancellationToken);
    Task<bool> DeleteEnvironmentVariableAsync(int environmentId, string key, CancellationToken cancellationToken);
    
    // Git Management
    Task<bool> ResetEnvironmentAsync(int environmentId, CancellationToken cancellationToken);
}

public sealed record CreateEnvironmentRequest(
    int WorkspaceId,
    string Name,
    string GitBranch,
    string? Url,
    Dictionary<string, string> EnvironmentVariables
);

public sealed record UpdateEnvironmentRequest(
    string? Name,
    string? Url,
    Dictionary<string, string>? EnvironmentVariables
);
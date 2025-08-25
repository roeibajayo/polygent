namespace Polygent.Logic.Interfaces;

public interface IEnvironmentRepository
{
    Task<int> CreateAsync(EnvironmentEntity environment, CancellationToken cancellationToken);
    Task<EnvironmentEntity?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<EnvironmentEntity?> GetByAliasAsync(int workspaceId, string alias, CancellationToken cancellationToken);
    Task<EnvironmentEntity[]> GetByWorkspaceIdAsync(int workspaceId, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(EnvironmentEntity environment, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public sealed record EnvironmentEntity(
    int Id,
    int WorkspaceId,
    string Name,
    string GitBranch,
    string? Url,
    Dictionary<string, string> EnvironmentVariables,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
namespace Polygent.Logic.Interfaces;

public interface IWorkspaceRepository
{
    Task<int> CreateAsync(WorkspaceEntity workspace, CancellationToken cancellationToken);
    Task<WorkspaceEntity?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<WorkspaceEntity[]> GetAllAsync(CancellationToken cancellationToken);
    Task<bool> UpdateAsync(WorkspaceEntity workspace, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<bool> ExistsAsync(int id, CancellationToken cancellationToken);
}

public sealed record WorkspaceEntity(
    int Id,
    string Name,
    string GitRepository,
    Dictionary<string, string> EnvironmentVariables,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
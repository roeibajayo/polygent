namespace Polygent.Logic.Interfaces;

public interface IAgentRepository
{
    Task<int> CreateAsync(AgentEntity agent, CancellationToken cancellationToken);
    Task<AgentEntity?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<AgentEntity[]> GetAllAsync(CancellationToken cancellationToken);
    Task<bool> UpdateAsync(AgentEntity agent, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
    Task<AgentEntity[]> GetByRoleAsync(string roleName, CancellationToken cancellationToken);
}

public sealed record AgentEntity(
    int Id,
    string Name,
    string RoleName,
    string Model,
    string SystemPrompt,
    int[] MCPIds,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
using Polygent.Logic.Models;

namespace Polygent.Logic.Interfaces;

public interface IMCPRepository
{
    Task<int> CreateAsync(MCPEntity mcp, CancellationToken cancellationToken);
    Task<MCPEntity?> GetByIdAsync(int id, CancellationToken cancellationToken);
    Task<MCPEntity[]> GetAllAsync(CancellationToken cancellationToken);
    Task<MCPEntity[]> GetByTypeAsync(MCPType type, CancellationToken cancellationToken);
    Task<bool> UpdateAsync(MCPEntity mcp, CancellationToken cancellationToken);
    Task<bool> DeleteAsync(int id, CancellationToken cancellationToken);
}

public sealed record MCPEntity(
    int Id,
    string Name,
    string? Description,
    MCPType Type,
    string Path,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
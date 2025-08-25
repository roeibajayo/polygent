using Polygent.Logic.Models;

namespace Polygent.Dtos;

public sealed record MCPDto(
    int Id,
    string Name,
    string? Description,
    MCPType Type,
    string Path,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
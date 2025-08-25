namespace Polygent.Dtos;

public sealed record EnvironmentDto(
    int Id,
    int WorkspaceId,
    string Name,
    string GitBranch,
    string? Url,
    Dictionary<string, string> EnvironmentVariables,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
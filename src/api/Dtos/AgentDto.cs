namespace Polygent.Api.Dtos;

public sealed record AgentDto(
    int Id,
    string Name,
    string RoleName,
    string Model,
    string SystemPrompt,
    int[] MCPIds,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
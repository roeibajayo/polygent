using Polygent.Logic.Interfaces;

namespace Polygent.Api.Dtos;

public sealed record SessionDto(
    int Id,
    int WorkspaceId,
    SessionStatus Status,
    string StarterGitBranch,
    int AgentId,
    bool HasUnreadMessage,
    string? Name,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
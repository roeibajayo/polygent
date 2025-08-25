using Polygent.Logic.Interfaces;

namespace Polygent.Dtos;

public sealed record BacklogDto(
    int Id,
    string Title,
    string Description,
    BacklogStatus Status,
    string[] Tags,
    int? WorkspaceId,
    int? SessionId,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
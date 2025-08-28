namespace Polygent.Api.Dtos;

public sealed record TaskStatusDto(
    int TaskId,
    string Name,
    Logic.Interfaces.TaskStatus Status,
    string? Output,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
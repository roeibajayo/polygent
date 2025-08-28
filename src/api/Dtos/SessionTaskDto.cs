namespace Polygent.Api.Dtos;

public sealed record SessionTaskDto(
    int Id,
    string Name,
    Logic.Interfaces.TaskType? Type,
    Logic.Interfaces.TaskStatus Status,
    Guid? TaskExecutionId
);
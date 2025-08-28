namespace Polygent.Api.Dtos;

public sealed record EnvironmentTaskDto(
    int Id,
    string Name,
    Logic.Interfaces.TaskType? Type,
    Logic.Interfaces.TaskStatus Status,
    Guid? TaskExecutionId
);
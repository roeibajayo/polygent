namespace Polygent.Api.Dtos;

public sealed record GetTaskOutputResponseDto(
    Guid TaskExecutionId,
    string Output,
    Logic.Interfaces.TaskStatus Status
);
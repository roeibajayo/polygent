namespace Polygent.Api.Dtos;

public sealed record GetEnvironmentTaskOutputResponseDto(
    Guid TaskExecutionId,
    string Output,
    Logic.Interfaces.TaskStatus Status
);
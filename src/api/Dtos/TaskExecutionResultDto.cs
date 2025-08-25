namespace Polygent.Dtos;

public sealed record TaskExecutionResultDto(
    bool Success,
    string? Output,
    string? Error,
    int ExitCode,
    DateTime StartedAt,
    DateTime CompletedAt
);
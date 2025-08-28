using Polygent.Logic.Interfaces;

namespace Polygent.Api.Dtos;

public sealed record TaskDto(
    int Id,
    int WorkspaceId,
    string Name,
    TaskType? Type,
    string? WorkingDirectory,
    ScriptType ScriptType,
    string ScriptContent,
    DateTime CreatedAt,
    DateTime UpdatedAt);
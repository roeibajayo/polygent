namespace Polygent.Dtos;

public sealed record EditorDto(
    string Id,
    string Name,
    string DisplayName,
    string ExecutablePath,
    bool IsAvailable
);
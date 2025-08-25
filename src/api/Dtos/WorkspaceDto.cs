using System.ComponentModel.DataAnnotations;

namespace Polygent.Dtos;

public sealed record WorkspaceDto(
    int Id,
    string Name,
    string GitRepository,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
using System.ComponentModel.DataAnnotations;

namespace Polygent.Dtos;

public sealed record UpdateWorkspaceDto(
    [MaxLength(255)]
    string? Name,
    
    [MaxLength(500)]
    string? GitRepository
);
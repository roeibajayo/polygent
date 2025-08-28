using System.ComponentModel.DataAnnotations;

namespace Polygent.Api.Dtos;

public sealed record CreateWorkspaceDto(
    [Required]
    [MaxLength(255)]
    string Name,
    
    [Required]
    [MaxLength(500)]
    string GitRepository
);
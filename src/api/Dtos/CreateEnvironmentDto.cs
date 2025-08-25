using System.ComponentModel.DataAnnotations;

namespace Polygent.Dtos;

public sealed record CreateEnvironmentDto(
    [Required]
    [MaxLength(255)]
    string Name,
    
    [Required]
    [MaxLength(255)]
    string GitBranch,
    
    [MaxLength(500)]
    string? Url,
    
    Dictionary<string, string> EnvironmentVariables
);
using System.ComponentModel.DataAnnotations;

namespace Polygent.Dtos;

public sealed record CreateEnvironmentVariableDto(
    [Required]
    [MaxLength(255)]
    string Key,
    
    [Required]
    string Value
);
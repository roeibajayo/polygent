using System.ComponentModel.DataAnnotations;

namespace Polygent.Dtos;

public sealed record UpdateEnvironmentDto(
    [MaxLength(255)]
    string? Name,
    
    [MaxLength(500)]
    string? Url,
    
    Dictionary<string, string>? EnvironmentVariables
);
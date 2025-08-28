using System.ComponentModel.DataAnnotations;

namespace Polygent.Api.Dtos;

public sealed record CreateAgentDto(
    [Required]
    [MaxLength(255)]
    string Name,
    
    [Required]
    [MaxLength(255)]
    string RoleName,
    
    [Required]
    [MaxLength(255)]
    string Model,
    
    [Required]
    string SystemPrompt,
    
    int[] MCPIds
);
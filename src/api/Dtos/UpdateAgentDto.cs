using System.ComponentModel.DataAnnotations;

namespace Polygent.Api.Dtos;

public sealed record UpdateAgentDto(
    [MaxLength(255)]
    string? Name,
    
    [MaxLength(255)]
    string? RoleName,
    
    [MaxLength(255)]
    string? Model,
    
    string? SystemPrompt,
    
    int[]? MCPIds
);
using System.ComponentModel.DataAnnotations;

namespace Polygent.Api.Dtos;

public sealed record CreateSessionDto(
    [Required]
    int WorkspaceId,
    
    [Required]
    [MaxLength(255)]
    string StarterGitBranch,
    
    [Required]
    int AgentId,
    
    [MaxLength(100)]
    string? Name = null
);
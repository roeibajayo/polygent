using System.ComponentModel.DataAnnotations;
using Polygent.Logic.Models;

namespace Polygent.Api.Dtos;

public sealed record CreateMCPDto(
    [Required]
    [MaxLength(255)]
    string Name,
    
    string? Description,
    
    [Required]
    MCPType Type,
    
    [Required]
    [MaxLength(500)]
    string Path
);
using System.ComponentModel.DataAnnotations;
using Polygent.Logic.Models;

namespace Polygent.Api.Dtos;

public sealed record UpdateMCPDto(
    [MaxLength(255)]
    string? Name,
    
    string? Description,
    
    MCPType? Type,
    
    [MaxLength(500)]
    string? Path
);
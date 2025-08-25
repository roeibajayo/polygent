using System.ComponentModel.DataAnnotations;
using Polygent.Logic.Interfaces;

namespace Polygent.Dtos;

public sealed record CreateBacklogDto(
    [Required]
    [MaxLength(255)]
    string Title,
    
    [Required]
    string Description,
    
    [Required]
    BacklogStatus Status,
    
    string[] Tags,
    
    int? WorkspaceId,
    
    int? SessionId
);
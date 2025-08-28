using System.ComponentModel.DataAnnotations;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Dtos;

public sealed record UpdateBacklogDto(
    [MaxLength(255)]
    string? Title,
    
    string? Description,
    
    BacklogStatus? Status,
    
    string[]? Tags,
    
    int? WorkspaceId,
    
    int? SessionId
);
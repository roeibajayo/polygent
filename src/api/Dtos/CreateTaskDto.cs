using System.ComponentModel.DataAnnotations;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Dtos;

public sealed record CreateTaskDto(
    [Required]
    [MaxLength(255)]
    string Name,
    
    TaskType? Type,
    
    [MaxLength(500)]
    string? WorkingDirectory,
    
    [Required]
    ScriptType ScriptType,
    
    [Required]
    string ScriptContent
);
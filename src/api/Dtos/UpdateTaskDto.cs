using System.ComponentModel.DataAnnotations;
using Polygent.Logic.Interfaces;

namespace Polygent.Dtos;

public sealed record UpdateTaskDto(
    [MaxLength(255)]
    string Name,
    
    TaskType? Type,
    
    [MaxLength(500)]
    string? WorkingDirectory,
    
    ScriptType ScriptType,
    
    string ScriptContent
);
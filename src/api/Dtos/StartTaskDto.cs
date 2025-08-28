using System.ComponentModel.DataAnnotations;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Dtos;

public sealed record StartTaskDto(
    [Required]
    [MaxLength(255)]
    string Name,
    
    TaskType? Type,
    
    string WorkingDirectory,
    
    [Required]
    ScriptType ScriptType,
    
    [Required]
    string ScriptContent
);
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Polygent.Logic.Interfaces;

namespace Polygent.Logic.Models;

public sealed class TaskModel
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int WorkspaceId { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    public TaskType? Type { get; set; }

    public string? WorkingDirectory { get; set; }
    
    [Required]
    public ScriptType ScriptType { get; set; }
    
    [Required]
    public string ScriptContent { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    [ForeignKey(nameof(WorkspaceId))]
    public WorkspaceModel Workspace { get; set; } = null!;
}
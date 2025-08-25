using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace Polygent.Logic.Models;

public sealed class WorkspaceEnvironmentVariableModel
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int WorkspaceId { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Key { get; set; } = string.Empty;
    
    [Required]
    public string Value { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    [ForeignKey(nameof(WorkspaceId))]
    public WorkspaceModel Workspace { get; set; } = null!;
}
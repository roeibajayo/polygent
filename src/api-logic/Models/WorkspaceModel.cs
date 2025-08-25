using System.ComponentModel.DataAnnotations;

namespace Polygent.Logic.Models;

public sealed class WorkspaceModel
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(500)]
    public string GitRepository { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public ICollection<SessionModel> Sessions { get; set; } = [];
    public ICollection<EnvironmentModel> Environments { get; set; } = [];
    public ICollection<TaskModel> Tasks { get; set; } = [];
    public ICollection<BacklogModel> Backlogs { get; set; } = [];
    public ICollection<WorkspaceEnvironmentVariableModel> EnvironmentVariables { get; set; } = [];
}
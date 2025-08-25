using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;

namespace Polygent.Logic.Models;

public sealed class EnvironmentModel
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int WorkspaceId { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string GitBranch { get; set; } = string.Empty;
    
    [MaxLength(500)]
    public string? Url { get; set; }
    
    [Required]
    public string EnvironmentVariablesJson { get; set; } = "{}";
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    [ForeignKey(nameof(WorkspaceId))]
    public WorkspaceModel Workspace { get; set; } = null!;
    
    [NotMapped]
    public Dictionary<string, string> EnvironmentVariables
    {
        get => JsonSerializer.Deserialize<Dictionary<string, string>>(EnvironmentVariablesJson) ?? new();
        set => EnvironmentVariablesJson = JsonSerializer.Serialize(value);
    }
}
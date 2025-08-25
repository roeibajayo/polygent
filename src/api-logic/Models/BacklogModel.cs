using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json;
using Polygent.Logic.Interfaces;

namespace Polygent.Logic.Models;

public sealed class BacklogModel
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Title { get; set; } = string.Empty;
    
    [Required]
    public string Description { get; set; } = string.Empty;
    
    [Required]
    public BacklogStatus Status { get; set; }
    
    [Required]
    public string TagsJson { get; set; } = "[]";
    
    public int? WorkspaceId { get; set; }
    public int? SessionId { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    [ForeignKey(nameof(WorkspaceId))]
    public WorkspaceModel? Workspace { get; set; }
    
    [ForeignKey(nameof(SessionId))]
    public SessionModel? Session { get; set; }
    
    public string[] Tags
    {
        get => JsonSerializer.Deserialize<string[]>(TagsJson) ?? [];
        set => TagsJson = JsonSerializer.Serialize(value);
    }
}
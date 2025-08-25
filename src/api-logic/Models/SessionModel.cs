using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Polygent.Logic.Interfaces;

namespace Polygent.Logic.Models;

public sealed class SessionModel
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int WorkspaceId { get; set; }
    
    [Required]
    public SessionStatus Status { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string StarterGitBranch { get; set; } = string.Empty;
    
    [Required]
    public int AgentId { get; set; }
    
    public string? ProviderSessionId { get; set; }
    
    public bool HasUnreadMessage { get; set; } = false;
    
    [MaxLength(100)]
    public string? Name { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    [ForeignKey(nameof(WorkspaceId))]
    public WorkspaceModel Workspace { get; set; } = null!;
    
    [ForeignKey(nameof(AgentId))]
    public AgentModel Agent { get; set; } = null!;
    
    public ICollection<MessageModel> Messages { get; set; } = [];
    public ICollection<BacklogModel> Backlogs { get; set; } = [];
}
using System.ComponentModel.DataAnnotations;
using System.Text.Json;

namespace Polygent.Logic.Models;

public sealed class AgentModel
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string RoleName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string Model { get; set; } = string.Empty;
    
    [Required]
    public string SystemPrompt { get; set; } = string.Empty;
    
    [Required]
    public string MCPIdsJson { get; set; } = "[]";
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    public ICollection<SessionModel> Sessions { get; set; } = [];
    
    public int[] MCPIds
    {
        get => JsonSerializer.Deserialize<int[]>(MCPIdsJson) ?? [];
        set => MCPIdsJson = JsonSerializer.Serialize(value);
    }
}
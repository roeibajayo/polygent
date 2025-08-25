using System.ComponentModel.DataAnnotations;

namespace Polygent.Logic.Models;

public sealed class MCPModel
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string Name { get; set; } = string.Empty;
    
    public string? Description { get; set; }
    
    [Required]
    public MCPType Type { get; set; }
    
    [Required]
    [MaxLength(500)]
    public string Path { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
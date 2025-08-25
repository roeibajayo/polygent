using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Polygent.Logic.Interfaces;

namespace Polygent.Logic.Models;

public sealed class MessageModel
{
    [Key]
    public int Id { get; set; }
    
    [Required]
    public int SessionId { get; set; }
    
    [Required]
    public MessageType Type { get; set; }
    
    [Required]
    public string Content { get; set; } = string.Empty;
    
    [Required]
    public MessageStatus Status { get; set; }
    
    public string? Metadata { get; set; }
    
    public int? ParentMessageId { get; set; }
    
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    
    [ForeignKey(nameof(SessionId))]
    public SessionModel Session { get; set; } = null!;
    
    [ForeignKey(nameof(ParentMessageId))]
    public MessageModel? ParentMessage { get; set; }
    
    public ICollection<MessageModel> Replies { get; set; } = new List<MessageModel>();
}
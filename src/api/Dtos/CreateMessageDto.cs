using System.ComponentModel.DataAnnotations;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Dtos;

public sealed record CreateMessageDto(
    [Required]
    MessageType Type,
    
    [Required]
    string Content,
    
    string? Metadata,
    
    int? ParentMessageId
);
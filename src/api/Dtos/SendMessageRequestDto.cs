using System.ComponentModel.DataAnnotations;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Dtos;

public sealed record SendMessageRequestDto(
    [Required]
    [StringLength(10000, MinimumLength = 1)]
    string Content,
    
    [Required]
    MessageType MessageType = MessageType.User,
    
    string? Metadata = null,
    
    int? ParentMessageId = null
);
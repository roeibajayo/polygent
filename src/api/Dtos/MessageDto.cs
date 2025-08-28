using Polygent.Logic.Interfaces;

namespace Polygent.Api.Dtos;

public sealed record MessageDto(
    int Id,
    int SessionId,
    MessageType Type,
    string Content,
    MessageStatus Status,
    string? Metadata,
    int? ParentMessageId,
    DateTime CreatedAt,
    DateTime UpdatedAt
);
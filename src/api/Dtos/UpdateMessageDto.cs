using Polygent.Logic.Interfaces;

namespace Polygent.Dtos;

public sealed record UpdateMessageDto(
    string? Content,
    MessageStatus? Status,
    string? Metadata
);
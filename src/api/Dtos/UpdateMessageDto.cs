using Polygent.Logic.Interfaces;

namespace Polygent.Api.Dtos;

public sealed record UpdateMessageDto(
    string? Content,
    MessageStatus? Status,
    string? Metadata
);
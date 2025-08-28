using Polygent.Logic.Interfaces;

namespace Polygent.Api.Dtos;

public sealed record UpdateSessionDto(
    SessionStatus? Status,
    string? StarterGitBranch,
    string? Name
);
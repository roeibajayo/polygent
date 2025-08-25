using Polygent.Logic.Interfaces;

namespace Polygent.Dtos;

public sealed record UpdateSessionDto(
    SessionStatus? Status,
    string? StarterGitBranch,
    string? Name
);
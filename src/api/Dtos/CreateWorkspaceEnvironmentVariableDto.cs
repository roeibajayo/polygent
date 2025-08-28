using System.ComponentModel.DataAnnotations;

namespace Polygent.Api.Dtos;

public sealed record CreateWorkspaceEnvironmentVariableDto(
    [Required, MaxLength(255)] string Key,
    [Required] string Value
);
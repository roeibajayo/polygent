using System.ComponentModel.DataAnnotations;

namespace Polygent.Dtos;

public sealed record UpdateWorkspaceEnvironmentVariableDto(
    [Required] string Value
);
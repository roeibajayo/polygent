using System.ComponentModel.DataAnnotations;

namespace Polygent.Api.Dtos;

public sealed record UpdateWorkspaceEnvironmentVariableDto(
    [Required] string Value
);
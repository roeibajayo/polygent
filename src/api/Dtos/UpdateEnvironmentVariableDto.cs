using System.ComponentModel.DataAnnotations;

namespace Polygent.Api.Dtos;

public sealed record UpdateEnvironmentVariableDto(
    [Required]
    string Value
);
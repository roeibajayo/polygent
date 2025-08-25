using System.ComponentModel.DataAnnotations;

namespace Polygent.Dtos;

public sealed record UpdateEnvironmentVariableDto(
    [Required]
    string Value
);
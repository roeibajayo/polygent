namespace Polygent.Api.Dtos;

public sealed record EnvironmentVariableDto(
    string Key,
    string Value
);
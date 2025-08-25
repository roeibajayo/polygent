using System.Text.Json.Serialization;

namespace Polygent.Logic.Agent.Models;

internal record ClaudeContentBlock
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("name")]
    public string? Name { get; set; }

    [JsonPropertyName("input")]
    public object? Input { get; set; }
}
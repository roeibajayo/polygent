using System.Text.Json.Serialization;

namespace Polygent.Logic.Agent.Models;

internal record ClaudeError
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("message")]
    public string? Message { get; set; }
}
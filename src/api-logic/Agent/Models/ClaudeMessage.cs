using System.Text.Json.Serialization;

namespace Polygent.Logic.Agent.Models;

internal record ClaudeMessage
{
    [JsonPropertyName("id")]
    public string? Id { get; set; }

    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("role")]
    public string Role { get; set; } = string.Empty;

    [JsonPropertyName("content")]
    public ClaudeContent[]? Content { get; set; }
}
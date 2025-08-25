using System.Text.Json.Serialization;

namespace Polygent.Logic.Agent.Models;

internal record ClaudeStreamEvent
{
    [JsonPropertyName("type")]
    public string Type { get; set; } = string.Empty;

    [JsonPropertyName("subtype")]
    public string? Subtype { get; set; }

    [JsonPropertyName("session_id")]
    public string? SessionId { get; set; }

    [JsonPropertyName("message")]
    public ClaudeMessage? Message { get; set; }

    [JsonPropertyName("result")]
    public string? Result { get; set; }

    [JsonPropertyName("is_error")]
    public bool? IsError { get; set; }

    // Additional streaming event properties based on Claude documentation
    [JsonPropertyName("index")]
    public int? Index { get; set; }

    [JsonPropertyName("content_block")]
    public ClaudeContentBlock? ContentBlock { get; set; }

    [JsonPropertyName("delta")]
    public ClaudeDelta? Delta { get; set; }

    [JsonPropertyName("usage")]
    public ClaudeUsage? Usage { get; set; }

    [JsonPropertyName("error")]
    public ClaudeError? Error { get; set; }
}
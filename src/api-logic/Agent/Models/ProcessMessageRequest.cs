using Polygent.Logic.Interfaces;

namespace Polygent.Logic.Agent.Models;

public class ProcessMessageRequest
{
    public string Message { get; set; } = string.Empty;
    public string WorkingDirectory { get; set; } = string.Empty;
    public string? SystemPrompt { get; set; }
    public string? Model { get; set; }
    public string? ProviderSessionId { get; set; }
    public string? McpConfigPath { get; set; }
    public Func<string, string, Task<int>>? OnToolStart { get; set; }
    public Func<int, string?, MessageStatus, Task>? OnToolUpdate { get; set; }
}

using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions.Git;

internal sealed class StageFileEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/git/stage-file";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromBody] StageFileRequest request,
        ISessionManagement sessionManagement,
        IStorageService storageService,
        IGitService gitService,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(request.FilePath))
            return Results.BadRequest("File path is required");

        var session = await sessionManagement.GetAsync(sessionId, cancellationToken);
        
        if (session is null)
            return Results.NotFound($"Session {sessionId} not found");

        var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);
        var fullFilePath = Path.Combine(sessionPath, request.FilePath.Replace('/', '\\'));
        
        // Security check: ensure the file is within the session directory
        var normalizedSessionPath = Path.GetFullPath(sessionPath);
        var normalizedFilePath = Path.GetFullPath(fullFilePath);
        
        if (!normalizedFilePath.StartsWith(normalizedSessionPath))
            return Results.BadRequest("Access denied: File path is outside session directory");

        try
        {
            // Normalize file path to use forward slashes for git
            var normalizedGitPath = request.FilePath.Replace('\\', '/');
            
            // Execute git add <file> to stage specific file
            var result = await gitService.ExecuteGitCommandAsync("add", new[] { normalizedGitPath }, sessionPath, cancellationToken);
            
            if (result.Success)
            {
                return Results.Ok(new { message = $"File '{request.FilePath}' staged successfully", filePath = request.FilePath });
            }
            else
            {
                return Results.Problem($"Failed to stage file '{request.FilePath}': {result.Error}");
            }
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error staging file '{request.FilePath}': {ex.Message}");
        }
    };
}

public sealed record StageFileRequest(
    string FilePath
);
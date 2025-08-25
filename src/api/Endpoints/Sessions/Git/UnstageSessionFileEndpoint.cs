using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Git;

internal sealed class UnstageSessionFileEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/git/unstage-file";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromBody] UnstageFileRequest request,
        ISessionRepository sessionRepository,
        IGitService gitService,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.FilePath))
                return Results.BadRequest("File path is required");

            // Get the session to verify it exists and get workspace info
            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session == null)
                return Results.NotFound("Session not found");

            // Get the session working directory path
            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);

            // Check if session directory exists
            if (!Directory.Exists(sessionPath))
                return Results.NotFound("Session directory not found");

            // Normalize file path to use forward slashes for git
            var normalizedFilePath = request.FilePath.Replace('\\', '/');
            
            // Unstage specific file by using git reset HEAD <file>
            var result = await gitService.ExecuteGitCommandAsync("reset", ["HEAD", "--", normalizedFilePath], sessionPath, cancellationToken);
            
            if (!result.Success)
                return Results.Problem($"Failed to unstage file '{normalizedFilePath}': {result.Error}");

            return Results.Ok(new { message = $"File '{request.FilePath}' unstaged successfully", filePath = request.FilePath });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to unstage file: {ex.Message}");
        }
    };
}

public record UnstageFileRequest(string FilePath);
using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Git;

internal sealed class GetSessionGitFileContentEndpoint : IGetEndpoint
{
    public string Route => "/api/sessions/{sessionId}/git/file";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromQuery] string filePath,
        [FromQuery] string? mode,
        ISessionRepository sessionRepository,
        IGitService gitService,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            if (string.IsNullOrWhiteSpace(filePath))
                return Results.BadRequest("File path is required");

            // Get the session to verify it exists and get workspace info
            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session == null)
                return Results.NotFound("Session not found");

            // Prevent Git file operations on readonly sessions (Done/Canceled)
            if (session.Status == SessionStatus.Done || session.Status == SessionStatus.Canceled)
                return Results.BadRequest("Cannot access Git files in readonly session");

            // Get the session working directory path
            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);

            // Check if session directory exists
            if (!Directory.Exists(sessionPath))
                return Results.NotFound("Session directory not found");

            // Parse file mode (default to Working for backward compatibility)
            var parsedMode = GitFileMode.Working;
            if (!string.IsNullOrWhiteSpace(mode) && 
                Enum.TryParse<GitFileMode>(mode, ignoreCase: true, out var fileMode))
            {
                parsedMode = fileMode;
            }

            // Get file content
            var content = await gitService.GetFileContentAsync(sessionPath, filePath, parsedMode, cancellationToken);
            
            if (content == null)
                return Results.NotFound($"Could not get {parsedMode.ToString().ToLower()} content for file: {filePath}");

            return Results.Ok(new { FilePath = filePath, Mode = parsedMode.ToString(), Content = content });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to get file content: {ex.Message}");
        }
    };
}
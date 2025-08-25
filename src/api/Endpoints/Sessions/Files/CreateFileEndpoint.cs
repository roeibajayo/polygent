using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Files;

internal sealed class CreateFileEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/files";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromBody] CreateFileRequest request,
        ISessionRepository sessionRepository,
        IFileSystemService fileSystemService,
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

            // Prevent file operations on readonly sessions (Done/Canceled)
            if (session.Status == SessionStatus.Done || session.Status == SessionStatus.Canceled)
                return Results.BadRequest("Cannot create files in readonly session");

            // Get the session working directory path
            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);

            // Check if session directory exists
            if (!Directory.Exists(sessionPath))
                return Results.NotFound("Session directory not found");

            // Construct the full file path
            var fullFilePath = Path.Combine(sessionPath, request.FilePath);

            // Check if file already exists
            if (File.Exists(fullFilePath))
                return Results.Conflict("File already exists");

            // Create the file with initial content (empty if not provided)
            var success = await fileSystemService.WriteFileAsync(fullFilePath, request.Content ?? string.Empty, cancellationToken);
            
            if (!success)
                return Results.Problem("Failed to create file");

            return Results.Ok(new { Message = $"File {request.FilePath} created successfully" });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to create file: {ex.Message}");
        }
    };
}

public record CreateFileRequest(string FilePath, string? Content);
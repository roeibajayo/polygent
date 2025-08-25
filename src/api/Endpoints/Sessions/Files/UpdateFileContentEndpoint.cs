using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Files;

internal sealed class UpdateFileContentEndpoint : IPutEndpoint
{
    public string Route => "/api/sessions/{sessionId}/files/content";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromBody] UpdateFileContentRequest request,
        ISessionRepository sessionRepository,
        IFileSystemService fileSystemService,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.FilePath))
                return Results.BadRequest("File path is required");

            if (request.Content == null)
                return Results.BadRequest("File content is required");

            // Get the session to verify it exists and get workspace info
            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session == null)
                return Results.NotFound("Session not found");

            // Prevent file operations on readonly sessions (Done/Canceled)
            if (session.Status == SessionStatus.Done || session.Status == SessionStatus.Canceled)
                return Results.BadRequest("Cannot modify files in readonly session");

            // Get the session working directory path
            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);

            // Check if session directory exists
            if (!Directory.Exists(sessionPath))
                return Results.NotFound("Session directory not found");

            // Construct the full file path
            var fullFilePath = Path.Combine(sessionPath, request.FilePath);

            // Check if file exists
            if (!File.Exists(fullFilePath))
                return Results.NotFound("File not found");

            // Check for conflicts if lastModified is provided
            if (request.LastModified.HasValue)
            {
                var fileInfo = new FileInfo(fullFilePath);
                var currentLastModified = fileInfo.LastWriteTimeUtc;
                
                // Allow for small time differences (1 second) due to potential clock skew
                if (Math.Abs((currentLastModified - request.LastModified.Value).TotalSeconds) > 1)
                {
                    return Results.Conflict(new { 
                        Message = "File has been modified by another process", 
                        CurrentLastModified = currentLastModified,
                        ExpectedLastModified = request.LastModified.Value
                    });
                }
            }

            // Update the file content
            var success = await fileSystemService.WriteFileAsync(fullFilePath, request.Content, cancellationToken);
            
            if (!success)
                return Results.Problem("Failed to update file content");

            // Get the new last modified time after writing
            var updatedFileInfo = new FileInfo(fullFilePath);
            var newLastModified = updatedFileInfo.LastWriteTimeUtc;

            return Results.Ok(new { 
                Message = $"File {request.FilePath} updated successfully",
                LastModified = newLastModified
            });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to update file content: {ex.Message}");
        }
    };
}

public record UpdateFileContentRequest(string FilePath, string Content, DateTime? LastModified = null);
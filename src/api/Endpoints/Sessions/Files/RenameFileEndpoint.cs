using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions.Files;

internal sealed class RenameFileEndpoint : IPutEndpoint
{
    public string Route => "/api/sessions/{sessionId}/files/rename";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromBody] RenameFileRequest request,
        ISessionManagement sessionManagement,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(request.OldPath))
            return Results.BadRequest("Old file path is required");
        
        if (string.IsNullOrWhiteSpace(request.NewName))
            return Results.BadRequest("New file name is required");

        // Validate new name doesn't contain invalid characters
        var invalidChars = Path.GetInvalidFileNameChars();
        if (request.NewName.IndexOfAny(invalidChars) >= 0)
            return Results.BadRequest("New file name contains invalid characters");

        var session = await sessionManagement.GetAsync(sessionId, cancellationToken);
        
        if (session is null)
            return Results.NotFound($"Session {sessionId} not found");

        // Prevent file operations on readonly sessions (Done/Canceled)
        if (session.Status == SessionStatus.Done || session.Status == SessionStatus.Canceled)
            return Results.BadRequest("Cannot rename files in readonly session");

        var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);
        var oldFullPath = Path.Combine(sessionPath, request.OldPath.Replace('/', '\\'));
        
        // Security check: ensure the file is within the session directory
        var normalizedSessionPath = Path.GetFullPath(sessionPath);
        var normalizedOldPath = Path.GetFullPath(oldFullPath);
        
        if (!normalizedOldPath.StartsWith(normalizedSessionPath))
            return Results.BadRequest("Access denied: File path is outside session directory");

        if (!File.Exists(normalizedOldPath) && !Directory.Exists(normalizedOldPath))
            return Results.NotFound($"File or directory not found: {request.OldPath}");

        try
        {
            var directory = Path.GetDirectoryName(normalizedOldPath)!;
            var newFullPath = Path.Combine(directory, request.NewName);
            
            // Check if target already exists
            if (File.Exists(newFullPath) || Directory.Exists(newFullPath))
                return Results.Conflict($"A file or directory with the name '{request.NewName}' already exists");

            // Perform rename
            if (File.Exists(normalizedOldPath))
            {
                File.Move(normalizedOldPath, newFullPath);
            }
            else
            {
                Directory.Move(normalizedOldPath, newFullPath);
            }

            var newRelativePath = Path.GetRelativePath(sessionPath, newFullPath).Replace('\\', '/');
            
            return Results.Ok(new { 
                message = "File renamed successfully", 
                oldPath = request.OldPath,
                newPath = newRelativePath,
                newName = request.NewName
            });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error renaming file: {ex.Message}");
        }
    };
}

public sealed record RenameFileRequest(
    string OldPath,
    string NewName
);
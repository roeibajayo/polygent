using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Files;

internal sealed class DeleteFileEndpoint : IDeleteEndpoint
{
    public string Route => "/api/sessions/{sessionId}/files";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromQuery] string filePath,
        ISessionManagement sessionManagement,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(filePath))
            return Results.BadRequest("File path is required");

        var session = await sessionManagement.GetAsync(sessionId, cancellationToken);
        
        if (session is null)
            return Results.NotFound($"Session {sessionId} not found");

        // Prevent file operations on readonly sessions (Done/Canceled)
        if (session.Status == SessionStatus.Done || session.Status == SessionStatus.Canceled)
            return Results.BadRequest("Cannot delete files in readonly session");

        var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);
        var fullFilePath = Path.Combine(sessionPath, filePath.Replace('/', '\\'));
        
        // Security check: ensure the file is within the session directory
        var normalizedSessionPath = Path.GetFullPath(sessionPath);
        var normalizedFilePath = Path.GetFullPath(fullFilePath);
        
        if (!normalizedFilePath.StartsWith(normalizedSessionPath))
            return Results.BadRequest("Access denied: File path is outside session directory");

        if (!File.Exists(normalizedFilePath) && !Directory.Exists(normalizedFilePath))
            return Results.NotFound($"File or directory not found: {filePath}");

        try
        {
            if (File.Exists(normalizedFilePath))
            {
                File.Delete(normalizedFilePath);
            }
            else if (Directory.Exists(normalizedFilePath))
            {
                Directory.Delete(normalizedFilePath, recursive: true);
            }
            
            return Results.Ok(new { 
                message = "File deleted successfully", 
                filePath
            });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error deleting file: {ex.Message}");
        }
    };
}
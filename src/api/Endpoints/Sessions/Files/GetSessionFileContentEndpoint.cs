using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Files;

internal sealed class GetSessionFileContentEndpoint : IGetEndpoint
{
    public string Route => "/api/sessions/{sessionId}/files/content";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromQuery] string filePath,
        ISessionManagement sessionManagement,
        IFileSystemService fileSystemService,
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
            return Results.BadRequest("Cannot access files in readonly session");
        
        var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);
        var fullFilePath = Path.Combine(sessionPath, filePath.Replace('/', '\\'));
        
        // Ensure the file is within the session directory for security
        var normalizedSessionPath = Path.GetFullPath(sessionPath);
        var normalizedFilePath = Path.GetFullPath(fullFilePath);
        
        if (!normalizedFilePath.StartsWith(normalizedSessionPath))
            return Results.BadRequest("Access denied: File path is outside session directory");
        
        if (!await fileSystemService.FileExistsAsync(normalizedFilePath, cancellationToken))
            return Results.NotFound($"File not found: {filePath}");
        
        var content = await fileSystemService.ReadFileAsync(normalizedFilePath, cancellationToken);
        
        if (content is null)
            return Results.Problem("Unable to read file content");
        
        var fileInfo = new FileInfo(normalizedFilePath);
        var lastModified = fileInfo.LastWriteTimeUtc;
        
        return Results.Ok(new { content, filePath, lastModified });
    };
}
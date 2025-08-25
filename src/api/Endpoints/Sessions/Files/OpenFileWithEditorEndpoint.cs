using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Helpers;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Files;

internal sealed class OpenFileWithEditorEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/files/open";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromBody] OpenFileRequest request,
        ISessionManagement sessionManagement,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(request.FilePath))
            return Results.BadRequest("Path is required");
        
        if (string.IsNullOrWhiteSpace(request.EditorId))
            return Results.BadRequest("Editor ID is required");

        var session = await sessionManagement.GetAsync(sessionId, cancellationToken);
        
        if (session is null)
            return Results.NotFound($"Session {sessionId} not found");

        var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);
        var fullFilePath = Path.Combine(sessionPath, request.FilePath.Replace('/', '\\'));
        
        // Security check: ensure the file is within the session directory
        var normalizedSessionPath = Path.GetFullPath(sessionPath);
        var normalizedFilePath = Path.GetFullPath(fullFilePath);
        
        if (!normalizedFilePath.StartsWith(normalizedSessionPath))
            return Results.BadRequest("Access denied: Path is outside session directory");
        
        if (!File.Exists(normalizedFilePath) && !Directory.Exists(normalizedFilePath))
            return Results.NotFound($"File or directory not found: {request.FilePath}");

        try
        {
            var success = ProcessHelpers.OpenFileWithEditor(request.EditorId, normalizedFilePath);
            
            if (success)
            {
                var itemType = Directory.Exists(normalizedFilePath) ? "Directory" : "File";
                return Results.Ok(new { message = $"{itemType} opened with {request.EditorId}", filePath = request.FilePath });
            }
            else
            {
                return Results.Problem($"Failed to open item with {request.EditorId}");
            }
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error opening item: {ex.Message}");
        }
    };
}

public sealed record OpenFileRequest(
    string FilePath,
    string EditorId
);
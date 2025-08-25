using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Files;

internal sealed class CreateFolderEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/folders";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromBody] CreateFolderRequest request,
        ISessionRepository sessionRepository,
        IFileSystemService fileSystemService,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            if (string.IsNullOrWhiteSpace(request.FolderPath))
                return Results.BadRequest("Folder path is required");

            // Get the session to verify it exists and get workspace info
            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session == null)
                return Results.NotFound("Session not found");

            // Get the session working directory path
            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);

            // Check if session directory exists
            if (!Directory.Exists(sessionPath))
                return Results.NotFound("Session directory not found");

            // Construct the full folder path
            var fullFolderPath = Path.Combine(sessionPath, request.FolderPath);

            // Check if folder already exists
            if (Directory.Exists(fullFolderPath))
                return Results.Conflict("Folder already exists");

            // Create the folder
            var success = await fileSystemService.CreateDirectoryAsync(fullFolderPath, cancellationToken);
            
            if (!success)
                return Results.Problem("Failed to create folder");

            return Results.Ok(new { Message = $"Folder {request.FolderPath} created successfully" });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to create folder: {ex.Message}");
        }
    };
}

public record CreateFolderRequest(string FolderPath);
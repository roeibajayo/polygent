using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Files;

internal sealed class GetSessionFilesEndpoint : IGetEndpoint
{
    public string Route => "/api/sessions/{sessionId}/files";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromQuery] string? folderPath,
        ISessionManagement sessionManagement,
        IFileSystemService fileSystemService,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        var session = await sessionManagement.GetAsync(sessionId, cancellationToken);
        
        if (session is null)
            return Results.NotFound($"Session {sessionId} not found");
        
        // Prevent file operations on readonly sessions (Done/Canceled)
        if (session.Status == SessionStatus.Done || session.Status == SessionStatus.Canceled)
            return Results.BadRequest("Cannot access files in readonly session");
        
        var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);
        
        if (!await fileSystemService.DirectoryExistsAsync(sessionPath, cancellationToken))
            return Results.NotFound($"Session directory not found");
        
        // Build the target directory path
        var targetPath = sessionPath;
        if (!string.IsNullOrWhiteSpace(folderPath))
        {
            var normalizedFolderPath = folderPath.Replace('/', Path.DirectorySeparatorChar);
            targetPath = Path.Combine(sessionPath, normalizedFolderPath);
            
            // Security check: ensure the path is within the session directory
            var normalizedSessionPath = Path.GetFullPath(sessionPath);
            var normalizedTargetPath = Path.GetFullPath(targetPath);
            
            if (!normalizedTargetPath.StartsWith(normalizedSessionPath))
                return Results.BadRequest("Access denied: Path is outside session directory");
        }
        
        if (!await fileSystemService.DirectoryExistsAsync(targetPath, cancellationToken))
            return Results.NotFound($"Directory not found: {folderPath ?? "root"}");
        
        try
        {
            // Get immediate children only (not recursive)
            var directoryInfo = new DirectoryInfo(targetPath);
            var entries = directoryInfo.GetFileSystemInfos();
            
            var fileInfos = entries.Select(entry =>
            {
                var relativePath = Path.GetRelativePath(sessionPath, entry.FullName);
                var isDirectory = entry is DirectoryInfo;
                
                return new SessionFileDto(
                    relativePath.Replace('\\', '/'),
                    entry.Name,
                    isDirectory ? "" : Path.GetExtension(entry.Name),
                    entry.LastWriteTime,
                    isDirectory ? 0 : ((FileInfo)entry).Length,
                    isDirectory
                );
            }).ToArray();
            
            return Results.Ok(fileInfos);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error accessing directory: {ex.Message}");
        }
    };
}
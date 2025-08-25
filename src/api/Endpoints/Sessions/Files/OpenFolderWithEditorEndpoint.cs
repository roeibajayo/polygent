using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;
using System.Runtime.InteropServices;

namespace Polygent.Endpoints.Sessions.Files;

internal sealed class OpenFolderWithEditorEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/files/open-folder";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromBody] OpenFileFolderRequest request,
        ISessionManagement sessionManagement,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        if (string.IsNullOrWhiteSpace(request.FilePath))
            return Results.BadRequest("File path is required");

        var session = await sessionManagement.GetAsync(sessionId, cancellationToken);
        
        if (session is null)
            return Results.NotFound($"Session {sessionId} not found");

        var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);
        var fullFilePath = Path.Combine(sessionPath, request.FilePath.Replace('/', '\\'));
        
        // Security check: ensure the file is within the session directory
        var normalizedSessionPath = Path.GetFullPath(sessionPath);
        var normalizedFilePath = Path.GetFullPath(fullFilePath);
        
        if (!normalizedFilePath.StartsWith(normalizedSessionPath))
            return Results.BadRequest("Access denied: File path is outside session directory");
        
        if (!File.Exists(normalizedFilePath) && !Directory.Exists(normalizedFilePath))
            return Results.NotFound($"File not found: {request.FilePath}");

        try
        {
            var success = OpenFileInFolder(normalizedFilePath);
            
            if (success)
            {
                return Results.Ok(new { message = "File folder opened in explorer", filePath = request.FilePath });
            }
            else
            {
                return Results.Problem("Failed to open file folder in explorer");
            }
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error opening file folder: {ex.Message}");
        }
    };

    private static bool OpenFileInFolder(string filePath)
    {
        try
        {
            System.Diagnostics.ProcessStartInfo processStartInfo;

            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                // Windows: Open file explorer and select the file
                processStartInfo = new System.Diagnostics.ProcessStartInfo("explorer", $"/select,\"{filePath}\"");
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                // macOS: Open Finder and select the file
                processStartInfo = new System.Diagnostics.ProcessStartInfo("open", $"-R \"{filePath}\"");
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.Linux))
            {
                // Linux: Open file manager to the containing folder
                var folderPath = Path.GetDirectoryName(filePath);
                processStartInfo = new System.Diagnostics.ProcessStartInfo("xdg-open", $"\"{folderPath}\"");
            }
            else
            {
                return false;
            }

            processStartInfo.UseShellExecute = true;
            processStartInfo.CreateNoWindow = false;

            using var process = System.Diagnostics.Process.Start(processStartInfo);
            return process != null;
        }
        catch
        {
            return false;
        }
    }
}

public sealed record OpenFileFolderRequest(
    string FilePath
);
using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Git;

internal sealed class DiscardSessionFileEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/git/discard-file";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromBody] DiscardFileRequest request,
        ISessionRepository sessionRepository,
        IGitService gitService,
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

            // Get the session working directory path
            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);

            // Check if session directory exists
            if (!Directory.Exists(sessionPath))
                return Results.NotFound("Session directory not found");

            // Normalize file path to use forward slashes for git
            var normalizedFilePath = request.FilePath.Replace('\\', '/');
            
            // Check if file is tracked by git first
            var statusResult = await gitService.ExecuteGitCommandAsync("status", ["--porcelain=v1", "--", normalizedFilePath], sessionPath, cancellationToken);
            
            if (!statusResult.Success)
                return Results.Problem($"Failed to check file status: {statusResult.Error}");

            // If file is untracked (starts with ??), delete it instead of using git checkout
            if (!string.IsNullOrEmpty(statusResult.Output) && statusResult.Output.StartsWith("??"))
            {
                try
                {
                    var fullFilePath = Path.Combine(sessionPath, request.FilePath);
                    if (File.Exists(fullFilePath))
                    {
                        File.Delete(fullFilePath);
                    }
                }
                catch (Exception ex)
                {
                    return Results.Problem($"Failed to delete untracked file: {ex.Message}");
                }
            }
            else
            {
                // Discard changes for tracked file
                var result = await gitService.ExecuteGitCommandAsync("checkout", ["HEAD", "--", normalizedFilePath], sessionPath, cancellationToken);
                
                if (!result.Success)
                    return Results.Problem($"Failed to discard file changes: {result.Error}");
            }

            return Results.Ok(new { Message = $"Changes for file {request.FilePath} discarded successfully" });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to discard file changes: {ex.Message}");
        }
    };
}

public record DiscardFileRequest(string FilePath);
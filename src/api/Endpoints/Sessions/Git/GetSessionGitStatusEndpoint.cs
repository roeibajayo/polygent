using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Git;

internal sealed class GetSessionGitStatusEndpoint : IGetEndpoint
{
    public string Route => "/api/sessions/{sessionId}/git/status";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        ISessionRepository sessionRepository,
        IGitService gitService,
        IStorageService storageService,
        CancellationToken cancellationToken) =>
    {
        try
        {
            // Get the session to verify it exists and get workspace info
            var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken);
            if (session == null)
                return Results.NotFound("Session not found");

            // Prevent Git operations on readonly sessions (Done/Canceled)
            if (session.Status == SessionStatus.Done || session.Status == SessionStatus.Canceled)
                return Results.BadRequest("Cannot perform Git operations in readonly session");

            // Get the session working directory path
            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);

            // Check if session directory exists
            if (!Directory.Exists(sessionPath))
                return Results.NotFound("Session directory not found");

            // Get git status
            var status = await gitService.GetStatusAsync(sessionPath, cancellationToken);
            
            if (status == null)
                return Results.Problem("Failed to get git status");

            return Results.Ok(status);
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to get git status: {ex.Message}");
        }
    };
}
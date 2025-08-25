using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Git;

internal sealed class UnstageAllSessionChangesEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/git/unstage-all";
    
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

            // Get the session working directory path
            var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);

            // Check if session directory exists
            if (!Directory.Exists(sessionPath))
                return Results.NotFound("Session directory not found");

            // Unstage all changes
            var success = await gitService.DiscardStagedChangesAsync(sessionPath, cancellationToken);
            
            if (!success)
                return Results.Problem("Failed to unstage changes");

            return Results.Ok(new { message = "All changes unstaged successfully" });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to unstage changes: {ex.Message}");
        }
    };
}
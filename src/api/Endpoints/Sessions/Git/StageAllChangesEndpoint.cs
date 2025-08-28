using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions.Git;

internal sealed class StageAllChangesEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/git/stage-all";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        ISessionManagement sessionManagement,
        IStorageService storageService,
        IGitService gitService,
        CancellationToken cancellationToken) =>
    {
        var session = await sessionManagement.GetAsync(sessionId, cancellationToken);
        
        if (session is null)
            return Results.NotFound($"Session {sessionId} not found");

        var sessionPath = storageService.GetSessionPath(session.WorkspaceId, sessionId);
        
        try
        {
            // Execute git add . to stage all changes
            var result = await gitService.ExecuteGitCommandAsync("add", new[] { "." }, sessionPath, cancellationToken);
            
            if (result.Success)
            {
                return Results.Ok(new { message = "All changes staged successfully" });
            }
            else
            {
                return Results.Problem($"Failed to stage all changes: {result.Error}");
            }
        }
        catch (Exception ex)
        {
            return Results.Problem($"Error staging all changes: {ex.Message}");
        }
    };
}
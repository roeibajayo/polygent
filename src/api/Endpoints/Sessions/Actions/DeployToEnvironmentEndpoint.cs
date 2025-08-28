using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions.Actions;

internal sealed class DeployToEnvironmentEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/actions/deploy-to-environment";
    
    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        [FromQuery] int environmentId,
        [FromQuery] bool restartAfterSync,
        IEnvironmentManagement environmentManagement,
        CancellationToken cancellationToken) =>
    {
        try
        {
            // Deploy the session to the specified environment
            var result = await environmentManagement.DeployFromSessionAsync(environmentId, sessionId, restartAfterSync, cancellationToken);
            
            if (result)
                return Results.Ok(new { message = $"Successfully deployed session {sessionId} to environment {environmentId}" });
            
            return Results.BadRequest(new { message = $"Failed to deploy session {sessionId} to environment {environmentId}" });
        }
        catch (Exception ex)
        {
            return Results.Problem($"Failed to deploy session to environment: {ex.Message}");
        }
    };
}
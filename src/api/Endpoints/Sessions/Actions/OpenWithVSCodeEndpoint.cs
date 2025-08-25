using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions.Actions;

internal sealed class OpenWithVSCodeEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{sessionId}/actions/open-with-vscode";

    public Delegate Execute => static async (
        [FromRoute] int sessionId,
        ISessionManagement sessionManagement,
        CancellationToken cancellationToken) =>
    {
        var result = await sessionManagement.OpenWithVSCodeAsync(sessionId, cancellationToken);

        if (result)
            return Results.Ok(new { message = "Session opened with VSCode" });

        return Results.Problem("Failed to open session with VSCode. Make sure VSCode is installed and accessible from the command line.");
    };
}
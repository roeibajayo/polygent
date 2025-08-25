using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions;

internal sealed class GetWorkspaceSessionsEndpoint : IGetEndpoint
{
    public string Route => "/api/workspaces/{workspaceId}/sessions";
    
    public Delegate Execute => static async (
        [FromRoute] int workspaceId,
        ISessionManagement sessionManagement,
        CancellationToken cancellationToken) =>
    {
        var sessions = await sessionManagement.GetByWorkspaceIdAsync(workspaceId, cancellationToken);
        var sessionDtos = sessions.Select(static x => new SessionDto(
            x.Id,
            x.WorkspaceId,
            x.Status,
            x.StarterGitBranch,
            x.AgentId,
            x.HasUnreadMessage,
            x.Name,
            x.CreatedAt,
            x.UpdatedAt
        )).ToArray();
        
        return Results.Ok(sessionDtos);
    };
}
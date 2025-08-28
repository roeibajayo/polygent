using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions;

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
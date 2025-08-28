using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions;

internal sealed class GetSessionsEndpoint : IGetEndpoint
{
    public string Route => "/api/sessions";
    
    public Delegate Execute => static async (
        ISessionManagement sessionManagement,
        CancellationToken cancellationToken) =>
    {
        var sessions = await sessionManagement.GetActiveSessionsAsync(cancellationToken);
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
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions;

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
using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions;

internal sealed class GetSessionEndpoint : IGetEndpoint
{
    public string Route => "/api/sessions/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        ISessionManagement sessionManagement,
        CancellationToken cancellationToken) =>
    {
        var session = await sessionManagement.GetAsync(id, cancellationToken);
        
        if (session is null)
            return Results.NotFound();
        
        var sessionDto = new SessionDto(
            session.Id,
            session.WorkspaceId,
            session.Status,
            session.StarterGitBranch,
            session.AgentId,
            session.HasUnreadMessage,
            session.Name,
            session.CreatedAt,
            session.UpdatedAt
        );
        
        return Results.Ok(sessionDto);
    };
}
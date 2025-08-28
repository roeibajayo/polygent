using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Sessions;

internal sealed class CreateSessionEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions";
    
    public Delegate Execute => static async (
        [FromBody] CreateSessionDto dto,
        ISessionManagement sessionManagement,
        Services.INotificationService notificationService,
        CancellationToken cancellationToken) =>
    {
        var request = new CreateSessionRequest(
            dto.WorkspaceId,
            dto.StarterGitBranch,
            dto.AgentId,
            dto.Name
        );
        
        var id = await sessionManagement.CreateAsync(request, cancellationToken);
        var created = await sessionManagement.GetAsync(id, cancellationToken);
        
        if (created is null)
            return Results.Problem("Failed to create session.");
        
        var sessionDto = new SessionDto(
            created.Id,
            created.WorkspaceId,
            created.Status,
            created.StarterGitBranch,
            created.AgentId,
            created.HasUnreadMessage,
            created.Name,
            created.CreatedAt,
            created.UpdatedAt
        );
        
        await notificationService.SendSessionStatusChanged(id, created.Status);
        
        return Results.Created($"/api/sessions/{id}", sessionDto);
    };
}
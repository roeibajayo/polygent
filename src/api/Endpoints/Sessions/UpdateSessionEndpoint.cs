using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;
using Polygent.Services;

namespace Polygent.Endpoints.Sessions;

internal sealed class UpdateSessionEndpoint : IPutEndpoint
{
    public string Route => "/api/sessions/{id}";

    public Delegate Execute => static async (
        [FromRoute] int id,
        [FromBody] UpdateSessionDto dto,
        ISessionManagement sessionManagement,
        Services.INotificationService notificationService,
        CancellationToken cancellationToken) =>
    {
        var existing = await sessionManagement.GetAsync(id, cancellationToken);

        if (existing is null)
            return Results.NotFound();

        var request = new UpdateSessionRequest(
            dto.Status,
            dto.StarterGitBranch,
            Name: dto.Name
        );

        var success = await sessionManagement.UpdateAsync(id, request, cancellationToken);

        if (!success)
            return Results.Problem("Failed to update session.");

        var updated = await sessionManagement.GetAsync(id, cancellationToken);

        if (updated is null)
            return Results.Problem("Failed to retrieve updated session.");

        var sessionDto = new SessionDto(
            updated.Id,
            updated.WorkspaceId,
            updated.Status,
            updated.StarterGitBranch,
            updated.AgentId,
            updated.HasUnreadMessage,
            updated.Name,
            updated.CreatedAt,
            updated.UpdatedAt
        );

        if (dto.Status is not null && dto.Status != existing.Status)
        {
            await notificationService.SendSessionStatusChanged(id, updated.Status);
        }

        return Results.Ok(sessionDto);
    };
}
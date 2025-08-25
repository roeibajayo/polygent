using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;
using Polygent.Services;

namespace Polygent.Endpoints.Sessions;

internal sealed class ClearUnreadMessagesEndpoint : IPostEndpoint
{
    public string Route => "/api/sessions/{id}/clear-unread";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        ISessionRepository sessionRepository,
        Services.INotificationService notificationService,
        CancellationToken cancellationToken) =>
    {
        var session = await sessionRepository.GetByIdAsync(id, cancellationToken);
        
        if (session is null)
            return Results.NotFound();
        
        // Only clear if there are unread messages
        if (!session.HasUnreadMessage)
            return Results.Ok();
        
        var updatedSession = session with 
        { 
            HasUnreadMessage = false, 
            UpdatedAt = DateTime.UtcNow 
        };
        
        var success = await sessionRepository.UpdateAsync(updatedSession, cancellationToken);
        
        if (success)
        {
            await notificationService.SendSessionUnreadMessageChanged(id, false);
        }
        
        return success ? Results.Ok() : Results.Problem("Failed to clear unread messages.");
    };
}
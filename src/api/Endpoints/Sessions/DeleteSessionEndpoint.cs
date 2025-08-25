using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Sessions;

internal sealed class DeleteSessionEndpoint : IDeleteEndpoint
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
        
        var success = await sessionManagement.DeleteAsync(id, cancellationToken);
        
        if (!success)
            return Results.Problem("Failed to delete session.");
        
        return Results.NoContent();
    };
}
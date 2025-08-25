using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Environments;

internal sealed class DeleteEnvironmentEndpoint : IDeleteEndpoint
{
    public string Route => "/api/environments/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        IEnvironmentManagement environmentManagement,
        CancellationToken cancellationToken) =>
    {
        var existing = await environmentManagement.GetAsync(id, cancellationToken);
        
        if (existing is null)
            return Results.NotFound();
        
        var success = await environmentManagement.DeleteAsync(id, cancellationToken);
        
        if (!success)
            return Results.Problem("Failed to delete environment.");
        
        return Results.NoContent();
    };
}
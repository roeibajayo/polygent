using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Workspaces;

internal sealed class DeleteWorkspaceEndpoint : IDeleteEndpoint
{
    public string Route => "/api/workspaces/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        IWorkspaceManagement workspaceManagement,
        CancellationToken cancellationToken) =>
    {
        var workspace = await workspaceManagement.GetAsync(id, cancellationToken);
        
        if (workspace is null)
            return Results.NotFound();
        
        var success = await workspaceManagement.DeleteAsync(id, cancellationToken);
        
        if (!success)
            return Results.Problem("Failed to delete workspace.");
        
        return Results.NoContent();
    };
}
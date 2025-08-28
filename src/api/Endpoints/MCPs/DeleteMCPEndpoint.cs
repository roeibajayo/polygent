using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.MCPs;

internal sealed class DeleteMCPEndpoint : IDeleteEndpoint
{
    public string Route => "/api/mcps/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        IMCPRepository mcpRepo,
        CancellationToken cancellationToken) =>
    {
        var mcp = await mcpRepo.GetByIdAsync(id, cancellationToken);
        
        if (mcp is null)
            return Results.NotFound();
        
        var success = await mcpRepo.DeleteAsync(id, cancellationToken);
        
        if (!success)
            return Results.Problem("Failed to delete MCP.");
        
        return Results.NoContent();
    };
}
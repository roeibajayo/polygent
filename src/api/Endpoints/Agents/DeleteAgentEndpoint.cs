using Microsoft.AspNetCore.Mvc;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Agents;

internal sealed class DeleteAgentEndpoint : IDeleteEndpoint
{
    public string Route => "/api/agents/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        IAgentRepository agentRepo,
        CancellationToken cancellationToken) =>
    {
        var agent = await agentRepo.GetByIdAsync(id, cancellationToken);
        
        if (agent is null)
            return Results.NotFound();
        
        var success = await agentRepo.DeleteAsync(id, cancellationToken);
        
        if (!success)
            return Results.Problem("Failed to delete agent.");
        
        return Results.NoContent();
    };
}
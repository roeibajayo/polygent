using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Agents;

internal sealed class GetAgentEndpoint : IGetEndpoint
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
        
        var agentDto = new AgentDto(
            agent.Id,
            agent.Name,
            agent.RoleName,
            agent.Model,
            agent.SystemPrompt,
            agent.MCPIds,
            agent.CreatedAt,
            agent.UpdatedAt
        );
        
        return Results.Ok(agentDto);
    };
}
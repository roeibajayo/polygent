using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Agents;

internal sealed class GetAgentsEndpoint : IGetEndpoint
{
    public string Route => "/api/agents";
    
    public Delegate Execute => static async (
        IAgentRepository agentRepo,
        CancellationToken cancellationToken) =>
    {
        var agents = await agentRepo.GetAllAsync(cancellationToken);
        var agentDtos = agents.Select(static x => new AgentDto(
            x.Id,
            x.Name,
            x.RoleName,
            x.Model,
            x.SystemPrompt,
            x.MCPIds,
            x.CreatedAt,
            x.UpdatedAt
        )).ToArray();
        
        return Results.Ok(agentDtos);
    };
}
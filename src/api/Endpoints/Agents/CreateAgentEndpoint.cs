using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Agents;

internal sealed class CreateAgentEndpoint : IPostEndpoint
{
    public string Route => "/api/agents";
    
    public Delegate Execute => static async (
        [FromBody] CreateAgentDto dto,
        IAgentRepository agentRepo,
        CancellationToken cancellationToken) =>
    {
        var agent = new AgentEntity(
            0,
            dto.Name,
            dto.RoleName,
            dto.Model,
            dto.SystemPrompt,
            dto.MCPIds,
            DateTime.UtcNow,
            DateTime.UtcNow
        );
        
        var id = await agentRepo.CreateAsync(agent, cancellationToken);
        var created = await agentRepo.GetByIdAsync(id, cancellationToken);
        
        if (created is null)
            return Results.Problem("Failed to create agent.");
        
        var agentDto = new AgentDto(
            created.Id,
            created.Name,
            created.RoleName,
            created.Model,
            created.SystemPrompt,
            created.MCPIds,
            created.CreatedAt,
            created.UpdatedAt
        );
        
        return Results.Created($"/api/agents/{id}", agentDto);
    };
}
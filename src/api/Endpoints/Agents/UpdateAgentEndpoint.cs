using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Agents;

internal sealed class UpdateAgentEndpoint : IPutEndpoint
{
    public string Route => "/api/agents/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        [FromBody] UpdateAgentDto dto,
        IAgentRepository agentRepo,
        CancellationToken cancellationToken) =>
    {
        var existing = await agentRepo.GetByIdAsync(id, cancellationToken);
        
        if (existing is null)
            return Results.NotFound();
        
        var updated = new AgentEntity(
            existing.Id,
            dto.Name ?? existing.Name,
            dto.RoleName ?? existing.RoleName,
            dto.Model ?? existing.Model,
            dto.SystemPrompt ?? existing.SystemPrompt,
            dto.MCPIds ?? existing.MCPIds,
            existing.CreatedAt,
            DateTime.UtcNow
        );
        
        var success = await agentRepo.UpdateAsync(updated, cancellationToken);
        
        if (!success)
            return Results.Problem("Failed to update agent.");
        
        var agentDto = new AgentDto(
            updated.Id,
            updated.Name,
            updated.RoleName,
            updated.Model,
            updated.SystemPrompt,
            updated.MCPIds,
            updated.CreatedAt,
            updated.UpdatedAt
        );
        
        return Results.Ok(agentDto);
    };
}
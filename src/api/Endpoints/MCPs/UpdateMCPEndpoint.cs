using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.MCPs;

internal sealed class UpdateMCPEndpoint : IPutEndpoint
{
    public string Route => "/api/mcps/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        [FromBody] UpdateMCPDto dto,
        IMCPRepository mcpRepo,
        CancellationToken cancellationToken) =>
    {
        var existing = await mcpRepo.GetByIdAsync(id, cancellationToken);
        
        if (existing is null)
            return Results.NotFound();
        
        var updated = new MCPEntity(
            existing.Id,
            dto.Name ?? existing.Name,
            dto.Description ?? existing.Description,
            dto.Type ?? existing.Type,
            dto.Path ?? existing.Path,
            existing.CreatedAt,
            DateTime.UtcNow
        );
        
        var success = await mcpRepo.UpdateAsync(updated, cancellationToken);
        
        if (!success)
            return Results.Problem("Failed to update MCP.");
        
        var mcpDto = new MCPDto(
            updated.Id,
            updated.Name,
            updated.Description,
            updated.Type,
            updated.Path,
            updated.CreatedAt,
            updated.UpdatedAt
        );
        
        return Results.Ok(mcpDto);
    };
}
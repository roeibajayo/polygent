using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.MCPs;

internal sealed class CreateMCPEndpoint : IPostEndpoint
{
    public string Route => "/api/mcps";
    
    public Delegate Execute => static async (
        [FromBody] CreateMCPDto dto,
        IMCPRepository mcpRepo,
        CancellationToken cancellationToken) =>
    {
        var mcp = new MCPEntity(
            0,
            dto.Name,
            dto.Description,
            dto.Type,
            dto.Path,
            DateTime.UtcNow,
            DateTime.UtcNow
        );
        
        var id = await mcpRepo.CreateAsync(mcp, cancellationToken);
        var created = await mcpRepo.GetByIdAsync(id, cancellationToken);
        
        if (created is null)
            return Results.Problem("Failed to create MCP.");
        
        var mcpDto = new MCPDto(
            created.Id,
            created.Name,
            created.Description,
            created.Type,
            created.Path,
            created.CreatedAt,
            created.UpdatedAt
        );
        
        return Results.Created($"/api/mcps/{id}", mcpDto);
    };
}
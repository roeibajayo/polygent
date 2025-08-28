using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.MCPs;

internal sealed class GetMCPEndpoint : IGetEndpoint
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
        
        var mcpDto = new MCPDto(
            mcp.Id,
            mcp.Name,
            mcp.Description,
            mcp.Type,
            mcp.Path,
            mcp.CreatedAt,
            mcp.UpdatedAt
        );
        
        return Results.Ok(mcpDto);
    };
}
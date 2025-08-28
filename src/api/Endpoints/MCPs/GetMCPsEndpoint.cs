using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.MCPs;

internal sealed class GetMCPsEndpoint : IGetEndpoint
{
    public string Route => "/api/mcps";
    
    public Delegate Execute => static async (
        IMCPRepository mcpRepo,
        CancellationToken cancellationToken) =>
    {
        var mcps = await mcpRepo.GetAllAsync(cancellationToken);
        var mcpDtos = mcps.Select(static x => new MCPDto(
            x.Id,
            x.Name,
            x.Description,
            x.Type,
            x.Path,
            x.CreatedAt,
            x.UpdatedAt
        )).ToArray();
        
        return Results.Ok(mcpDtos);
    };
}
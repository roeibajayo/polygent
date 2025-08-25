using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Environments;

internal sealed class GetEnvironmentEndpoint : IGetEndpoint
{
    public string Route => "/api/environments/{id}";
    
    public Delegate Execute => static async (
        [FromRoute] int id,
        IEnvironmentManagement environmentManagement,
        CancellationToken cancellationToken) =>
    {
        var environment = await environmentManagement.GetAsync(id, cancellationToken);
        
        if (environment is null)
            return Results.NotFound();
        
        var environmentDto = new EnvironmentDto(
            environment.Id,
            environment.WorkspaceId,
            environment.Name,
            environment.GitBranch,
            environment.Url,
            environment.EnvironmentVariables,
            environment.CreatedAt,
            environment.UpdatedAt
        );
        
        return Results.Ok(environmentDto);
    };
}
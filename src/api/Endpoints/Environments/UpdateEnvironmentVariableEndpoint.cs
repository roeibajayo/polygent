using Microsoft.AspNetCore.Mvc;
using Polygent.Api.Dtos;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Environments;

internal sealed class UpdateEnvironmentVariableEndpoint : IPutEndpoint
{
    public string Route => "/api/environments/{environmentId}/variables/{key}";
    
    public Delegate Execute => static async (
        [FromRoute] int environmentId,
        [FromRoute] string key,
        [FromBody] UpdateEnvironmentVariableDto dto,
        IEnvironmentManagement environmentManagement,
        CancellationToken cancellationToken) =>
    {
        var result = await environmentManagement.UpdateEnvironmentVariableAsync(environmentId, key, dto.Value, cancellationToken);
        
        if (!result)
            return Results.NotFound($"Environment with ID {environmentId} not found or environment variable '{key}' does not exist.");
        
        var variableDto = new EnvironmentVariableDto(key, dto.Value);
        return Results.Ok(variableDto);
    };
}
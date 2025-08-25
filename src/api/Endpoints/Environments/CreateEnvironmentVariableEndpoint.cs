using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Environments;

internal sealed class CreateEnvironmentVariableEndpoint : IPostEndpoint
{
    public string Route => "/api/environments/{environmentId}/variables";
    
    public Delegate Execute => static async (
        [FromRoute] int environmentId,
        [FromBody] CreateEnvironmentVariableDto dto,
        IEnvironmentManagement environmentManagement,
        CancellationToken cancellationToken) =>
    {
        var result = await environmentManagement.SetEnvironmentVariableAsync(environmentId, dto.Key, dto.Value, cancellationToken);
        
        if (!result)
            return Results.NotFound($"Environment with ID {environmentId} not found.");
        
        var variableDto = new EnvironmentVariableDto(dto.Key, dto.Value);
        return Results.Created($"/api/environments/{environmentId}/variables/{dto.Key}", variableDto);
    };
}
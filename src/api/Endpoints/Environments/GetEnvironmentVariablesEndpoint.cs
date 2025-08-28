using Microsoft.AspNetCore.Mvc;
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Environments;

internal sealed class GetEnvironmentVariablesEndpoint : IGetEndpoint
{
    public string Route => "/api/environments/{environmentId}/variables";
    
    public Delegate Execute => static async (
        [FromRoute] int environmentId,
        IEnvironmentManagement environmentManagement,
        CancellationToken cancellationToken) =>
    {
        var variables = await environmentManagement.GetEnvironmentVariablesAsync(environmentId, cancellationToken);
        
        if (variables is null)
            return Results.NotFound($"Environment with ID {environmentId} not found.");
        
        var variableDtos = variables.Select(static kvp => new EnvironmentVariableDto(kvp.Key, kvp.Value)).ToArray();
        
        return Results.Ok(variableDtos);
    };
}
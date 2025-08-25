using Microsoft.AspNetCore.Mvc;
using Polygent.Dtos;
using Polygent.EndpointsInfrastructure;
using Polygent.Logic.Interfaces;

namespace Polygent.Endpoints.Environments;

internal sealed class GetWorkspaceEnvironmentsEndpoint : IGetEndpoint
{
    public string Route => "/api/workspaces/{workspaceId}/environments";
    
    public Delegate Execute => static async (
        [FromRoute] int workspaceId,
        IEnvironmentManagement environmentManagement,
        CancellationToken cancellationToken) =>
    {
        var environments = await environmentManagement.GetByWorkspaceIdAsync(workspaceId, cancellationToken);
        var environmentDtos = environments.Select(static x => new EnvironmentDto(
            x.Id,
            x.WorkspaceId,
            x.Name,
            x.GitBranch,
            x.Url,
            x.EnvironmentVariables,
            x.CreatedAt,
            x.UpdatedAt
        )).ToArray();
        
        return Results.Ok(environmentDtos);
    };
}
using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Workspaces;

internal sealed class GetWorkspacesEndpoint : IGetEndpoint
{
    public string Route => "/api/workspaces";
    
    public Delegate Execute => static async (
        IWorkspaceManagement workspaceManagement,
        CancellationToken cancellationToken) =>
    {
        var workspaces = await workspaceManagement.ListAsync(cancellationToken);
        var workspaceDtos = workspaces.Select(static x => new WorkspaceDto(
            x.Id,
            x.Name,
            x.GitRepository,
            x.CreatedAt,
            x.UpdatedAt
        )).ToArray();
        
        return Results.Ok(workspaceDtos);
    };
}
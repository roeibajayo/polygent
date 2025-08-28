using Polygent.Api.EndpointsInfrastructure;
using Polygent.Api.Dtos;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Endpoints.Backlogs;

internal sealed class GetBacklogsEndpoint : IGetEndpoint
{
    public string Route => "/api/backlogs";
    
    public Delegate Execute => static async (
        IBacklogRepository backlogRepo,
        CancellationToken cancellationToken) =>
    {
        var backlogs = await backlogRepo.GetAllAsync(cancellationToken);
        var backlogDtos = backlogs.Select(static x => new BacklogDto(
            x.Id,
            x.Title,
            x.Description,
            x.Status,
            x.Tags,
            x.WorkspaceId,
            x.SessionId,
            x.CreatedAt,
            x.UpdatedAt
        )).ToArray();
        
        return Results.Ok(backlogDtos);
    };
}
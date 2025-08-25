using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Services;

public sealed class PolygentHub : Hub
{
}

internal sealed class SignalRService(ILogger<SignalRService> logger, IHubContext<PolygentHub> hubContext) 
    : ISignalRService, IScopedService<ISignalRService>
{
    public async Task BroadcastAsync(string method, object? data, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Broadcasting message via method {Method}.", method);
            
            if (data is not null)
            {
                await hubContext.Clients.All.SendAsync(method, data, cancellationToken);
            }
            else
            {
                await hubContext.Clients.All.SendAsync(method, cancellationToken);
            }
            
            logger.LogInformation("Successfully broadcasted message via method {Method}.", method);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while broadcasting message via method {Method}.", method);
        }
    }

    public async Task SendToGroupAsync(string groupName, string method, object? data, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Sending message to group {GroupName} via method {Method}.", groupName, method);
            
            if (data is not null)
            {
                await hubContext.Clients.Group(groupName).SendAsync(method, data, cancellationToken);
            }
            else
            {
                await hubContext.Clients.Group(groupName).SendAsync(method, cancellationToken);
            }
            
            logger.LogInformation("Successfully sent message to group {GroupName} via method {Method}.", groupName, method);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while sending message to group {GroupName} via method {Method}.", groupName, method);
        }
    }

    public async Task AddToGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Adding connection {ConnectionId} to group {GroupName}.", connectionId, groupName);
            
            await hubContext.Groups.AddToGroupAsync(connectionId, groupName, cancellationToken);
            
            logger.LogInformation("Successfully added connection {ConnectionId} to group {GroupName}.", connectionId, groupName);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while adding connection {ConnectionId} to group {GroupName}.", connectionId, groupName);
        }
    }

    public async Task RemoveFromGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Removing connection {ConnectionId} from group {GroupName}.", connectionId, groupName);
            
            await hubContext.Groups.RemoveFromGroupAsync(connectionId, groupName, cancellationToken);
            
            logger.LogInformation("Successfully removed connection {ConnectionId} from group {GroupName}.", connectionId, groupName);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while removing connection {ConnectionId} from group {GroupName}.", connectionId, groupName);
        }
    }
}
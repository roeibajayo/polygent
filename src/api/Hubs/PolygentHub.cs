using Microsoft.AspNetCore.SignalR;
using Polygent.Logic.Interfaces;

namespace Polygent.Api.Hubs;

public class PolygentHub(
    ISessionPresenceService sessionPresenceService)
    : Hub
{
    public async Task JoinWorkspaceGroup(string workspaceId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"workspace-{workspaceId}");
    }

    public async Task LeaveWorkspaceGroup(string workspaceId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"workspace-{workspaceId}");
    }

    public async Task EnterSession(int sessionId)
    {
        await sessionPresenceService.SetActiveSession(sessionId);
    }

    public async Task ExitSession(int sessionId)
    {
        await sessionPresenceService.ClearActiveSession(sessionId);
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        await base.OnDisconnectedAsync(exception);
    }
}
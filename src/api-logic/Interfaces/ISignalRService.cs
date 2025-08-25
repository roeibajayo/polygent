namespace Polygent.Logic.Interfaces;

public interface ISignalRService
{
    Task BroadcastAsync(string method, object? data, CancellationToken cancellationToken);
    Task SendToGroupAsync(string groupName, string method, object? data, CancellationToken cancellationToken);
    Task AddToGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken);
    Task RemoveFromGroupAsync(string connectionId, string groupName, CancellationToken cancellationToken);
}
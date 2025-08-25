namespace Polygent.Logic.Interfaces;

public interface ISessionFileWatcherService
{
    Task StartWatchingSession(int sessionId, string workspacePath, CancellationToken cancellationToken = default);
    Task StopWatchingSession(int sessionId, CancellationToken cancellationToken = default);
}
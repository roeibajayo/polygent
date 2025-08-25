using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Services;

public class SessionPresenceService 
    : ISessionPresenceService, ISingletonService<ISessionPresenceService>
{
    private readonly Lock _lockObject = new();
    private int? _currentActiveSessionId = null;
    private DateTime _lastPing = DateTime.UtcNow;

    public Task SetActiveSession(int sessionId)
    {
        lock (_lockObject)
        {
            _currentActiveSessionId = sessionId;
            _lastPing = DateTime.UtcNow;
        }

        return Task.CompletedTask;
    }

    public Task ClearActiveSession(int sessionId)
    {
        lock (_lockObject)
        {
            if (_currentActiveSessionId == sessionId)
            {
                _currentActiveSessionId = null;
            }
        }

        return Task.CompletedTask;
    }

    public Task<bool> IsSessionActive(int sessionId)
    {
        lock (_lockObject)
        {
            if (_currentActiveSessionId != sessionId)
            {
                return Task.FromResult(false);
            }

            // Check if session is still active (pinged within last 15 seconds)
            var cutoffTime = DateTime.UtcNow.AddSeconds(-15);
            if (_lastPing <= cutoffTime)
            {
                _currentActiveSessionId = null;
                return Task.FromResult(false);
            }

            return Task.FromResult(true);
        }
    }
}
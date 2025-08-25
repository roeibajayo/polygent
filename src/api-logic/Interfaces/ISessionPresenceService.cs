namespace Polygent.Logic.Interfaces;

public interface ISessionPresenceService
{
    Task SetActiveSession(int sessionId);
    Task ClearActiveSession(int sessionId);
    Task<bool> IsSessionActive(int sessionId);
}
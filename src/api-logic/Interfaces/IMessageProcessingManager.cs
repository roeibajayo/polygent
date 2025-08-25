namespace Polygent.Logic.Interfaces;

public interface IMessageProcessingManager
{
    /// <summary>
    /// Registers a cancellation token for a message processing operation
    /// </summary>
    void RegisterMessageProcessing(int messageId, int sessionId, CancellationTokenSource cancellationTokenSource);
    
    /// <summary>
    /// Cancels the processing of a specific message
    /// </summary>
    Task<bool> CancelMessageProcessingAsync(int messageId);
    
    /// <summary>
    /// Cancels all working messages for a session
    /// </summary>
    Task<bool> CancelSessionWorkingMessagesAsync(int sessionId);
    
    /// <summary>
    /// Unregisters a message processing operation (when completed)
    /// </summary>
    void UnregisterMessageProcessing(int messageId);
    
    /// <summary>
    /// Gets all currently processing message IDs for a session
    /// </summary>
    IEnumerable<int> GetProcessingMessageIds(int sessionId);
}
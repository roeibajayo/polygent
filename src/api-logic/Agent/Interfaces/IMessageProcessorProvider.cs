using Polygent.Logic.Agent.Models;

namespace Polygent.Logic.Agent.Interfaces;

internal interface IMessageProcessorProvider
{
    Task<ProcessMessageResponse> ProcessMessageAsync(
        ProcessMessageRequest message,
        CancellationToken cancellationToken);
}

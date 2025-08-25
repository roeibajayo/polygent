using Microsoft.Extensions.Logging;
using Polygent.Logic.Helpers;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;
using RoeiBajayo.Infrastructure.Processes;
using System.Collections.Concurrent;
using System.Diagnostics;
using System.Text;

namespace Polygent.Logic.Services;

internal sealed class ProcessService(ILogger<ProcessService> logger, INotificationService notificationService)
    : IProcessService, IScopedService<IProcessService>
{
    private class InMemoryProcess(bool isSession, int contextId, int taskId, Process? process, Interfaces.TaskStatus status, string? output)
    {
        public bool IsSession { get; } = isSession;
        public int ContextId { get; } = contextId;
        public int TaskId { get; } = taskId;
        public Process? Process { get; set; } = process; // Make nullable for completed processes
        public Interfaces.TaskStatus Status { get; set; } = status;
        public string? Output { get; set; } = output;
        public bool IsCompleted => Status is Interfaces.TaskStatus.Completed or Interfaces.TaskStatus.Failed or Interfaces.TaskStatus.Canceled;
    }

    private static readonly ConcurrentDictionary<Guid, InMemoryProcess> runningProcesses = new();

    public async Task<Guid> StartProcessAsync(bool isSession, int contextId, int taskId, string command, string[] arguments, string? workingDirectory, Dictionary<string, string>? environmentVariables, CancellationToken cancellationToken)
    {
        try
        {
            var startInfo = new ProcessStartInfo
            {
                FileName = command,
                Arguments = string.Join(" ", arguments),
                WorkingDirectory = workingDirectory ?? Environment.CurrentDirectory,
            };
            ProcessHelpers.HideProcessWindow(startInfo);

            // Add environment variables if provided
            if (environmentVariables != null)
            {
                foreach (var (key, value) in environmentVariables)
                {
                    startInfo.EnvironmentVariables[key] = value;
                }
            }

            var process = new Process { StartInfo = startInfo };
            var outputBuilder = new StringBuilder();
            var errorBuilder = new StringBuilder();

            // Set up output and error data event handlers before starting
            process.OutputDataReceived += (_, e) =>
            {
                if (e.Data is not null)
                {
                    outputBuilder.AppendLine(e.Data);
                }
            };

            process.ErrorDataReceived += (_, e) =>
            {
                if (e.Data is not null)
                {
                    errorBuilder.AppendLine(e.Data);
                }
            };

            process.Start();
            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            var guid = Guid.CreateVersion7();
            var inMemoryProcess = new InMemoryProcess(isSession, contextId, taskId, process, Interfaces.TaskStatus.Running, null);
            runningProcesses.TryAdd(guid, inMemoryProcess);

            // Send notification that task status changed to running
            await notificationService.SendTaskStatusChanged(taskId, contextId, isSession, guid, Interfaces.TaskStatus.Running);

            // Set up process completion monitoring with output builders
            _ = MonitorProcessCompletionAsync(guid, inMemoryProcess, outputBuilder, errorBuilder);

            return guid;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while starting background process {Command} for {ContextType} {ContextId}.", command, isSession ? "Session" : "Environment", contextId);
            throw;
        }
    }

    public async Task<bool> StopProcessAsync(Guid processId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Stopping process with PID {ProcessId}.", processId);

            if (!runningProcesses.TryGetValue(processId, out var process))
            {
                logger.LogWarning("Process with PID {ProcessId} not found in running processes.", processId);
                return false;
            }

            if (process.Process?.HasExited == true)
            {
                logger.LogInformation("Process with PID {ProcessId} has already exited.", processId);
                process.Process.Dispose();
                process.Process = null;
                return true;
            }

            process.Process?.Kill(true);
            process.Status = Interfaces.TaskStatus.Canceled;

            // Send notification that task status changed to canceled
            await notificationService.SendTaskStatusChanged(process.TaskId, process.ContextId, process.IsSession, processId, Interfaces.TaskStatus.Canceled);

            logger.LogInformation("Successfully stopped process with PID {ProcessId}.", processId);
            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while stopping process with PID {ProcessId}.", processId);
            return false;
        }
    }

    public async Task<ProcessResult> GetProcessStatusAsync(Guid processId, CancellationToken cancellationToken)
    {
        if (runningProcesses.TryGetValue(processId, out var process))
        {
            // If process is null, it means it's completed and cleaned up
            if (process.Process == null)
            {
                // Process is completed, return stored status and output
                return new ProcessResult(
                    TaskId: process.TaskId,
                    TaskExecutionId: processId,
                    Status: process.Status,
                    Output: process.Output);
            }

            if (process.Process.HasExited)
            {
                // This should be handled by MonitorProcessCompletionAsync, but just in case
                var previousStatus = process.Status;
                process.Status = process.Process.ExitCode == 0
                    ? Interfaces.TaskStatus.Completed
                    : Interfaces.TaskStatus.Failed;

                // Send notification only if status changed
                if (previousStatus != process.Status)
                {
                    await notificationService.SendTaskStatusChanged(process.TaskId, process.ContextId, process.IsSession, processId, process.Status);
                }
            }
            else
            {
                process.Status = Interfaces.TaskStatus.Running;
            }

            return new ProcessResult(
                TaskId: process.TaskId,
                TaskExecutionId: processId,
                Status: process.Status,
                Output: process.Output);
        }
        else
        {
            logger.LogWarning("Process with PID {ProcessId} not found in running processes.", processId);

            return new ProcessResult(
                TaskId: 0,
                TaskExecutionId: processId,
                Status: Interfaces.TaskStatus.Pending,
                Output: null);
        }
    }


    public async Task<ProcessResult[]> GetProcessStatusesAsync(bool isSession, int contextId, CancellationToken cancellationToken)
    {
        var processes = runningProcesses
            .Where(kvp => kvp.Value.IsSession == isSession && kvp.Value.ContextId == contextId)
            .Select(kvp => kvp.Key)
            .ToArray();

        var results = new ProcessResult[processes.Length];
        for (var i = 0; i < results.Length; i++)
        {
            var processId = processes[i];
            results[i] = await GetProcessStatusAsync(processId, cancellationToken);
        }
        return results;
    }

    public Task<string?> GetProcessOutputAsync(Guid processId, CancellationToken cancellationToken)
    {
        if (runningProcesses.TryGetValue(processId, out var process))
        {
            return Task.FromResult(process.Output);
        }
        else
        {
            logger.LogWarning("Process with PID {ProcessId} not found in running processes.", processId);
            return Task.FromResult<string?>(null);
        }
    }

    private async Task MonitorProcessCompletionAsync(Guid processId, InMemoryProcess process, StringBuilder outputBuilder, StringBuilder errorBuilder)
    {
        try
        {
            var lastOutputLength = 0;
            var lastErrorLength = 0;

            // Monitor output changes while process is running
            while (process.Process is not null && !process.Process!.HasExited)
            {
                await Task.Delay(100); // Check for output changes every 100ms

                var currentOutput = outputBuilder.ToString();
                var currentError = errorBuilder.ToString();

                // Check if there's new output
                if (currentOutput.Length > lastOutputLength)
                {
                    var newOutput = currentOutput.Substring(lastOutputLength);
                    lastOutputLength = currentOutput.Length;

                    // Update stored output and send notification
                    process.Output = currentOutput;
                    await notificationService.SendTaskOutputChanged(process.TaskId, process.ContextId, process.IsSession, processId, currentOutput);
                }

                // Check if there's new error output
                if (currentError.Length > lastErrorLength)
                {
                    var newError = currentError.Substring(lastErrorLength);
                    lastErrorLength = currentError.Length;

                    // For streaming, we'll send error output as well
                    var combinedOutput = !string.IsNullOrEmpty(currentOutput) ? currentOutput + "\n" + currentError : currentError;
                    process.Output = combinedOutput;
                    await notificationService.SendTaskOutputChanged(process.TaskId, process.ContextId, process.IsSession, processId, combinedOutput);
                }
            }

            if (process.Process is not null)
                // Process has completed - wait for it to fully exit
                await process.Process.WaitForExitAsync();

            logger.LogInformation("Process {ProcessId} has completed with exit code {ExitCode}.", processId, process.Process?.ExitCode ?? -1);

            // Determine final status based on exit code
            var finalStatus = process.Process?.ExitCode == 0
                ? Interfaces.TaskStatus.Completed
                : Interfaces.TaskStatus.Failed;

            // Update the process status
            process.Status = finalStatus;

            // Send any remaining output that might have been generated during final moments
            var finalStdOutput = outputBuilder.ToString();
            var finalStdError = errorBuilder.ToString();

            // Set final output based on status
            var finalOutput = finalStatus == Interfaces.TaskStatus.Completed
                ? finalStdOutput
                : (!string.IsNullOrEmpty(finalStdError) ? finalStdError : finalStdOutput);

            // Send final output update if there's any new content
            if (!string.IsNullOrEmpty(finalOutput) && finalOutput != process.Output)
            {
                process.Output = finalOutput;
                await notificationService.SendTaskOutputChanged(process.TaskId, process.ContextId, process.IsSession, processId, finalOutput);
            }

            // Send final status notification
            await notificationService.SendTaskStatusChanged(process.TaskId, process.ContextId, process.IsSession, processId, finalStatus);

            // Clean up the process but keep the output
            process.Process.Dispose();
            process.Process = null; // Clear the process reference but keep the output

            // Keep completed processes in memory for output retrieval, but remove after extended time
            _ = Task.Run(async () =>
            {
                await Task.Delay(TimeSpan.FromHours(1)); // Keep for 1 hour for output retrieval
                runningProcesses.TryRemove(processId, out _);
            });
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Error monitoring process completion for {ProcessId}.", processId);
        }
    }


}
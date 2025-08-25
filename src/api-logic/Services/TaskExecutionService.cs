using Microsoft.Extensions.Logging;
using Polygent.Logic.Interfaces;
using RoeiBajayo.Infrastructure.DependencyInjection.Interfaces;

namespace Polygent.Logic.Services;

internal sealed class TaskExecutionService(
    ILogger<TaskExecutionService> logger,
    ISessionRepository sessionRepository,
    IWorkspaceRepository workspaceRepository,
    IEnvironmentRepository environmentRepository,
    IStorageService storageService,
    ITaskRepository taskRepository,
    IProcessService processService)
    : ITaskExecutionService, IScopedService<ITaskExecutionService>
{
    public async Task<Guid> StartSessionTaskAsync(int sessionId, int taskId, CancellationToken cancellationToken)
    {
        var task = await taskRepository.GetByIdAsync(taskId, cancellationToken)
            ?? throw new InvalidOperationException($"Task {taskId} not found");
        var session = await sessionRepository.GetByIdAsync(sessionId, cancellationToken)
            ?? throw new InvalidOperationException($"Session {sessionId} not found");
        var workspace = await workspaceRepository.GetByIdAsync(session.WorkspaceId, cancellationToken)
            ?? throw new InvalidOperationException($"Workspace {session.WorkspaceId} not found");
        var path = storageService.GetSessionPath(session.WorkspaceId, sessionId);

        var taskExecutionId = await StartTaskAsync(
            task,
            true,
            sessionId,
            path,
            workspace.EnvironmentVariables,
            null,
            cancellationToken);

        return taskExecutionId;
    }

    public async Task<Guid> StartEnvironmentTaskAsync(int environmentId, int taskId, CancellationToken cancellationToken)
    {
        var task = await taskRepository.GetByIdAsync(taskId, cancellationToken)
            ?? throw new InvalidOperationException($"Task {taskId} not found");
        var environment = await environmentRepository.GetByIdAsync(environmentId, cancellationToken)
            ?? throw new InvalidOperationException($"Environment {environmentId} not found");
        var workspace = await workspaceRepository.GetByIdAsync(environment.WorkspaceId, cancellationToken)
            ?? throw new InvalidOperationException($"Workspace {environment.WorkspaceId} not found");
        var path = storageService.GetEnvironmentPath(environment.WorkspaceId, environment.Name);

        var taskExecutionId = await StartTaskAsync(
            task,
            true,
            environmentId,
            path,
            workspace.EnvironmentVariables,
            environment.EnvironmentVariables,
            cancellationToken);

        return taskExecutionId;
    }


    public async Task<TaskStatusInfo[]> GetTaskStatusesAsync(int workspaceId, int contextId, bool isSession, CancellationToken cancellationToken)
    {
        var tasks = await taskRepository.GetByWorkspaceIdAsync(workspaceId, cancellationToken);
        var statuses = await processService.GetProcessStatusesAsync(isSession, contextId, cancellationToken);

        return [.. tasks
                .Select(x =>
                {
                    var status = statuses.FirstOrDefault(s => s.TaskId == x.Id);
                    if (status is null)
                        return new TaskStatusInfo(x.Id, x.Name, x.Type, Interfaces.TaskStatus.Pending, null);

                    return new TaskStatusInfo(x.Id, x.Name, x.Type, status.Status, status.TaskExecutionId);
                })];
    }

    public async Task<bool> StopTaskAsync(Guid taskExecutionId, CancellationToken cancellationToken)
    {
        try
        {
            logger.LogInformation("Stopping task {TaskExecutionId}.", taskExecutionId);

            if (!await processService.StopProcessAsync(taskExecutionId, cancellationToken))
                throw new InvalidOperationException($"Failed to stop task {taskExecutionId}");

            return true;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while stopping task {TaskExecutionId}.", taskExecutionId);
            throw;
        }
    }

    private async Task<Guid> StartTaskAsync(
        TaskEntity task,
        bool isSession,
        int contextId,
        string baseWorkingDir,
        Dictionary<string, string> workspaceEnvironmentVariables,
        Dictionary<string, string>? environmentVariables,
        CancellationToken cancellationToken)
    {
        var taskId = task.Id;
        var taskName = task.Name;
        var workingDirectory = task.WorkingDirectory;
        var scriptType = task.ScriptType;
        var scriptContent = task.ScriptContent;

        try
        {
            // Normalize the working directory path to handle relative paths properly
            var normalizedWorkingDir = workingDirectory?.StartsWith("./") == true
                ? workingDirectory[2..]
                : workingDirectory ?? "";

            // Replace forward slashes with proper directory separators and normalize the path
            normalizedWorkingDir = normalizedWorkingDir.Replace('/', Path.DirectorySeparatorChar);

            workingDirectory = Path.GetFullPath(Path.Combine(baseWorkingDir, normalizedWorkingDir));

            // Ensure the working directory exists
            if (!Directory.Exists(workingDirectory))
            {
                logger.LogError("Working directory does not exist: {WorkingDirectory}", workingDirectory);
                throw new DirectoryNotFoundException($"Working directory does not exist: {workingDirectory}");
            }

            // Start the process based on script type
            var command = scriptType switch
            {
                ScriptType.Bash => "bash",
                ScriptType.PowerShell => "powershell",
                ScriptType.NodeJs => "node",
                _ => throw new NotSupportedException($"Script type {scriptType} is not supported")
            };

            var arguments = scriptType switch
            {
                ScriptType.Bash => new[] { "-c", scriptContent },
                ScriptType.PowerShell => ["-Command", scriptContent],
                ScriptType.NodeJs => ["-e", scriptContent],
                _ => throw new NotSupportedException($"Script type {scriptType} is not supported")
            };


            if (environmentVariables is not null)
            {
                foreach (var kvp in environmentVariables)
                {
                    workspaceEnvironmentVariables[kvp.Key] = kvp.Value;
                }
            }

            var guid = await processService.StartProcessAsync(isSession, contextId, taskId, command, arguments, workingDirectory, workspaceEnvironmentVariables, cancellationToken);
            return guid;
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Exception occurred while starting task {TaskName} for {ContextType} {TaskId}.", taskName, isSession ? "Session" : "Environment", taskId);
            throw;
        }
    }
}
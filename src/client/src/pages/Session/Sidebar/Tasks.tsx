import { useState } from 'react';
import { Button, TasksList } from '@/components';
import { sessionsApi, tasksApi } from '@/api';
import { useSessionTasks } from '@/hooks/useSessionTasks';
import { useTaskExecutionStore } from '@/stores';
import { GetTaskOutputResponseDto, TaskStatus } from '@/types/entities';
import { RefreshCwIcon } from 'lucide-react';

interface TasksProps {
  sessionId: number;
  isSessionReadonly: boolean;
  onOpenTask: (id: string, name: string) => void;
}

export default function Tasks({
  sessionId,
  isSessionReadonly,
  onOpenTask
}: TasksProps) {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const { taskExecutions, setTaskExecution, mapTaskToExecution } =
    useTaskExecutionStore();

  const {
    tasks,
    loading: tasksLoading,
    error: tasksError,
    refreshTasks
  } = useSessionTasks(sessionId);

  const handleStartTask = async (
    taskId: number,
    taskName: string,
    autoOpen: boolean = true
  ) => {
    const actionKey = `start-${taskId}`;
    setLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const result = await sessionsApi.startTask(sessionId, taskId);

      // Map task ID to execution ID
      const executionIdStr = String(result.taskExecutionId);

      mapTaskToExecution(taskId, true, executionIdStr);

      setTaskExecution(executionIdStr, {
        taskExecutionId: executionIdStr,
        output: '',
        status: TaskStatus.Running, // Set to Running immediately since we know it started
        startTime: new Date()
      });

      // Open output tab only if autoOpen is true
      if (autoOpen) {
        handleViewOutput(taskId, taskName, executionIdStr, true);
      }

      // Wait a bit before refreshing to let the backend update the task
      setTimeout(() => {
        refreshTasks(true);
      }, 100);
    } catch (error) {
      console.error('[Tasks] Failed to start task:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleStopTask = async (taskExecutionId: string) => {
    const actionKey = `stop-${taskExecutionId}`;
    setLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      await tasksApi.stopTask(taskExecutionId);
      refreshTasks();
    } catch (error) {
      console.error('Failed to stop task:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleRestartTask = async (
    taskId: number,
    taskName: string,
    taskExecutionId: string
  ) => {
    const actionKey = `restart-${taskId}`;
    setLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      // First stop the current execution
      await tasksApi.stopTask(taskExecutionId);

      // Wait a brief moment for the stop to process
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Then start the task again with auto-open
      await handleStartTask(taskId, taskName, true);
    } catch (error) {
      console.error('Failed to restart task:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleViewOutput = async (
    taskId: number,
    name: string,
    taskExecutionId: string,
    justStarted: boolean
  ) => {
    try {
      const result = justStarted
        ? ({
            output: '',
            status: TaskStatus.Running
          } as GetTaskOutputResponseDto)
        : await tasksApi.getTaskOutput(taskExecutionId);
      mapTaskToExecution(taskId, true, taskExecutionId);

      setTaskExecution(taskExecutionId, {
        ...result,
        taskExecutionId
      });
      onOpenTask(taskExecutionId, name);
    } catch (error) {
      console.error('[Tasks] Failed to get task output:', {
        taskExecutionId,
        error,
        sessionId
      });

      // If we can't get output, still open the task view with current data
      const currentExecution = taskExecutions[taskExecutionId];
      if (currentExecution) {
        onOpenTask(taskExecutionId, `Task Output`);
      } else {
        // Create a placeholder execution
        setTaskExecution(taskExecutionId, {
          taskExecutionId,
          output: 'Unable to load output. The task may still be initializing.',
          status: TaskStatus.Pending
        });
        onOpenTask(taskExecutionId, `Task Output`);
      }
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-neutral-900 dark:text-neutral-100">
          Tasks
        </h3>
        {!isSessionReadonly && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refreshTasks()}
            disabled={tasksLoading}>
            <RefreshCwIcon
              size={14}
              className={tasksLoading ? 'animate-spin' : ''}
            />
          </Button>
        )}
      </div>

      {tasksError && (
        <div className="text-red-600 text-sm p-2 bg-red-50 dark:bg-red-900/20 rounded">
          Error: {tasksError}
        </div>
      )}

      {isSessionReadonly ? (
        <div className="text-sm opacity-50">
          You are viewing a read-only session.
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          {tasksLoading && tasks.length === 0 ? (
            <div className="text-neutral-500 text-sm">Loading tasks...</div>
          ) : (
            <TasksList
              isSession
              tasks={tasks}
              loading={loading}
              taskExecutions={taskExecutions}
              isReadonly={isSessionReadonly}
              onStart={(taskId, taskName, autoOpen = true) =>
                handleStartTask(taskId, taskName, autoOpen)
              }
              onStop={handleStopTask}
              onRestart={handleRestartTask}
              onViewOutput={(taskId, taskName, executionId) =>
                handleViewOutput(taskId, taskName, executionId, false)
              }
              emptyMessage="No tasks found"
              autoOpenOnGroupStart={true} // Open tabs when starting group in Session
            />
          )}
        </div>
      )}
    </div>
  );
}

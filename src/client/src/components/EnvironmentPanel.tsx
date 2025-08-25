import { useState, useRef, useEffect, useCallback } from 'react';
import { Button, TasksList, ConsoleOutput } from '@/components';
import Modal from '@/components/Modal';
import { Environment, TaskStatus, TaskType } from '@/types/entities';
import {
  RefreshCwIcon,
  TerminalIcon,
  ExternalLinkIcon,
  RotateCcwIcon
} from 'lucide-react';
import TaskStatusIndicator from '@/components/TaskStatusIndicator';
import { environmentsApi, tasksApi } from '@/api';
import { useTaskExecutionStore } from '@/stores';

interface EnvironmentPanelProps {
  environments: Environment[];
  className?: string;
  taskUpdateTrigger?: number;
  workspaceName?: string;
}

interface EnvironmentTasks {
  environment: Environment;
  tasks: any[];
  loading: boolean;
  error: string | null;
}

interface TaskOutputModal {
  isOpen: boolean;
  taskName: string;
  taskExecutionId: string;
  environmentId: number;
}

export default function EnvironmentPanel({
  environments,
  className = '',
  taskUpdateTrigger,
  workspaceName
}: EnvironmentPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [environmentTasks, setEnvironmentTasks] = useState<
    Record<number, EnvironmentTasks>
  >({});
  const [globalLoading, setGlobalLoading] = useState(false);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const {
    taskExecutions,
    setTaskExecution,
    mapTaskToExecution,
    getTaskExecutionId
  } = useTaskExecutionStore();
  const [outputModal, setOutputModal] = useState<TaskOutputModal>({
    isOpen: false,
    taskName: '',
    taskExecutionId: '',
    environmentId: 0
  });
  const panelRef = useRef<HTMLDivElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  // Load tasks for a specific environment
  const loadEnvironmentTasks = useCallback(async (environment: Environment) => {
    setEnvironmentTasks((prev) => ({
      ...prev,
      [environment.id]: {
        ...prev[environment.id],
        environment,
        loading: true,
        error: null
      }
    }));

    try {
      const tasks = await environmentsApi.getTasks(environment.id);
      setEnvironmentTasks((prev) => ({
        ...prev,
        [environment.id]: {
          environment,
          tasks,
          loading: false,
          error: null
        }
      }));
    } catch (error) {
      setEnvironmentTasks((prev) => ({
        ...prev,
        [environment.id]: {
          environment,
          tasks: [],
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load tasks'
        }
      }));
    }
  }, []);

  // Load tasks for all environments when they change
  useEffect(() => {
    environments.forEach((env) => {
      if (
        !environmentTasks[env.id] ||
        environmentTasks[env.id].tasks === undefined
      ) {
        loadEnvironmentTasks(env);
      }
    });
  }, [environments.length]); // Only re-run when the number of environments changes

  // Refresh environment tasks when workspace tasks are updated
  useEffect(() => {
    if (taskUpdateTrigger && environments.length > 0) {
      environments.forEach((env) => {
        loadEnvironmentTasks(env);
      });
    }
  }, [taskUpdateTrigger, environments.length]);

  // Refresh environment tasks when task status changes to completed
  useEffect(() => {
    Object.entries(taskExecutions).forEach(([executionId, execution]) => {
      if (
        execution.status === TaskStatus.Completed ||
        execution.status === TaskStatus.Failed ||
        execution.status === TaskStatus.Canceled
      ) {
        // Find which environment this task belongs to and refresh it
        environments.forEach((env) => {
          const envData = environmentTasks[env.id];
          if (envData?.tasks) {
            const hasTask = envData.tasks.some((task) => {
              const mappedExecutionId = getTaskExecutionId(task.id, false);
              return (
                mappedExecutionId === executionId ||
                task.taskExecutionId === executionId
              );
            });
            if (hasTask) {
              // Only refresh if we haven't already seen this status
              const existingTask = envData.tasks.find(
                (task) =>
                  task.taskExecutionId === executionId ||
                  getTaskExecutionId(task.id, false) === executionId
              );
              if (existingTask && existingTask.status !== execution.status) {
                loadEnvironmentTasks(env);
              }
            }
          }
        });
      }
    });
  }, [taskExecutions]);

  // Load all environments' tasks
  const loadAllEnvironmentTasks = async () => {
    setGlobalLoading(true);
    await Promise.all(environments.map((env) => loadEnvironmentTasks(env)));
    setGlobalLoading(false);
  };

  const handleStartTask = async (
    environmentId: number,
    taskId: number,
    taskName: string,
    autoOpen: boolean = true
  ) => {
    const actionKey = `start-${environmentId}-${taskId}`;
    setLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      const result = await environmentsApi.startTask(environmentId, taskId);

      // Map task ID to execution ID;

      mapTaskToExecution(taskId, false, result.taskExecutionId);

      setTaskExecution(result.taskExecutionId, {
        taskExecutionId: result.taskExecutionId,
        output: '',
        status: TaskStatus.Running,
        startTime: new Date()
      });

      // Open output modal for this task only if autoOpen is true
      if (autoOpen) {
        handleViewOutput(
          taskId,
          taskName,
          result.taskExecutionId,
          environmentId,
          true
        );
      }

      // Refresh tasks for this environment
      setTimeout(() => {
        const environment = environments.find(
          (env) => env.id === environmentId
        );
        if (environment) {
          loadEnvironmentTasks(environment);
        }
      }, 100);
    } catch (error) {
      console.error('Failed to start task:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleStopTask = async (
    environmentId: number,
    taskExecutionId: string
  ) => {
    const actionKey = `stop-${environmentId}-${taskExecutionId}`;
    setLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      await tasksApi.stopTask(taskExecutionId);
      const environment = environments.find((env) => env.id === environmentId);
      if (environment) {
        loadEnvironmentTasks(environment);
      }
    } catch (error) {
      console.error('Failed to stop task:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleRestartTask = async (
    environmentId: number,
    taskId: number,
    taskName: string,
    taskExecutionId: string
  ) => {
    const actionKey = `restart-${environmentId}-${taskId}`;
    setLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      // First stop the current execution
      await tasksApi.stopTask(taskExecutionId);

      // Wait a brief moment for the stop to process
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Then start the task again with auto-open disabled for restart
      await handleStartTask(environmentId, taskId, taskName);
    } catch (error) {
      console.error('Failed to restart task:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const handleViewOutput = async (
    _taskId: number,
    taskName: string,
    taskExecutionId: string,
    environmentId: number,
    justStarted: boolean = false
  ) => {
    try {
      if (!justStarted) {
        // Load existing output
        const result = await tasksApi.getTaskOutput(taskExecutionId);
        setTaskExecution(taskExecutionId, {
          taskExecutionId,
          output: result.output || '',
          status: result.status
        });
      }

      setOutputModal({
        isOpen: true,
        taskName,
        taskExecutionId,
        environmentId
      });
    } catch (error) {
      console.error('Failed to get task output:', error);
      // Still open the modal even if we can't load output
      setOutputModal({
        isOpen: true,
        taskName,
        taskExecutionId,
        environmentId
      });
    }
  };

  const handleResetEnvironment = async (
    environmentId: number,
    _environmentName: string
  ) => {
    const actionKey = `reset-${environmentId}`;
    setLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      await environmentsApi.reset(environmentId);

      // Refresh tasks for this environment after reset
      const environment = environments.find((env) => env.id === environmentId);
      if (environment) {
        loadEnvironmentTasks(environment);
      }
    } catch (error) {
      console.error('Failed to reset environment:', error);
    } finally {
      setLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const hasStartTaskRunning = Object.values(environmentTasks).some((env) =>
    (env.tasks || []).some((task) => {
      const mappedExecutionId = getTaskExecutionId(task.id, false);
      const executionId = mappedExecutionId || task.taskExecutionId;
      const taskExecution = executionId ? taskExecutions[executionId] : null;
      const currentStatus = taskExecution?.status ?? task.status;
      return (
        task.type === TaskType.Start && currentStatus === TaskStatus.Running
      );
    })
  );

  return (
    <div className={`relative ${className}`} ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 py-2 px-3 text-left shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:border-purple-500 focus:ring-1 sm:text-sm text-neutral-900 dark:text-neutral-100">
        <span className="flex items-center gap-2">
          {hasStartTaskRunning && (
            <div className="relative">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
            </div>
          )}
          <span>Environments</span>
        </span>
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 z-20 w-96 mb-2 rounded-md bg-white dark:bg-neutral-800 py-2 shadow-lg ring-1 ring-black dark:ring-neutral-600 ring-opacity-5 border border-neutral-200 dark:border-neutral-700 max-h-96 overflow-y-auto">
          <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700 flex items-center justify-between">
            <h3 className="text-sm text-neutral-900 dark:text-neutral-100">
              {workspaceName
                ? `${workspaceName} - Environment Tasks`
                : 'Environment Tasks'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={loadAllEnvironmentTasks}
              disabled={globalLoading}>
              <RefreshCwIcon
                size={14}
                className={globalLoading ? 'animate-spin' : ''}
              />
            </Button>
          </div>

          <div className="py-1 space-y-3">
            {environments.length === 0 ? (
              <div className="px-3 py-4 text-sm text-neutral-500 dark:text-neutral-400 text-center">
                No environments available
              </div>
            ) : (
              environments.map((env) => {
                const envData = environmentTasks[env.id];
                const isLoading = envData?.loading ?? true;
                const error = envData?.error;
                const tasks = envData?.tasks ?? [];

                // Check if this specific environment has Start tasks running
                const envHasStartTaskRunning = (tasks || []).some((task) => {
                  const mappedExecutionId = getTaskExecutionId(task.id, false);
                  const executionId = mappedExecutionId || task.taskExecutionId;
                  const taskExecution = executionId
                    ? taskExecutions[executionId]
                    : null;
                  const currentStatus = taskExecution?.status ?? task.status;
                  return (
                    task.type === TaskType.Start &&
                    currentStatus === TaskStatus.Running
                  );
                });

                return (
                  <div key={env.id} className="mx-2">
                    <div className="px-2 py-1 bg-neutral-50 dark:bg-neutral-700 rounded-t border-b border-neutral-200 dark:border-neutral-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {envHasStartTaskRunning && (
                            <div className="relative">
                              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                              <div className="absolute inset-0 w-2 h-2 bg-green-400 rounded-full animate-ping"></div>
                            </div>
                          )}
                          <h4 className="text-xs text-neutral-700 dark:text-neutral-300">
                            {env.name}
                          </h4>
                          {env.url && envHasStartTaskRunning && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                window.open(
                                  env.url,
                                  '_blank',
                                  'noopener,noreferrer'
                                );
                              }}
                              className="text-neutral-500 hover:text-purple-600 dark:text-neutral-400 dark:hover:text-purple-400"
                              title={`Open ${env.name} (${env.url})`}>
                              <ExternalLinkIcon size={12} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetEnvironment(env.id, env.name);
                            }}
                            disabled={loading[`reset-${env.id}`]}
                            title="Reset git repository (hard reset + pull)"
                            className="p-1 h-5 w-5">
                            <RotateCcwIcon
                              size={10}
                              className={
                                loading[`reset-${env.id}`] ? 'animate-spin' : ''
                              }
                            />
                          </Button>
                          <span className="text-xs text-neutral-500 dark:text-neutral-400">
                            {tasks.length} task{tasks.length !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="px-2 py-2 text-red-600 text-xs bg-red-50 dark:bg-red-900/20">
                        Error: {error}
                      </div>
                    )}

                    <div className="border border-neutral-200 dark:border-neutral-600 rounded-b">
                      {isLoading ? (
                        <div className="px-3 py-2 text-neutral-500 text-xs">
                          Loading tasks...
                        </div>
                      ) : tasks.length === 0 ? (
                        <div className="px-3 py-2 text-neutral-500 text-xs">
                          No tasks found
                        </div>
                      ) : (
                        <div className="p-1">
                          <TasksList
                            isSession={false}
                            tasks={tasks}
                            loading={loading}
                            taskExecutions={taskExecutions}
                            isReadonly={false}
                            onStart={(taskId, taskName, autoOpen = true) =>
                              handleStartTask(
                                env.id,
                                taskId,
                                taskName,
                                autoOpen
                              )
                            }
                            onStop={(executionId) =>
                              handleStopTask(env.id, executionId)
                            }
                            onRestart={(taskId, taskName, executionId) =>
                              handleRestartTask(
                                env.id,
                                taskId,
                                taskName,
                                executionId
                              )
                            }
                            onViewOutput={(taskId, taskName, executionId) =>
                              handleViewOutput(
                                taskId,
                                taskName,
                                executionId,
                                env.id
                              )
                            }
                            emptyMessage="No tasks found"
                            autoOpenOnGroupStart={false} // Don't open modal when starting group in Environment
                          />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Task Output Modal */}
      <Modal
        isOpen={outputModal.isOpen}
        onClose={() => setOutputModal({ ...outputModal, isOpen: false })}
        title={outputModal.taskName}
        icon={
          <>
            <TerminalIcon
              size={20}
              className="text-neutral-500 dark:text-neutral-400"
            />
            <TaskStatusIndicator
              status={
                taskExecutions[outputModal.taskExecutionId]?.status ||
                TaskStatus.Pending
              }
              size="sm"
            />
          </>
        }
        contentClassName="p-6 bg-neutral-900 dark:bg-black"
        footer={
          <>
            <div className="text-xs text-neutral-500 dark:text-neutral-400">
              Execution ID: {outputModal.taskExecutionId}
            </div>
            <div className="flex gap-2">
              {taskExecutions[outputModal.taskExecutionId]?.status ===
                TaskStatus.Running && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    handleStopTask(
                      outputModal.environmentId,
                      outputModal.taskExecutionId
                    );
                    setOutputModal({ ...outputModal, isOpen: false });
                  }}>
                  Stop Task
                </Button>
              )}
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setOutputModal({ ...outputModal, isOpen: false })
                }>
                Close
              </Button>
            </div>
          </>
        }>
        <div ref={outputRef} className="h-full">
          <ConsoleOutput
            output={taskExecutions[outputModal.taskExecutionId]?.output || ''}
            className="h-full"
            placeholder="Waiting for output..."
          />
        </div>
      </Modal>
    </div>
  );
}

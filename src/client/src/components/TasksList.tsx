import { TaskStatus, TaskType } from '@/types/entities';
import TasksItem, { TasksItemData } from '@/components/TasksItem';
import { Button } from '@/components';
import { PlayIcon, SquareIcon, RotateCcwIcon } from 'lucide-react';
import { useTaskExecutionStore } from '@/stores/taskExecutionStore';

interface TaskExecution {
  taskExecutionId: string;
  output: string;
  status: TaskStatus;
}

interface TasksListProps {
  isSession: boolean; // Indicates if this is for session tasks
  tasks: TasksItemData[];
  loading?: Record<string, boolean>;
  taskExecutions?: Record<string, TaskExecution>;
  isReadonly?: boolean;
  onStart?: (taskId: number, taskName: string, autoOpen?: boolean) => void;
  onStop?: (executionId: string) => void;
  onRestart?: (taskId: number, taskName: string, executionId: string) => void;
  onViewOutput?: (
    taskId: number,
    taskName: string,
    executionId: string
  ) => void;
  emptyMessage?: string;
  autoOpenOnGroupStart?: boolean; // Controls whether to auto-open output when starting all tasks in a group
}

const getTypeName = (type?: TaskType | null): string => {
  if (type === null || type === undefined) {
    return 'Uncategorized';
  }
  switch (type) {
    case TaskType.Build:
      return 'Build';
    case TaskType.Test:
      return 'Test';
    case TaskType.Start:
      return 'Start';
    default:
      return 'Unknown';
  }
};

const groupTasksByType = (tasks: TasksItemData[]) => {
  const grouped = tasks.reduce(
    (acc, task) => {
      const typeName = getTypeName(task.type);
      if (!acc[typeName]) {
        acc[typeName] = [];
      }
      acc[typeName].push(task);
      return acc;
    },
    {} as Record<string, TasksItemData[]>
  );

  // Sort groups by type order: Build, Test, Start, then others
  const typeOrder = ['Build', 'Test', 'Start'];
  const sortedEntries = Object.entries(grouped).sort(([a], [b]) => {
    const aIndex = typeOrder.indexOf(a);
    const bIndex = typeOrder.indexOf(b);

    if (aIndex === -1 && bIndex === -1) return a.localeCompare(b);
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });

  return sortedEntries;
};

export default function TasksList({
  isSession,
  tasks,
  loading = {},
  taskExecutions = {},
  isReadonly = false,
  onStart,
  onStop,
  onRestart,
  onViewOutput,
  emptyMessage = 'No tasks found',
  autoOpenOnGroupStart = false
}: TasksListProps) {
  const { getTaskExecutionId } = useTaskExecutionStore();

  if (tasks.length === 0) {
    return <div className="text-neutral-500 text-sm">{emptyMessage}</div>;
  }

  const handleStartAllInGroup = async (typeTasks: TasksItemData[]) => {
    if (!onStart || isReadonly) return;

    let delay = 0;
    typeTasks.forEach((task) => {
      const mappedExecutionId = getTaskExecutionId(task.id, isSession);
      const executionId = mappedExecutionId || task.taskExecutionId;
      const taskExecution = executionId ? taskExecutions[executionId] : null;
      const currentStatus = taskExecution?.status ?? task.status;

      const canStart =
        currentStatus === TaskStatus.Pending ||
        currentStatus === TaskStatus.Failed ||
        currentStatus === TaskStatus.Completed ||
        currentStatus === TaskStatus.Canceled;

      if (canStart) {
        // Add a small delay between starts when auto-opening to prevent tab ID conflicts
        if (autoOpenOnGroupStart) {
          setTimeout(() => {
            onStart(task.id, task.name, autoOpenOnGroupStart);
          }, delay);
          delay += 100; // 100ms delay between each task start
        } else {
          onStart(task.id, task.name, autoOpenOnGroupStart); // No delay needed when not auto-opening
        }
      }
    });
  };

  const handleStopAllInGroup = (typeTasks: TasksItemData[]) => {
    if (!onStop || isReadonly) return;

    typeTasks.forEach((task) => {
      const mappedExecutionId = getTaskExecutionId(task.id, isSession);
      const executionId = mappedExecutionId || task.taskExecutionId;
      const taskExecution = executionId ? taskExecutions[executionId] : null;
      const currentStatus = taskExecution?.status ?? task.status;

      if (currentStatus === TaskStatus.Running && executionId) {
        onStop(executionId);
      }
    });
  };

  const handleRestartAllInGroup = async (typeTasks: TasksItemData[]) => {
    if (!onRestart || isReadonly) return;

    let delay = 0;
    typeTasks.forEach((task) => {
      const mappedExecutionId = getTaskExecutionId(task.id, isSession);
      const executionId = mappedExecutionId || task.taskExecutionId;
      const taskExecution = executionId ? taskExecutions[executionId] : null;
      const currentStatus = taskExecution?.status ?? task.status;

      if (currentStatus === TaskStatus.Running && executionId) {
        // Add delay for Session Tasks to prevent tab conflicts
        if (autoOpenOnGroupStart) {
          setTimeout(() => {
            onRestart(task.id, task.name, executionId);
          }, delay);
          delay += 100;
        } else {
          onRestart(task.id, task.name, executionId);
        }
      }
    });
  };

  const getGroupStats = (typeTasks: TasksItemData[]) => {
    let canStartAny = false;
    let isAnyRunning = false;

    typeTasks.forEach((task) => {
      const mappedExecutionId = getTaskExecutionId(task.id, isSession);
      const executionId = mappedExecutionId || task.taskExecutionId;
      const taskExecution = executionId ? taskExecutions[executionId] : null;
      const currentStatus = taskExecution?.status ?? task.status;

      if (currentStatus === TaskStatus.Running) {
        isAnyRunning = true;
      }

      const canStart =
        currentStatus === TaskStatus.Pending ||
        currentStatus === TaskStatus.Failed ||
        currentStatus === TaskStatus.Completed ||
        currentStatus === TaskStatus.Canceled;

      if (canStart) {
        canStartAny = true;
      }
    });

    return { canStartAny, isAnyRunning };
  };

  return (
    <div className="space-y-4">
      {groupTasksByType(tasks).map(([typeName, typeTasks]) => (
        <div key={typeName} className="space-y-2">
          <div className="group px-2 py-1 bg-neutral-100 dark:bg-neutral-700 rounded text-xs text-neutral-700 dark:text-neutral-300 flex items-center justify-between">
            <span>{typeName}</span>
            {!isReadonly &&
              (() => {
                const { canStartAny, isAnyRunning } = getGroupStats(typeTasks);
                return (
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    {canStartAny && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartAllInGroup(typeTasks);
                        }}
                        title={`Start all ${typeName.toLowerCase()} tasks`}
                        className="h-5 w-5 p-0 hover:bg-neutral-200! dark:hover:bg-neutral-600!">
                        <PlayIcon size={10} />
                      </Button>
                    )}
                    {isAnyRunning && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStopAllInGroup(typeTasks);
                        }}
                        title={`Stop all ${typeName.toLowerCase()} tasks`}
                        className="h-5 w-5 p-0 hover:bg-neutral-200! dark:hover:bg-neutral-600!">
                        <SquareIcon size={10} />
                      </Button>
                    )}
                    {isAnyRunning && onRestart && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestartAllInGroup(typeTasks);
                        }}
                        title={`Restart all ${typeName.toLowerCase()} tasks`}
                        className="h-5 w-5 p-0 hover:bg-neutral-200! dark:hover:bg-neutral-600!">
                        <RotateCcwIcon size={10} />
                      </Button>
                    )}
                  </div>
                );
              })()}
          </div>
          <div className="space-y-1 ml-2">
            {typeTasks.map((task) => {
              // First check if we have a mapped execution ID for this task
              const mappedExecutionId = getTaskExecutionId(task.id, isSession);
              const executionId = mappedExecutionId || task.taskExecutionId;
              const taskExecution = executionId
                ? taskExecutions[executionId]
                : null;

              // Use execution status if available, otherwise fall back to task status
              const currentStatus = taskExecution?.status ?? task.status;

              const isRunning = currentStatus === TaskStatus.Running;
              const canStart =
                !isReadonly &&
                (currentStatus === TaskStatus.Pending ||
                  currentStatus === TaskStatus.Failed ||
                  currentStatus === TaskStatus.Completed ||
                  currentStatus === TaskStatus.Canceled);

              const hasOutput =
                currentStatus !== TaskStatus.Pending && !!executionId;

              return (
                <TasksItem
                  key={task.id}
                  task={task}
                  executionId={executionId}
                  currentStatus={currentStatus}
                  loading={loading}
                  canStart={canStart}
                  isRunning={isRunning}
                  hasOutput={hasOutput}
                  onStart={(taskId) => onStart?.(taskId, task.name, true)} // Auto-open for individual starts
                  onStop={onStop}
                  onRestart={onRestart}
                  onViewOutput={onViewOutput}
                />
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

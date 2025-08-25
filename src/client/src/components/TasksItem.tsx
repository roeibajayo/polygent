import { Button } from '@/components';
import { TaskStatus, TaskType } from '@/types/entities';
import { PlayIcon, SquareIcon, RotateCcwIcon } from 'lucide-react';
import TaskStatusIndicator from '@/components/TaskStatusIndicator';

export interface TasksItemData {
  id: number;
  name: string;
  type?: TaskType | null;
  status: TaskStatus;
  taskExecutionId?: string;
}

interface TasksItemProps {
  task: TasksItemData;
  executionId?: string;
  currentStatus: TaskStatus;
  loading?: Record<string, boolean>;
  canStart: boolean;
  isRunning: boolean;
  hasOutput: boolean;
  onStart?: (taskId: number, taskName: string) => void;
  onStop?: (executionId: string) => void;
  onRestart?: (taskId: number, taskName: string, executionId: string) => void;
  onViewOutput?: (
    taskId: number,
    taskName: string,
    executionId: string
  ) => void;
}

export default function TasksItem({
  task,
  executionId,
  currentStatus,
  loading = {},
  canStart,
  isRunning,
  hasOutput,
  onStart,
  onStop,
  onRestart,
  onViewOutput
}: TasksItemProps) {
  const startKey = `start-${task.id}`;
  const stopKey = executionId ? `stop-${executionId}` : '';
  const restartKey = `restart-${task.id}`;

  return (
    <div
      className={`py-1 px-3 border border-neutral-200 dark:border-neutral-700 rounded ${
        hasOutput
          ? 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50 cursor-pointer'
          : ''
      }`}
      onClick={
        hasOutput && executionId && onViewOutput
          ? () => onViewOutput(task.id, task.name, executionId)
          : undefined
      }>
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <TaskStatusIndicator status={currentStatus} size="sm" />
          <div className="text-sm text-neutral-900 dark:text-neutral-100 truncate">
            {task.name}
          </div>
        </div>

        <div className="flex flex-shrink-0">
          {canStart && onStart && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStart(task.id, task.name);
              }}
              disabled={loading[startKey]}
              title="Start task">
              <PlayIcon size={12} />
            </Button>
          )}

          {isRunning && executionId && onStop && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onStop(executionId);
              }}
              disabled={loading[stopKey]}
              title="Stop task">
              <SquareIcon size={12} />
            </Button>
          )}

          {isRunning && executionId && onRestart && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onRestart(task.id, task.name, executionId);
              }}
              disabled={loading[restartKey]}
              title="Restart task">
              <RotateCcwIcon size={12} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

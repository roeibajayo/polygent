import { Badge, Button } from '@/components';
import { Play, Square, Check, X, AlertCircle } from 'lucide-react';
import { Task, TaskStatus } from '@/types';

interface TaskItemProps {
  task: Task;
  status?: TaskStatus;
  onExecute: (taskId: number) => void;
  onStop: (taskId: number) => void;
  onOpenOutput: (taskId: number, taskName: string) => void;
}

export default function TaskItem({
  task,
  status,
  onExecute,
  onStop,
  onOpenOutput
}: TaskItemProps) {
  // Handle undefined status explicitly
  const actualStatus = status ?? TaskStatus.Pending;
  const getStatusIcon = () => {
    switch (actualStatus) {
      case TaskStatus.Running:
        return <Square className="w-4 h-4 text-orange-600" />;
      case TaskStatus.Completed:
        return <Check className="w-4 h-4 text-green-600" />;
      case TaskStatus.Failed:
        return <X className="w-4 h-4 text-red-600" />;
      case TaskStatus.Canceled:
        return <AlertCircle className="w-4 h-4 text-neutral-600" />;
      default:
        return <Play className="w-4 h-4 text-purple-600" />;
    }
  };

  const getStatusBadge = () => {
    switch (actualStatus) {
      case TaskStatus.Running:
        return (
          <Badge variant="warning" size="sm">
            Running
          </Badge>
        );
      case TaskStatus.Completed:
        return (
          <Badge variant="success" size="sm">
            Completed
          </Badge>
        );
      case TaskStatus.Failed:
        return (
          <Badge variant="error" size="sm">
            Failed
          </Badge>
        );
      case TaskStatus.Canceled:
        return (
          <Badge variant="default" size="sm">
            Canceled
          </Badge>
        );
      default:
        return (
          <Badge variant="default" size="sm">
            Pending
          </Badge>
        );
    }
  };

  const canExecute =
    actualStatus === TaskStatus.Pending ||
    actualStatus === TaskStatus.Failed ||
    actualStatus === TaskStatus.Completed;
  const canStop = actualStatus === TaskStatus.Running;

  return (
    <div className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-neutral-700 rounded hover:bg-neutral-100 dark:hover:bg-neutral-600">
      <div
        className="flex items-center space-x-2 flex-1"
        onClick={() => onOpenOutput(task.id, task.name)}>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
          <span className="text-sm text-neutral-700 dark:text-neutral-200 truncate">
            {task.name}
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2">
        {getStatusBadge()}

        {canExecute && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onExecute(task.id);
            }}
            className="p-1 h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900">
            <Play className="w-3 h-3" />
          </Button>
        )}

        {canStop && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onStop(task.id);
            }}
            className="p-1 h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900">
            <Square className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}

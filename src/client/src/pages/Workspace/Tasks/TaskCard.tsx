import { Button, Badge } from '@/components';
import {
  Edit3,
  Trash2,
  Play,
  Terminal,
  FileText,
  Settings,
  Copy
} from 'lucide-react';
import { Task, TaskType, ScriptType } from '@/types';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (taskId: number, taskName: string) => void;
  onClone: (task: Task) => void;
  onExecute?: (task: Task) => void;
}

const getTypeIcon = (type: TaskType | null) => {
  if (type === null) {
    return <Terminal className="w-5 h-5 text-neutral-600" />;
  }
  switch (type) {
    case TaskType.Build:
      return <Settings className="w-5 h-5 text-purple-600" />;
    case TaskType.Test:
      return <FileText className="w-5 h-5 text-green-600" />;
    case TaskType.Start:
      return <Play className="w-5 h-5 text-purple-600" />;
    default:
      return <Terminal className="w-5 h-5 text-neutral-600" />;
  }
};

const getTypeColor = (type: TaskType | null) => {
  if (type === null) {
    return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
  }
  switch (type) {
    case TaskType.Build:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    case TaskType.Test:
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case TaskType.Start:
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
    default:
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
  }
};

const getTypeName = (type: TaskType | null) => {
  if (type === null) {
    return 'No Uncategorized';
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

const getScriptTypeColor = (scriptType: ScriptType) => {
  switch (scriptType) {
    case ScriptType.Bash:
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
    case ScriptType.PowerShell:
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
    case ScriptType.NodeJs:
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300';
    default:
      return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
  }
};

export default function TaskCard({
  task,
  onEdit,
  onDelete,
  onClone,
  onExecute
}: TaskCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-neutral-100 dark:bg-neutral-700 rounded-lg">
            {getTypeIcon(task.type)}
          </div>
          <div>
            <h3 className="text-lg text-neutral-900 dark:text-neutral-100">
              {task.name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge className={getTypeColor(task.type)}>
                {getTypeName(task.type)}
              </Badge>
              <Badge className={getScriptTypeColor(task.scriptType)}>
                {ScriptType[task.scriptType]}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {onExecute && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onExecute(task)}
              className="text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:text-green-300 dark:hover:bg-green-900"
              title="Execute task">
              <Play className="w-4 h-4" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClone(task)}
            title="Clone task">
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(task)}
            title="Edit task">
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(task.id, task.name)}
            title="Delete task">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400 pt-2 border-t border-neutral-200 dark:border-neutral-600">
        <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
        <span>Updated: {new Date(task.updatedAt).toLocaleDateString()}</span>
      </div>
    </div>
  );
}

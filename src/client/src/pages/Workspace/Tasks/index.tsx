import { Task } from '@/types';
import TaskCard from './TaskCard';

interface TasksViewProps {
  tasks: Task[];
  loading: boolean;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: number, taskName: string) => void;
  onCloneTask: (task: Task) => void;
}

export default function TasksView({
  tasks,
  loading,
  onEditTask,
  onDeleteTask,
  onCloneTask
}: TasksViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading tasks...</div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-500 dark:text-neutral-400 mb-4">
          No tasks found
        </div>
      </div>
    );
  }

  return tasks.map((task) => (
    <TaskCard
      key={task.id}
      task={task}
      onEdit={onEditTask}
      onDelete={onDeleteTask}
      onClone={onCloneTask}
    />
  ));
}

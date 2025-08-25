import TaskStatusIndicator from '@/components/TaskStatusIndicator';
import { ConsoleOutput } from '@/components';
import { TaskContent } from '../useSession';
import { useWorkspaceStore } from '@/stores';

interface TaskViewProps {
  tabId: string;
}

export default function TaskView({ tabId }: TaskViewProps) {
  const { getTabContentById, activeSessionId } = useWorkspaceStore();
  const content = getTabContentById(activeSessionId!, tabId) as TaskContent;

  // Return early if content is not available
  if (!content || content.type !== 'task') {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500">
        Content not available
      </div>
    );
  }
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TaskStatusIndicator status={content.status} size="lg" />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {content.name}
            </h2>
          </div>

          <div className="flex items-center gap-4 text-sm text-neutral-500 dark:text-neutral-400">
            {content.startTime && (
              <span>Started: {formatTime(content.startTime)}</span>
            )}
            {content.endTime && (
              <span>Ended: {formatTime(content.endTime)}</span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 p-6 min-h-0">
        <ConsoleOutput output={content.output} className="h-full break-words" />
      </div>
    </div>
  );
}

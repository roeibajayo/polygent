import { TaskStatus } from '@/types';
import LoadingSpinner from './LoadingSpinner';

export default function TaskStatusIndicator({
  status,
  size
}: {
  status: TaskStatus;
  size: 'sm' | 'lg';
}) {
  return (
    <div
      className={
        'flex items-center justify-center ' + (size === 'lg' ? 'w-5' : 'w-3')
      }>
      {status === TaskStatus.Running ? (
        <LoadingSpinner size={'sm'} />
      ) : (
        <div
          className={`w-2 h-2 rounded-full ${
            status === TaskStatus.Completed
              ? 'bg-green-500'
              : status === TaskStatus.Failed
                ? 'bg-red-500'
                : 'bg-neutral-400'
          }`}
        />
      )}
    </div>
  );
}

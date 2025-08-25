import { MessageStatus, MessageType } from '@/types';
import LoadingSpinner from './LoadingSpinner';
import { ClockIcon } from 'lucide-react';

export default function MessageStatusIndicator({
  status,
  size = 'sm'
}: {
  status: MessageStatus;
  type: MessageType;
  size?: 'sm' | 'lg';
}) {
  if (status === MessageStatus.Done) return null;

  return (
    <div
      className={
        'flex items-center justify-center ' + (size === 'lg' ? 'w-5' : 'w-3')
      }>
      {status === MessageStatus.Working ? (
        <LoadingSpinner size={'sm'} />
      ) : status === MessageStatus.Pending ? (
        <ClockIcon />
      ) : (
        <div
          className={`w-2 h-2 rounded-full ${
            (status as MessageStatus) === MessageStatus.Done
              ? 'bg-green-500'
              : status === MessageStatus.Failed
                ? 'bg-red-500'
                : 'bg-neutral-400'
          }`}
        />
      )}
    </div>
  );
}

import { Session, SessionStatus } from '@/types';
import LoadingSpinner from './LoadingSpinner';

export default function SessionStatusIndicator({
  session
}: {
  session: Session;
}) {
  return (
    <>
      {session.hasUnreadMessage && (
        <div className={`w-2 h-2 rounded-full bg-green-500`} />
      )}
      {session.status === SessionStatus.InProgress && (
        <LoadingSpinner size="sm" />
      )}
    </>
  );
}

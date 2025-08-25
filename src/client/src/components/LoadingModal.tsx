import LoadingSpinner from './LoadingSpinner';
import { Modal } from '@/components';

interface LoadingModalProps {
  isOpen: boolean;
  title: string;
  message?: string;
}

export default function LoadingModal({
  isOpen,
  title,
  message
}: LoadingModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}}
      title={title}
      size="sm"
      contentClassName="p-6">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mx-auto mb-4" />
        {message && (
          <p className="text-sm text-neutral-600 dark:text-neutral-400">{message}</p>
        )}
      </div>
    </Modal>
  );
}

import { useState, useEffect } from 'react';
import { Button } from '@/components';
import { Session } from '@/types';

interface SessionRenameModalProps {
  isOpen: boolean;
  session: Session | undefined;
  onClose: () => void;
  onRename: (name: string) => Promise<void>;
}

export default function SessionRenameModal({
  isOpen,
  session,
  onClose,
  onRename
}: SessionRenameModalProps) {
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset name when modal opens/closes or session changes
  useEffect(() => {
    if (isOpen && session) {
      setName(session.name || '');
    }
  }, [isOpen, session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !session || name.trim() === session.name) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onRename(name.trim());
      onClose();
    } catch (error) {
      console.error('Failed to rename session:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setName(session?.name || '');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleCancel}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
            Rename Session
          </h3>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label
                htmlFor="session-name"
                className="block text-sm text-neutral-700 dark:text-neutral-300 mb-2">
                Session Name
              </label>
              <input
                id="session-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter session name..."
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-transparent"
                autoFocus
                disabled={isSubmitting}
                maxLength={100}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleCancel}
                disabled={isSubmitting}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  isSubmitting || !name.trim() || name.trim() === session?.name
                }>
                {isSubmitting ? 'Renaming...' : 'Rename'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

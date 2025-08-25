import { useState, useEffect, useRef } from 'react';
import { Button, Modal } from '@/components';

interface RenameModalProps {
  isOpen: boolean;
  currentName: string;
  onConfirm: (newName: string) => void;
  onCancel: () => void;
  title?: string;
}

export default function RenameModal({
  isOpen,
  currentName,
  onConfirm,
  onCancel,
  title = 'Rename'
}: RenameModalProps) {
  const [newName, setNewName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setNewName(currentName);
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          // Select filename without extension
          const lastDotIndex = currentName.lastIndexOf('.');
          if (lastDotIndex > 0) {
            inputRef.current.setSelectionRange(0, lastDotIndex);
          } else {
            inputRef.current.select();
          }
        }
      }, 100);
    }
  }, [isOpen, currentName]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName.trim() && newName !== currentName) {
      onConfirm(newName.trim());
    } else {
      onCancel();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      size="sm"
      contentClassName="p-6"
      footer={
        <div className="flex justify-end space-x-3">
          <Button type="button" onClick={onCancel} variant="outline">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={!newName.trim() || newName === currentName}
            onClick={handleSubmit}>
            Rename
          </Button>
        </div>
      }>
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
          placeholder="Enter new name..."
        />
      </form>
    </Modal>
  );
}

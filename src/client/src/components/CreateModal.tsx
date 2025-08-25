import { useState, useEffect } from 'react';
import { Button, Modal } from '@/components';

interface CreateModalProps {
  isOpen: boolean;
  title: string;
  placeholder: string;
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function CreateModal({
  isOpen,
  title,
  placeholder,
  onConfirm,
  onCancel
}: CreateModalProps) {
  const [inputValue, setInputValue] = useState('');

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onConfirm(inputValue.trim());
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
            disabled={!inputValue.trim()}
            onClick={handleSubmit}>
            Create
          </Button>
        </div>
      }>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-transparent"
          autoFocus
        />
      </form>
    </Modal>
  );
}

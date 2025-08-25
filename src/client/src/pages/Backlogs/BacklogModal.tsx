import { Button, Modal } from '@/components';
import { Backlog, BacklogStatus, Workspace } from '@/types';
import { useState } from 'react';
import TagsAutocompleteInput from './TagsAutocompleteInput';

interface BacklogFormData {
  title: string;
  description: string;
  status: BacklogStatus;
  tags: string[];
  workspaceId?: number;
  sessionId?: number;
}

interface BacklogModalProps {
  isOpen: boolean;
  selectedBacklog: Backlog | null;
  formData: BacklogFormData;
  setFormData: (data: BacklogFormData) => void;
  onSave: () => void;
  onClose: () => void;
  availableTags: string[];
  workspaces: Workspace[];
}

interface ValidationErrors {
  title?: string;
}

export default function BacklogModal({
  isOpen,
  selectedBacklog,
  formData,
  setFormData,
  onSave,
  onClose,
  availableTags,
  workspaces
}: BacklogModalProps) {
  const [errors, setErrors] = useState<ValidationErrors>({});

  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must be 255 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = () => {
    if (validateForm()) {
      onSave();
      setErrors({});
    }
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={selectedBacklog ? 'Edit Backlog' : 'Create Backlog'}
      size="sm"
      contentClassName="p-6"
      footer={
        <div className="flex gap-2">
          <Button onClick={handleSave}>
            {selectedBacklog ? 'Update' : 'Create'}
          </Button>
          <Button variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
        </div>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Title
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) =>
              setFormData({ ...formData, title: e.target.value })
            }
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 ${
              errors.title
                ? 'border-red-500 dark:border-red-400 focus:ring-red-500'
                : 'border-neutral-300 dark:border-neutral-600'
            }`}
            placeholder="Enter backlog title"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.title}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            rows={3}
            placeholder="Enter backlog description"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Workspace (optional)
          </label>
          <select
            value={formData.workspaceId || ''}
            onChange={(e) =>
              setFormData({
                ...formData,
                workspaceId: e.target.value
                  ? parseInt(e.target.value)
                  : undefined
              })
            }
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">
            <option value="">No workspace</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Tags
          </label>
          <TagsAutocompleteInput
            selectedTags={formData.tags || []}
            availableTags={availableTags}
            onChange={(tags) => setFormData({ ...formData, tags })}
            placeholder="Type to add tags (press Enter, Tab, or comma to add)"
          />
        </div>
      </div>
    </Modal>
  );
}

import { Button, Modal } from '@/components';
import { Workspace } from '@/types';

interface WorkspaceFormData {
  name: string;
  gitRepository: string;
}

interface WorkspaceFormModalProps {
  isOpen: boolean;
  workspace: Workspace | null;
  formData: WorkspaceFormData;
  setFormData: (data: WorkspaceFormData) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function WorkspaceFormModal({
  isOpen,
  workspace,
  formData,
  setFormData,
  onSave,
  onCancel
}: WorkspaceFormModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={workspace ? 'Edit Workspace' : 'Create Workspace'}
      size="sm"
      contentClassName="p-6"
      footer={
        <div className="flex gap-2">
          <Button onClick={onSave}>{workspace ? 'Update' : 'Create'}</Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            placeholder="Enter workspace name"
          />
        </div>

        {!workspace && (
          <div>
            <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
              Git Repository
            </label>
            <input
              type="text"
              value={formData.gitRepository}
              onChange={(e) =>
                setFormData({ ...formData, gitRepository: e.target.value })
              }
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
              placeholder="https://github.com/user/repo.git"
            />
          </div>
        )}
      </div>
    </Modal>
  );
}

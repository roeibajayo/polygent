import { Button, Modal } from '@/components';
import { Workspace } from '@/types';

interface BulkWorkspaceModalProps {
  isOpen: boolean;
  selectedCount: number;
  bulkWorkspaceId: number | undefined;
  setBulkWorkspaceId: (workspaceId: number | undefined) => void;
  workspaces: Workspace[];
  onSave: () => void;
  onClose: () => void;
}

export default function BulkWorkspaceModal({
  isOpen,
  selectedCount,
  bulkWorkspaceId,
  setBulkWorkspaceId,
  workspaces,
  onSave,
  onClose
}: BulkWorkspaceModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Set Workspace for ${selectedCount} Backlogs`}
      size="sm"
      contentClassName="p-6"
      footer={
        <div className="flex gap-2">
          <Button onClick={onSave}>Set Workspace</Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Workspace
          </label>
          <select
            value={bulkWorkspaceId || ''}
            onChange={(e) =>
              setBulkWorkspaceId(
                e.target.value ? parseInt(e.target.value) : undefined
              )
            }
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">
            <option value="">No workspace</option>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            This workspace will be assigned to all {selectedCount} selected
            backlogs.
          </p>
        </div>
      </div>
    </Modal>
  );
}

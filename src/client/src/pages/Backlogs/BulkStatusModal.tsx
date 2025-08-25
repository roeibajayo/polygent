import { Button, Modal } from '@/components';
import { BacklogStatus } from '@/types';

interface BulkStatusModalProps {
  isOpen: boolean;
  selectedCount: number;
  bulkStatus: BacklogStatus;
  setBulkStatus: (status: BacklogStatus) => void;
  onSave: () => void;
  onClose: () => void;
}

export default function BulkStatusModal({
  isOpen,
  selectedCount,
  bulkStatus,
  setBulkStatus,
  onSave,
  onClose
}: BulkStatusModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Change Status of ${selectedCount} Backlogs`}
      size="sm"
      contentClassName="p-6"
      footer={
        <div className="flex gap-2">
          <Button onClick={onSave}>Change Status</Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            New Status
          </label>
          <select
            value={bulkStatus}
            onChange={(e) =>
              setBulkStatus(parseInt(e.target.value) as BacklogStatus)
            }
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">
            <option value={BacklogStatus.InMind}>In mind</option>
            <option value={BacklogStatus.Ready}>Ready</option>
            <option value={BacklogStatus.InProgress}>In Progress</option>
            <option value={BacklogStatus.Done}>Done</option>
            <option value={BacklogStatus.Canceled}>Canceled</option>
          </select>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            This status will be applied to all {selectedCount} selected
            backlogs.
          </p>
        </div>
      </div>
    </Modal>
  );
}

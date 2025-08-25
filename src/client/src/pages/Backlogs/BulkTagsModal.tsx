import { Button, Modal } from '@/components';
import TagsAutocompleteInput from './TagsAutocompleteInput';

interface BulkTagsModalProps {
  isOpen: boolean;
  selectedCount: number;
  bulkTags: string[];
  setBulkTags: (tags: string[]) => void;
  availableTags: string[];
  onSave: () => void;
  onClose: () => void;
}

export default function BulkTagsModal({
  isOpen,
  selectedCount,
  bulkTags,
  setBulkTags,
  availableTags,
  onSave,
  onClose
}: BulkTagsModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Add Tags to ${selectedCount} Backlogs`}
      size="sm"
      contentClassName="p-6"
      footer={
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={bulkTags.length === 0}>
            Add Tags
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Tags to Add
          </label>
          <TagsAutocompleteInput
            selectedTags={bulkTags}
            availableTags={availableTags}
            onChange={setBulkTags}
            placeholder="Type to add tags to selected backlogs"
          />
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            These tags will be added to all {selectedCount} selected backlogs.
          </p>
        </div>
      </div>
    </Modal>
  );
}

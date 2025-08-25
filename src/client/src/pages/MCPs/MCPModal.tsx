import { Button, Modal } from '@/components';
import { MCP, MCPType } from '@/types';

interface MCPFormData {
  name: string;
  description: string;
  type: MCPType;
  path: string;
}

interface FieldErrors {
  name?: string;
  type?: string;
  path?: string;
}

interface MCPModalProps {
  isOpen: boolean;
  selectedMCP: MCP | null;
  formData: MCPFormData;
  error?: string | null;
  fieldErrors?: FieldErrors;
  onFormDataChange: (data: MCPFormData) => void;
  onFieldErrorClear?: (field: keyof FieldErrors) => void;
  onSave: () => void;
  onClose: () => void;
  onErrorDismiss?: () => void;
}

export default function MCPModal({
  isOpen,
  selectedMCP,
  formData,
  error,
  fieldErrors = {},
  onFormDataChange,
  onFieldErrorClear,
  onSave,
  onClose,
  onErrorDismiss
}: MCPModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedMCP ? 'Edit MCP' : 'Add MCP'}
      size="sm"
      contentClassName="p-6"
      footer={
        <div className="flex gap-2">
          <Button onClick={onSave}>{selectedMCP ? 'Update' : 'Add'}</Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }>
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
          <div className="flex justify-between items-center">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            {onErrorDismiss && (
              <button
                onClick={onErrorDismiss}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200">
                ×
              </button>
            )}
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              onFormDataChange({ ...formData, name: e.target.value });
              if (fieldErrors.name && onFieldErrorClear) {
                onFieldErrorClear('name');
              }
            }}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 ${
              fieldErrors.name
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                : 'border-neutral-300 dark:border-neutral-600'
            }`}
            placeholder="Enter MCP name"
          />
          {fieldErrors.name && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {fieldErrors.name}
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
              onFormDataChange({ ...formData, description: e.target.value })
            }
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            rows={3}
            placeholder="Describe what this MCP does"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Type
          </label>
          <select
            value={formData.type}
            onChange={(e) => {
              onFormDataChange({ ...formData, type: +e.target.value });
              if (fieldErrors.type && onFieldErrorClear) {
                onFieldErrorClear('type');
              }
            }}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 ${
              fieldErrors.type
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                : 'border-neutral-300 dark:border-neutral-600'
            }`}>
            <option value="">Select MCP type</option>
            <option value="1">HTTP Streaming</option>
            <option value="2">SSE (Server-Sent Events)</option>
            <option value="3">STDIO</option>
          </select>
          {fieldErrors.type && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {fieldErrors.type}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Path
          </label>
          <input
            type="text"
            value={formData.path}
            onChange={(e) => {
              onFormDataChange({ ...formData, path: e.target.value });
              if (fieldErrors.path && onFieldErrorClear) {
                onFieldErrorClear('path');
              }
            }}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 ${
              fieldErrors.path
                ? 'border-red-500 dark:border-red-500 focus:ring-red-500'
                : 'border-neutral-300 dark:border-neutral-600'
            }`}
            placeholder="Path to MCP package or executable"
          />
          {fieldErrors.path && (
            <p className="text-sm text-red-600 dark:text-red-400 mt-1">
              {fieldErrors.path}
            </p>
          )}
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Can be a local path, npm package, or URL
          </p>
        </div>
      </div>
    </Modal>
  );
}

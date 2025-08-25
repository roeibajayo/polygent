import { Button, Modal, GitBranchSelector } from '@/components';
import { Environment, Workspace } from '@/types';
import { Plus, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';

interface EnvironmentFormData {
  name: string;
  gitBranch: string;
  url?: string;
  environmentVariables: Record<string, string>;
}

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
}

interface EnvironmentFormModalProps {
  isOpen: boolean;
  environment: Environment | null;
  formData: EnvironmentFormData;
  setFormData: (data: EnvironmentFormData) => void;
  onSave: () => void;
  onCancel: () => void;
  workspace: Workspace;
  isLoading?: boolean;
}

export default function EnvironmentFormModal({
  isOpen,
  environment,
  formData,
  setFormData,
  onSave,
  onCancel,
  workspace,
  isLoading = false
}: EnvironmentFormModalProps) {
  // Local state for environment variables to avoid the key editing bug
  const [environmentVariables, setEnvironmentVariables] = useState<
    EnvironmentVariable[]
  >([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize environment variables from formData when modal opens
  useEffect(() => {
    if (isOpen && !isInitialized) {
      const envVars = Object.entries(formData.environmentVariables || {}).map(
        ([key, value], index) => ({
          id: `${Date.now()}-${index}-${key}`, // Unique ID for each variable
          key,
          value
        })
      );
      setEnvironmentVariables(envVars);
      setIsInitialized(true);
    } else if (!isOpen) {
      setIsInitialized(false);
    }
  }, [isOpen, formData.environmentVariables, isInitialized]);

  // Function to sync environment variables back to formData
  const syncToFormData = (variables: EnvironmentVariable[]) => {
    const newRecord: Record<string, string> = {};

    variables.forEach((variable) => {
      if (variable.key.trim()) {
        // Only include variables with non-empty keys
        newRecord[variable.key] = variable.value;
      }
    });

    setFormData({
      ...formData,
      environmentVariables: newRecord
    });
  };

  const isEditing = !!environment;

  // Check for duplicate keys
  const getDuplicateKeys = () => {
    const keyCount: Record<string, number> = {};
    environmentVariables.forEach((variable) => {
      if (variable.key.trim()) {
        keyCount[variable.key] = (keyCount[variable.key] || 0) + 1;
      }
    });
    return new Set(Object.keys(keyCount).filter((key) => keyCount[key] > 1));
  };

  const duplicateKeys = getDuplicateKeys();
  const isNameValid = formData.name.trim().length > 0;
  const canSave =
    isNameValid && formData.gitBranch && duplicateKeys.size === 0 && !isLoading;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={isEditing ? 'Edit Environment' : 'Create Environment'}
      size="md"
      contentClassName="p-6"
      footer={
        <div className="flex gap-2">
          <Button onClick={onSave} disabled={!canSave} loading={isLoading}>
            {isEditing ? 'Update' : 'Create'}
          </Button>
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
            className={`w-full px-3 py-2 border rounded-md text-neutral-900 dark:text-neutral-100 ${
              isLoading
                ? 'bg-neutral-100 dark:bg-neutral-600 border-neutral-200 dark:border-neutral-500 cursor-not-allowed opacity-50'
                : !isNameValid && formData.name.length > 0
                  ? 'bg-white dark:bg-neutral-700 border-red-300 dark:border-red-600 focus:ring-red-500'
                  : 'bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600'
            }`}
            placeholder="e.g., Development, Staging, Production"
            disabled={isLoading}
            required
          />
          {!isNameValid && formData.name.length > 0 && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Environment name is required
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Git Branch
          </label>
          {isEditing ? (
            <div>
              <input
                type="text"
                value={formData.gitBranch}
                disabled={true}
                className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-neutral-100 dark:bg-neutral-600 text-neutral-900 dark:text-neutral-100 opacity-50 cursor-not-allowed"
              />
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Git branch cannot be changed after creation
              </p>
            </div>
          ) : (
            <GitBranchSelector
              workspaceId={workspace.id}
              value={formData.gitBranch}
              onSelect={(branch) =>
                setFormData({ ...formData, gitBranch: branch })
              }
              placeholder="Select git branch"
              autoSelectDefault={!formData.gitBranch}
            />
          )}
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            URL (optional)
          </label>
          <input
            type="url"
            value={formData.url || ''}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md text-neutral-900 dark:text-neutral-100 ${
              isLoading
                ? 'bg-neutral-100 dark:bg-neutral-600 border-neutral-200 dark:border-neutral-500 cursor-not-allowed opacity-50'
                : 'bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600'
            }`}
            placeholder="https://example.com"
            disabled={isLoading}
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Environment Variables
          </label>
          <div className="space-y-2">
            {environmentVariables.map((variable) => (
              <div key={variable.id} className="flex gap-2">
                <input
                  type="text"
                  value={variable.key}
                  onChange={(e) => {
                    const newVariables = environmentVariables.map((v) =>
                      v.id === variable.id ? { ...v, key: e.target.value } : v
                    );
                    setEnvironmentVariables(newVariables);
                    syncToFormData(newVariables);
                  }}
                  className={`flex-1 px-3 py-2 border rounded-md text-neutral-900 dark:text-neutral-100 ${
                    isLoading
                      ? 'bg-neutral-100 dark:bg-neutral-600 border-neutral-200 dark:border-neutral-500 cursor-not-allowed opacity-50'
                      : variable.key.trim() && duplicateKeys.has(variable.key)
                        ? 'bg-white dark:bg-neutral-700 border-orange-300 dark:border-orange-600 focus:ring-orange-500'
                        : 'bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600'
                  }`}
                  placeholder="Variable name"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  value={variable.value}
                  onChange={(e) => {
                    const newVariables = environmentVariables.map((v) =>
                      v.id === variable.id ? { ...v, value: e.target.value } : v
                    );
                    setEnvironmentVariables(newVariables);
                    syncToFormData(newVariables);
                  }}
                  className={`flex-1 px-3 py-2 border rounded-md text-neutral-900 dark:text-neutral-100 ${
                    isLoading
                      ? 'bg-neutral-100 dark:bg-neutral-600 border-neutral-200 dark:border-neutral-500 cursor-not-allowed opacity-50'
                      : 'bg-white dark:bg-neutral-700 border-neutral-300 dark:border-neutral-600'
                  }`}
                  placeholder="Variable value"
                  disabled={isLoading}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={isLoading}
                  onClick={() => {
                    const newVariables = environmentVariables.filter(
                      (v) => v.id !== variable.id
                    );
                    setEnvironmentVariables(newVariables);
                    syncToFormData(newVariables);
                  }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              disabled={isLoading}
              onClick={() => {
                const newVariable: EnvironmentVariable = {
                  id: `${Date.now()}-${Math.random()}`, // Unique ID
                  key: '',
                  value: ''
                };
                const newVariables = [...environmentVariables, newVariable];
                setEnvironmentVariables(newVariables);
                // Don't sync immediately for empty variables - let user type first
              }}
              icon={<Plus size={12} />}>
              Add Variable
            </Button>
            {duplicateKeys.size > 0 && (
              <div className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                ⚠️ Warning: Duplicate variable names detected. Only the last
                value will be saved for: {Array.from(duplicateKeys).join(', ')}
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

import { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Button, ConfirmDialog, Modal } from '@/components';
import { Plus, Trash2, Edit3, Key } from 'lucide-react';
import { workspaceEnvironmentVariablesApi } from '@/api';
import {
  Workspace,
  WorkspaceEnvironmentVariable,
  CreateWorkspaceEnvironmentVariable,
  UpdateWorkspaceEnvironmentVariable
} from '@/types';

interface EnvironmentVariableFormData {
  key: string;
  value: string;
}

export interface EnvironmentVariablesRef {
  addVariable: () => void;
}

interface WorkspaceEnvironmentVariablesViewProps {
  workspace: Workspace;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

const WorkspaceEnvironmentVariablesView = forwardRef<
  EnvironmentVariablesRef,
  WorkspaceEnvironmentVariablesViewProps
>(({ workspace }, ref) => {
  const [variables, setVariables] = useState<WorkspaceEnvironmentVariable[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [formData, setFormData] = useState<EnvironmentVariableFormData>({
    key: '',
    value: ''
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    loadVariables();
  }, [workspace.id]);

  const loadVariables = async () => {
    setLoading(true);
    try {
      const response = await workspaceEnvironmentVariablesApi.getByWorkspaceId(
        workspace.id
      );
      setVariables(response);
    } catch (error) {
      console.error('Failed to load workspace environment variables:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVariables = variables;

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!formData.key.trim()) {
      errors.key = 'Variable name is required';
    } else if (formData.key.length > 255) {
      errors.key = 'Variable name must be 255 characters or less';
    } else if (!editingKey && variables.some((v) => v.key === formData.key)) {
      errors.key = 'Variable name already exists';
    }

    if (!formData.value.trim()) {
      errors.value = 'Variable value is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = () => {
    setEditingKey(null);
    setFormData({ key: '', value: '' });
    setFormErrors({});
    setShowForm(true);
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    addVariable: handleCreate
  }));

  const handleEdit = (variable: WorkspaceEnvironmentVariable) => {
    setEditingKey(variable.key);
    setFormData({ key: variable.key, value: variable.value });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      if (editingKey) {
        // Update existing variable
        const updateData: UpdateWorkspaceEnvironmentVariable = {
          value: formData.value
        };
        const updated = await workspaceEnvironmentVariablesApi.update(
          workspace.id,
          editingKey,
          updateData
        );
        setVariables((prev) =>
          prev.map((v) => (v.key === editingKey ? updated : v))
        );
      } else {
        // Create new variable
        const createData: CreateWorkspaceEnvironmentVariable = {
          key: formData.key,
          value: formData.value
        };
        const created = await workspaceEnvironmentVariablesApi.create(
          workspace.id,
          createData
        );
        setVariables((prev) => [...prev, created]);
      }

      setShowForm(false);
      setEditingKey(null);
    } catch (error) {
      console.error('Failed to save workspace environment variable:', error);
      setFormErrors({ general: 'Failed to save variable. Please try again.' });
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await workspaceEnvironmentVariablesApi.delete(workspace.id, key);
      setVariables((prev) => prev.filter((v) => v.key !== key));
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
      });
    } catch (error) {
      console.error('Failed to delete workspace environment variable:', error);
    }
  };

  const handleDeleteConfirm = (variable: WorkspaceEnvironmentVariable) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Environment Variable',
      message: `Are you sure you want to delete "${variable.key}"? This action cannot be undone.`,
      onConfirm: () => handleDelete(variable.key)
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-lg">Loading environment variables...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {variables.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-neutral-500 dark:text-neutral-400 mb-4">
            No environment variables found
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVariables.map((variable) => (
            <div
              key={variable.key}
              className="flex items-center p-4 border bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-600 rounded-lg">
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-neutral-900 dark:text-neutral-100 mb-1">
                    Variable Name
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 font-mono bg-neutral-100 dark:bg-neutral-600 px-2 py-1 rounded">
                    {variable.key}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-neutral-900 dark:text-neutral-100 mb-1">
                    Variable Value
                  </div>
                  <div className="text-sm text-neutral-600 dark:text-neutral-400 font-mono bg-neutral-100 dark:bg-neutral-600 px-2 py-1 rounded break-all">
                    {variable.value}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 ml-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEdit(variable)}
                  title="Edit variable">
                  <Edit3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteConfirm(variable)}
                  title="Delete variable">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        title={editingKey ? 'Edit Variable' : 'Add Variable'}
        size="sm"
        contentClassName="p-6"
        footer={
          <div className="flex gap-2">
            <Button onClick={handleSave}>
              {editingKey ? 'Update' : 'Create'}
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
          </div>
        }>
        {formErrors.general && (
          <div className="mb-4 p-2 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded text-red-700 dark:text-red-300 text-sm">
            {formErrors.general}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
              Variable Name
            </label>
            <input
              type="text"
              value={formData.key}
              onChange={(e) =>
                setFormData({ ...formData, key: e.target.value })
              }
              disabled={!!editingKey}
              placeholder="Variable name (e.g., DATABASE_URL)"
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 ${
                formErrors.key
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-neutral-300 dark:border-neutral-600'
              } ${
                editingKey
                  ? 'opacity-50 cursor-not-allowed bg-neutral-100 dark:bg-neutral-600'
                  : ''
              }`}
            />
            {formErrors.key && (
              <p className="text-red-500 text-xs mt-1">{formErrors.key}</p>
            )}
            {editingKey && (
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Variable name cannot be changed when editing
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
              Variable Value
            </label>
            <input
              type="text"
              value={formData.value}
              onChange={(e) =>
                setFormData({ ...formData, value: e.target.value })
              }
              placeholder="Variable value"
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 ${
                formErrors.value
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-neutral-300 dark:border-neutral-600'
              }`}
            />
            {formErrors.value && (
              <p className="text-red-500 text-xs mt-1">{formErrors.value}</p>
            )}
          </div>
        </div>
      </Modal>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: () => {}
          });
        }}
        onCancel={() =>
          setConfirmDialog({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: () => {}
          })
        }
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
});

WorkspaceEnvironmentVariablesView.displayName =
  'WorkspaceEnvironmentVariablesView';

export default WorkspaceEnvironmentVariablesView;

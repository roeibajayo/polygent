import { Button, Modal } from '@/components';
import { TaskType, ScriptType } from '@/types';

interface TaskFormData {
  name: string;
  type: TaskType | null;
  workingDirectory: string;
  scriptType: ScriptType;
  scriptContent: string;
}

interface FormErrors {
  name?: string;
  scriptContent?: string;
}

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedTask: any;
  formData: TaskFormData;
  formErrors: FormErrors;
  setFormData: (data: TaskFormData) => void;
}

export default function TaskModal({
  isOpen,
  onClose,
  onSave,
  selectedTask,
  formData,
  formErrors,
  setFormData
}: TaskModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedTask ? 'Edit Task' : 'Create Task'}
      size="xl"
      contentClassName="p-6"
      footer={
        <div className="flex gap-2">
          <Button onClick={onSave}>{selectedTask ? 'Update' : 'Create'}</Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }>
      <div className="space-y-6 h-full flex flex-col">
        {/* 2x2 Grid for Name, Type, Script Type, Working Directory */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 ${
                formErrors.name
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-neutral-300 dark:border-neutral-600'
              }`}
              placeholder="Enter task name"
            />
            {formErrors.name && (
              <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
              Type
            </label>
            <select
              value={formData.type ?? ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  type:
                    e.target.value === '' ? null : (+e.target.value as TaskType)
                })
              }
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">
              <option value="">Uncategorized</option>
              {Object.values(TaskType)
                .filter((type) => !isNaN(Number(type)))
                .map((type) => (
                  <option key={type} value={type}>
                    {getTypeName(+type)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
              Script Type *
            </label>
            <select
              value={formData.scriptType}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  scriptType: +e.target.value as ScriptType
                })
              }
              className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100">
              {Object.values(ScriptType)
                .filter((type) => !isNaN(Number(type)))
                .map((type) => (
                  <option key={type} value={type}>
                    {getScriptTypeName(+type)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
              <span>Working Directory </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                Relative paths are relative to the workspace root
              </span>
            </label>
            <input
              type="text"
              value={formData.workingDirectory}
              onChange={(e) =>
                setFormData({ ...formData, workingDirectory: e.target.value })
              }
              className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono border-neutral-300 dark:border-neutral-600`}
              placeholder="e.g., /path/to/project or ./src"
            />
          </div>
        </div>

        {/* Script Content - Full Width at Bottom */}
        <div className="flex-1 flex flex-col">
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Script Content *
          </label>
          <textarea
            value={formData.scriptContent}
            onChange={(e) =>
              setFormData({ ...formData, scriptContent: e.target.value })
            }
            className={`w-full flex-1 px-3 py-2 border rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 font-mono text-sm ${
              formErrors.scriptContent
                ? 'border-red-500 focus:ring-red-500'
                : 'border-neutral-300 dark:border-neutral-600'
            }`}
            rows={12}
            placeholder={getScriptPlaceholder(formData.scriptType)}
          />
          {formErrors.scriptContent && (
            <p className="text-red-500 text-sm mt-1">
              {formErrors.scriptContent}
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
}

function getScriptTypeName(type: ScriptType) {
  switch (type) {
    case ScriptType.Bash:
      return 'Bash';
    case ScriptType.PowerShell:
      return 'PowerShell';
    case ScriptType.NodeJs:
      return 'Node.js';
    default:
      return 'Unknown';
  }
}

function getTypeName(type: TaskType | null) {
  if (type === null) {
    return 'Uncategorized';
  }
  switch (type) {
    case TaskType.Build:
      return 'Build';
    case TaskType.Test:
      return 'Test';
    case TaskType.Start:
      return 'Start';
    default:
      return 'Unknown';
  }
}

function getScriptPlaceholder(scriptType: ScriptType) {
  switch (scriptType) {
    case ScriptType.Bash:
      return '#!/bin/bash\n\n# Example: Build script\nnpm install\nnpm run build';
    case ScriptType.PowerShell:
      return '# PowerShell script\n# Example: Build script\nnpm install\nnpm run build';
    case ScriptType.NodeJs:
      return '// Node.js script\n// Example: Build script\nconsole.log("Starting build...");\nprocess.exit(0);';
    default:
      return 'Enter your script content here...';
  }
}

import { Button, Modal } from '@/components';
import { MCP } from '@/types';

interface AgentFormData {
  name: string;
  roleName: string;
  model: string;
  systemPrompt: string;
  mcpIds: number[];
  mcps: string[];
}

interface FormErrors {
  name?: string;
  model?: string;
}

interface AgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  selectedAgent: any;
  formData: AgentFormData;
  formErrors: FormErrors;
  mcps: MCP[];
  setFormData: (data: AgentFormData) => void;
}

export default function AgentModal({
  isOpen,
  onClose,
  onSave,
  selectedAgent,
  formData,
  formErrors,
  mcps,
  setFormData
}: AgentModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={selectedAgent ? 'Edit Agent' : 'Create Agent'}
      size="md"
      contentClassName="p-6"
      footer={
        <div className="flex gap-2">
          <Button onClick={onSave}>
            {selectedAgent ? 'Update' : 'Create'}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 ${
              formErrors.name
                ? 'border-red-500 focus:ring-red-500'
                : 'border-neutral-300 dark:border-neutral-600'
            }`}
            placeholder="Enter agent name"
            required
          />
          {formErrors.name && (
            <p className="text-red-500 text-sm mt-1">{formErrors.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Role Name
          </label>
          <input
            type="text"
            value={formData.roleName}
            onChange={(e) =>
              setFormData({ ...formData, roleName: e.target.value })
            }
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            placeholder="e.g., Frontend Developer, QA Engineer"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Model *
          </label>
          <select
            value={formData.model}
            onChange={(e) =>
              setFormData({ ...formData, model: e.target.value })
            }
            required
            className={`w-full px-3 py-2 border rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 ${
              formErrors.model
                ? 'border-red-500 focus:ring-red-500'
                : 'border-neutral-300 dark:border-neutral-600'
            }`}>
            <option value="">Select a model</option>
            <option value="claude-code">Claude Code</option>
            {/* <option value="gemini-cli-pro-2.5">Gemini 2.5 Pro</option>
            <option value="gemini-cli-flash-2.5">Gemini 2.5 Flash</option> */}
          </select>
          {formErrors.model && (
            <p className="text-red-500 text-sm mt-1">{formErrors.model}</p>
          )}
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            System Prompt
          </label>
          <textarea
            value={formData.systemPrompt}
            onChange={(e) =>
              setFormData({ ...formData, systemPrompt: e.target.value })
            }
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100"
            rows={6}
            placeholder="Enter the system prompt that defines the agent's behavior and role"
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            MCPs
          </label>
          <div className="space-y-2 max-h-32 overflow-y-auto border border-neutral-300 dark:border-neutral-600 rounded-md p-2 bg-white dark:bg-neutral-700">
            {mcps.map((mcp) => (
              <label key={mcp.id} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.mcpIds.includes(mcp.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFormData({
                        ...formData,
                        mcpIds: [...formData.mcpIds, mcp.id]
                      });
                    } else {
                      setFormData({
                        ...formData,
                        mcpIds: formData.mcpIds.filter((id) => id !== mcp.id)
                      });
                    }
                  }}
                  className="rounded border-neutral-300 text-purple-600"
                />
                <span className="text-sm text-neutral-900 dark:text-neutral-100">
                  {mcp.name}
                </span>
              </label>
            ))}
            {mcps.length === 0 && (
              <div className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-2">
                No MCPs available
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}

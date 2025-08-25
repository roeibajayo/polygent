import { useAgents } from './useAgents';
import { Button, ConfirmDialog } from '@/components';
import { Plus } from 'lucide-react';
import AgentModal from './AgentModal';
import AgentCard from './AgentCard';

export default function Agents() {
  const {
    agents,
    mcps,
    loading,
    selectedAgent,
    showForm,
    formData,
    formErrors,
    setFormData,
    handleSave,
    handleDeleteConfirm,
    handleModalClose,
    handleEdit,
    handleCreate,
    confirmDialog,
    setConfirmDialog
  } = useAgents();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading agents...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Agents
          </h1>
          <Button onClick={handleCreate} icon={<Plus size={12} />}>
            Create Agent
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-500 dark:text-neutral-400 mb-4">
              No agents found
            </div>
            <Button onClick={handleCreate} icon={<Plus size={12} />}>
              Create your first agent
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {agents?.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onEdit={handleEdit}
                onDelete={handleDeleteConfirm}
              />
            ))}
          </div>
        )}
      </div>

      <AgentModal
        isOpen={showForm}
        onClose={handleModalClose}
        onSave={handleSave}
        selectedAgent={selectedAgent}
        formData={formData}
        formErrors={formErrors}
        mcps={mcps}
        setFormData={setFormData}
      />

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
}

import { useWorkspaces } from './useWorkspaces';
import {
  Button,
  WorkspaceCard,
  WorkspaceFormModal,
  ConfirmDialog,
  AlertDialog
} from '@/components';
import { Plus } from 'lucide-react';

export default function Workspaces() {
  const {
    workspaces,
    loading,
    selectedWorkspace,
    showForm,
    formData,
    setFormData,
    setShowForm,
    setSelectedWorkspace,
    handleSave,
    handleDelete,
    handleEdit,
    handleCreate,
    confirmDialog,
    setConfirmDialog,
    isWorkspaceLimitReached,
    alertDialog,
    handleAlertConfirm
  } = useWorkspaces();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading workspaces...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Workspaces
          </h1>
          <Button
            onClick={handleCreate}
            disabled={isWorkspaceLimitReached}
            title={
              isWorkspaceLimitReached
                ? 'Maximum of 1 workspace allowed'
                : 'Create a new workspace'
            }
            icon={<Plus size={12} />}>
            Create Workspace
            {isWorkspaceLimitReached && ' (Limit Reached)'}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {workspaces.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-500 dark:text-neutral-400 mb-4">
              No workspaces found
            </div>
            <Button onClick={handleCreate} icon={<Plus size={12} />}>
              Create your first workspace
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workspaces.map((workspace) => (
              <WorkspaceCard
                key={workspace.id}
                workspace={workspace}
                onEdit={handleEdit}
                onDelete={(id) =>
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Delete Workspace',
                    message: `Are you sure you want to delete "${workspace.name}"? This will also delete all associated sessions, environments, and tasks.`,
                    onConfirm: () => handleDelete(id)
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <WorkspaceFormModal
        isOpen={showForm}
        workspace={selectedWorkspace}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        onCancel={() => {
          setShowForm(false);
          setSelectedWorkspace(null);
        }}
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

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        confirmText={alertDialog.confirmText}
        variant={alertDialog.variant}
        onConfirm={handleAlertConfirm}
      />
    </div>
  );
}

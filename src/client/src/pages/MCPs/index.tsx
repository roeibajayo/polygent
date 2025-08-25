import { useMCPs } from './useMCPs';
import { Button, ConfirmDialog } from '@/components';
import { Plus } from 'lucide-react';
import MCPCard from './MCPCard';
import MCPModal from './MCPModal';

export default function MCPs() {
  const {
    mcps,
    loading,
    error,
    setError,
    fieldErrors,
    handleFieldErrorClear,
    selectedMCP,
    showForm,
    formData,
    setFormData,
    setShowForm,
    setSelectedMCP,
    handleSave,
    handleDelete,
    handleEdit,
    handleCreate,
    confirmDialog,
    setConfirmDialog
  } = useMCPs();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading MCPs...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              MCPs
            </h1>
            <p className="text-neutral-600 dark:text-neutral-300 mt-1">
              Model Context Protocols
            </p>
          </div>
          <Button onClick={handleCreate} icon={<Plus size={12} />}>
            Add MCP
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex justify-between items-center">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setError(null)}
                className="text-red-600 dark:text-red-400">
                ×
              </Button>
            </div>
          </div>
        )}

        {mcps.length === 0 && !loading ? (
          <div className="text-center py-12">
            <div className="text-neutral-500 dark:text-neutral-400 mb-4">
              No MCPs found
            </div>
            <Button onClick={handleCreate} icon={<Plus size={12} />}>
              Add your first MCP
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mcps.map((mcp) => (
              <MCPCard
                key={mcp.id}
                mcp={mcp}
                onEdit={handleEdit}
                onDelete={(id) =>
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Delete MCP',
                    message: `Are you sure you want to delete "${mcp.name}"? This action cannot be undone.`,
                    onConfirm: () => handleDelete(id)
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <MCPModal
        isOpen={showForm}
        selectedMCP={selectedMCP}
        formData={formData}
        error={error}
        fieldErrors={fieldErrors}
        onFormDataChange={setFormData}
        onFieldErrorClear={handleFieldErrorClear}
        onSave={handleSave}
        onClose={() => {
          setShowForm(false);
          setSelectedMCP(null);
          setError(null);
        }}
        onErrorDismiss={() => setError(null)}
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

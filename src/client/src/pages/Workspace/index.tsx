import { useRef } from 'react';
import { useWorkspace } from './useWorkspace';
import {
  EnvironmentFormModal,
  ConfirmDialog,
  WorkspaceFormModal,
  AlertDialog,
  Button
} from '@/components';
import Environments from './Environments';
import EnvironmentVariables, {
  EnvironmentVariablesRef
} from './EnvironmentVariables';
import Tasks from './Tasks';
import WorkspaceHeader from './WorkspaceHeader';
import TaskModal from './Tasks/TaskModal';
import { Server, Terminal, Key, Plus } from 'lucide-react';

export default function Workspace() {
  const environmentVariablesRef = useRef<EnvironmentVariablesRef>(null);

  const {
    // Workspace data
    workspace,
    workspaceLoading,
    workspaceForm,
    showWorkspaceForm,
    setShowWorkspaceForm,
    handleWorkspaceEdit,
    handleWorkspaceSave,
    setWorkspaceForm,

    // Environment data
    environments,
    environmentsLoading,
    environmentSaving,
    selectedEnvironment,
    showEnvironmentForm,
    environmentFormData,
    setEnvironmentFormData,
    setShowEnvironmentForm,
    setSelectedEnvironment,
    handleEnvironmentSave,
    handleEnvironmentDelete,
    handleEnvironmentEdit,
    handleEnvironmentCreate,

    // Task data
    tasks,
    tasksLoading,
    selectedTask,
    showTaskForm,
    taskFormData,
    taskFormErrors,
    setTaskFormData,
    handleCreateTask,
    handleEditTask,
    handleCloneTask,
    handleSaveTask,
    handleDeleteTaskConfirm,
    handleTaskModalClose,

    // UI state
    confirmDialog,
    setConfirmDialog,

    // Limits
    isEnvironmentLimitReached,

    // Alert dialog
    alertDialog,
    handleAlertConfirm
  } = useWorkspace();

  if (workspaceLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading workspace...</div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg text-red-600">Workspace not found</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      <WorkspaceHeader
        workspace={workspace}
        onWorkspaceEdit={handleWorkspaceEdit}
      />

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-auto p-6">
        {/* Environments Section */}
        <section>
          <div className="flex items-center justify-between mb-6 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Server className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Environments
              </h2>
            </div>
            <Button
              onClick={handleEnvironmentCreate}
              disabled={isEnvironmentLimitReached}
              title={
                isEnvironmentLimitReached
                  ? 'Maximum of 1 environment allowed per workspace'
                  : 'Create a new environment'
              }
              icon={<Plus size={12} />}>
              Create Environment
              {isEnvironmentLimitReached && ' (Limit Reached)'}
            </Button>
          </div>
          <Environments
            environments={environments}
            loading={environmentsLoading}
            onEditEnvironment={handleEnvironmentEdit}
            onDeleteEnvironment={(id, name) =>
              setConfirmDialog({
                isOpen: true,
                title: 'Delete Environment',
                message: `Are you sure you want to delete "${name}"? This action cannot be undone.`,
                onConfirm: () => handleEnvironmentDelete(id)
              })
            }
            onCloneEnvironment={(environment) => {
              // Create a copy of the environment for cloning
              setEnvironmentFormData({
                name: `${environment.name} Copy`,
                gitBranch: environment.gitBranch,
                url: environment.url || '',
                environmentVariables: { ...environment.environmentVariables }
              });
              setSelectedEnvironment(null); // Ensure it's treated as a new environment
              setShowEnvironmentForm(true);
            }}
          />
        </section>

        {/* Tasks Section */}
        <section>
          <div className="flex items-center justify-between mb-6 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <Terminal className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Tasks
              </h2>
            </div>
            <Button onClick={handleCreateTask} icon={<Plus size={12} />}>
              Create Task
            </Button>
          </div>
          <Tasks
            tasks={tasks}
            loading={tasksLoading}
            onEditTask={handleEditTask}
            onDeleteTask={handleDeleteTaskConfirm}
            onCloneTask={handleCloneTask}
          />
        </section>

        {/* Environment Variables Section */}
        <section>
          <div className="flex items-center justify-between mb-6 gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <Key className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                Environment Variables
              </h2>
            </div>
            <Button
              onClick={() => environmentVariablesRef.current?.addVariable()}
              icon={<Plus size={12} />}>
              Add Variable
            </Button>
          </div>
          <EnvironmentVariables
            ref={environmentVariablesRef}
            workspace={workspace}
          />
        </section>
      </div>

      {/* Workspace Form Modal */}
      <WorkspaceFormModal
        isOpen={showWorkspaceForm}
        workspace={workspace}
        formData={workspaceForm}
        setFormData={setWorkspaceForm}
        onSave={handleWorkspaceSave}
        onCancel={() => setShowWorkspaceForm(false)}
      />

      {/* Environment Form Modal */}
      <EnvironmentFormModal
        isOpen={showEnvironmentForm}
        environment={selectedEnvironment}
        formData={environmentFormData}
        setFormData={setEnvironmentFormData}
        onSave={handleEnvironmentSave}
        onCancel={() => {
          setShowEnvironmentForm(false);
          setSelectedEnvironment(null);
        }}
        workspace={workspace}
        isLoading={environmentSaving}
      />

      {/* Task Modal */}
      <TaskModal
        isOpen={showTaskForm}
        onClose={handleTaskModalClose}
        onSave={handleSaveTask}
        selectedTask={selectedTask}
        formData={taskFormData}
        formErrors={taskFormErrors}
        setFormData={setTaskFormData}
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

import { useState } from 'react';
import { Workspace, CreateWorkspace, UpdateWorkspace } from '@/types';
import { workspacesApi } from '@/api';
import { useWorkspaceStore } from '@/stores';
import { useAlertDialog } from '@/hooks';

interface WorkspaceFormData {
  name: string;
  gitRepository: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function useWorkspaces() {
  const { workspaces, addWorkspace, updateWorkspace, removeWorkspace } =
    useWorkspaceStore();
  const { alertDialog, showAlert, handleConfirm: handleAlertConfirm } = useAlertDialog();
  const [loading, setLoading] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(
    null
  );
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<WorkspaceFormData>({
    name: '',
    gitRepository: ''
  });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  const handleCreate = () => {
    // Check workspace limit (max 1 workspace allowed)
    if (workspaces.length >= 1) {
      setConfirmDialog({
        isOpen: true,
        title: 'Workspace Limit Reached',
        message: 'You can only create 1 workspace. Please delete the existing workspace first to create a new one.',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setSelectedWorkspace(null);
    setFormData({
      name: '',
      gitRepository: ''
    });
    setShowForm(true);
  };

  const handleEdit = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setFormData({
      name: workspace.name,
      gitRepository: workspace.gitRepository
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (selectedWorkspace) {
        const updateData: UpdateWorkspace = {
          name: formData.name
        };
        const updatedWorkspace = await workspacesApi.update(
          selectedWorkspace.id,
          updateData
        );
        updateWorkspace(selectedWorkspace.id, updatedWorkspace);
      } else {
        const createData: CreateWorkspace = {
          name: formData.name,
          gitRepository: formData.gitRepository
        };
        const newWorkspace = await workspacesApi.create(createData);
        addWorkspace(newWorkspace);
      }
      setShowForm(false);
      setSelectedWorkspace(null);
    } catch (error: any) {
      console.error('Failed to save workspace:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to save workspace. Please try again.';
      showAlert({
        title: 'Error',
        message: errorMessage,
        variant: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    setLoading(true);
    try {
      await workspacesApi.delete(id);
      removeWorkspace(id);
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
      });
    } catch (error) {
      console.error('Failed to delete workspace:', error);
    } finally {
      setLoading(false);
    }
  };

  const isWorkspaceLimitReached = workspaces.length >= 1;

  return {
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
  };
}

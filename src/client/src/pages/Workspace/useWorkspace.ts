import { useState, useEffect } from 'react';
import {
  Environment,
  Task,
  CreateTask,
  UpdateTask,
  TaskType,
  ScriptType,
  Workspace,
  UpdateWorkspace
} from '@/types';
import { environmentsApi } from '@/api/environments';
import { tasksApi, workspacesApi } from '@/api';
import { useWorkspaceStore } from '@/stores/workspaceStore';
import { useEnvironmentStore } from '@/stores/environmentStore';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';
import { useAlertDialog } from '@/hooks';
import { useParams } from 'react-router-dom';

interface WorkspaceFormData {
  name: string;
  gitRepository: string;
}

interface EnvironmentFormData {
  name: string;
  gitBranch: string;
  url?: string;
  environmentVariables: Record<string, string>;
}

interface TaskFormData {
  name: string;
  type: TaskType | null;
  workingDirectory: string;
  scriptType: ScriptType;
  scriptContent: string;
}

interface TaskFormErrors {
  name?: string;
  scriptContent?: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function useWorkspace() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const { workspaces, updateWorkspace } = useWorkspaceStore();
  const { addEnvironment, updateEnvironment, removeEnvironment } =
    useEnvironmentStore();
  const { alertDialog, showAlert, handleConfirm: handleAlertConfirm } = useAlertDialog();

  // Workspace state
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [workspaceLoading, setWorkspaceLoading] = useState(true);
  const [workspaceForm, setWorkspaceForm] = useState<WorkspaceFormData>({
    name: '',
    gitRepository: ''
  });
  const [showWorkspaceForm, setShowWorkspaceForm] = useState(false);

  // Environment state - using global store
  const { environments, loading: environmentsLoading } = useEnvironments({
    workspaceId: +workspaceId!,
    autoLoad: true
  });
  const [environmentSaving, setEnvironmentSaving] = useState(false);

  // Task state - using workspace tasks hook for automatic refresh
  const { refreshTasks: refreshWorkspaceTasks } = useWorkspaceTasks(
    +workspaceId!
  );
  const [selectedEnvironment, setSelectedEnvironment] =
    useState<Environment | null>(null);
  const [showEnvironmentForm, setShowEnvironmentForm] = useState(false);
  const [environmentFormData, setEnvironmentFormData] =
    useState<EnvironmentFormData>({
      name: '',
      gitBranch: '',
      url: '',
      environmentVariables: {}
    });

  // Task state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskFormData, setTaskFormData] = useState<TaskFormData>({
    name: '',
    type: null,
    workingDirectory: '',
    scriptType: ScriptType.Bash,
    scriptContent: ''
  });
  const [taskFormErrors, setTaskFormErrors] = useState<TaskFormErrors>({});

  // UI state
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    if (workspaceId) {
      loadWorkspace();
      loadTasks();
    }
  }, [workspaceId]);

  const loadWorkspace = async () => {
    if (!workspaceId) return;

    setWorkspaceLoading(true);
    try {
      // Try to find in store first
      const foundWorkspace = workspaces.find(
        (w) => w.id === Number(workspaceId)
      );
      if (foundWorkspace) {
        setWorkspace(foundWorkspace);
      } else {
        // Fetch from API if not in store
        const workspaceData = await workspacesApi.getById(Number(workspaceId));
        setWorkspace(workspaceData);
      }
    } catch (error) {
      console.error('Failed to load workspace:', error);
    } finally {
      setWorkspaceLoading(false);
    }
  };

  const loadTasks = async () => {
    if (!workspaceId) {
      setTasksLoading(false);
      return;
    }

    setTasksLoading(true);
    try {
      const tasksData = await tasksApi.getByWorkspaceId(Number(workspaceId));
      setTasks(tasksData);
    } catch (error) {
      console.error('Failed to load tasks:', error);
    } finally {
      setTasksLoading(false);
    }
  };

  // Workspace handlers
  const handleWorkspaceEdit = () => {
    if (!workspace) return;

    setWorkspaceForm({
      name: workspace.name,
      gitRepository: workspace.gitRepository
    });
    setShowWorkspaceForm(true);
  };

  const handleWorkspaceSave = async () => {
    if (!workspace) return;

    try {
      const updateData: UpdateWorkspace = {
        name: workspaceForm.name
      };
      const updatedWorkspace = await workspacesApi.update(
        workspace.id,
        updateData
      );
      setWorkspace(updatedWorkspace);
      updateWorkspace(workspace.id, updatedWorkspace);
      setShowWorkspaceForm(false);
    } catch (error) {
      console.error('Failed to update workspace:', error);
    }
  };

  // Environment handlers
  const handleEnvironmentCreate = () => {
    // Check environment limit (max 1 environment per workspace)
    if (environments.length >= 1) {
      setConfirmDialog({
        isOpen: true,
        title: 'Environment Limit Reached',
        message: 'You can only create 1 environment per workspace. Please delete the existing environment first to create a new one.',
        onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }

    setSelectedEnvironment(null);
    setEnvironmentFormData({
      name: '',
      gitBranch: '',
      url: '',
      environmentVariables: {}
    });
    setShowEnvironmentForm(true);
  };

  const handleEnvironmentEdit = (environment: Environment) => {
    setSelectedEnvironment(environment);
    setEnvironmentFormData({
      name: environment.name,
      gitBranch: environment.gitBranch,
      url: environment.url || '',
      environmentVariables: environment.environmentVariables
    });
    setShowEnvironmentForm(true);
  };

  const handleEnvironmentSave = async () => {
    if (!workspaceId) {
      console.error('No workspace ID available');
      return;
    }

    setEnvironmentSaving(true);
    try {
      const numericWorkspaceId = Number(workspaceId);

      if (selectedEnvironment) {
        // Update existing environment
        const updatedEnvironment = await environmentsApi.update(
          selectedEnvironment.id,
          {
            name: environmentFormData.name,
            url: environmentFormData.url,
            environmentVariables: environmentFormData.environmentVariables
          }
        );
        updateEnvironment(numericWorkspaceId, updatedEnvironment);
      } else {
        // Create new environment
        const newEnvironment = await environmentsApi.create(
          numericWorkspaceId,
          {
            name: environmentFormData.name,
            gitBranch: environmentFormData.gitBranch,
            url: environmentFormData.url,
            environmentVariables: environmentFormData.environmentVariables
          }
        );
        addEnvironment(numericWorkspaceId, newEnvironment);
      }

      setShowEnvironmentForm(false);
      setSelectedEnvironment(null);
    } catch (error: any) {
      console.error('Failed to save environment:', error);
      const errorMessage = error?.message || error?.response?.data?.message || 'Failed to save environment. Please try again.';
      showAlert({
        title: 'Error',
        message: errorMessage,
        variant: 'danger'
      });
    } finally {
      setEnvironmentSaving(false);
    }
  };

  const handleEnvironmentDelete = async (id: number) => {
    if (!workspaceId) return;

    try {
      await environmentsApi.delete(id);
      removeEnvironment(Number(workspaceId), id);
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
      });
    } catch (error) {
      console.error('Failed to delete environment:', error);
    }
  };

  // Task handlers
  const handleCreateTask = () => {
    setSelectedTask(null);
    setTaskFormData({
      name: '',
      type: null,
      workingDirectory: '',
      scriptType: ScriptType.Bash,
      scriptContent: ''
    });
    setTaskFormErrors({});
    setShowTaskForm(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setTaskFormData({
      name: task.name,
      type: task.type,
      workingDirectory: task.workingDirectory,
      scriptType: task.scriptType,
      scriptContent: task.scriptContent
    });
    setTaskFormErrors({});
    setShowTaskForm(true);
  };

  const handleCloneTask = (task: Task) => {
    setSelectedTask(null);
    setTaskFormData({
      name: `${task.name} Copy`,
      type: task.type,
      workingDirectory: task.workingDirectory,
      scriptType: task.scriptType,
      scriptContent: task.scriptContent
    });
    setTaskFormErrors({});
    setShowTaskForm(true);
  };

  const validateTaskForm = (): boolean => {
    const errors: TaskFormErrors = {};

    if (!taskFormData.name.trim()) {
      errors.name = 'Task name is required';
    }

    if (!taskFormData.scriptContent.trim()) {
      errors.scriptContent = 'Script content is required';
    }

    setTaskFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveTask = async () => {
    if (!validateTaskForm() || !workspaceId) return;

    try {
      if (selectedTask) {
        const updateData: UpdateTask = {
          name: taskFormData.name,
          type: taskFormData.type,
          workingDirectory: taskFormData.workingDirectory,
          scriptType: taskFormData.scriptType,
          scriptContent: taskFormData.scriptContent
        };
        const updatedTask = await tasksApi.update(selectedTask.id, updateData);
        setTasks((prev) =>
          prev.map((t) => (t.id === selectedTask.id ? updatedTask : t))
        );

        // Refresh workspace tasks to trigger environment panel update
        refreshWorkspaceTasks(true);
      } else {
        const createData: CreateTask = {
          name: taskFormData.name,
          type: taskFormData.type,
          workingDirectory: taskFormData.workingDirectory,
          scriptType: taskFormData.scriptType,
          scriptContent: taskFormData.scriptContent
        };
        const newTask = await tasksApi.create(Number(workspaceId), createData);
        setTasks((prev) => [...prev, newTask]);
      }

      // Refresh workspace tasks to trigger environment panel update
      refreshWorkspaceTasks(true);

      setShowTaskForm(false);
      setSelectedTask(null);
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await tasksApi.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));

      // Refresh workspace tasks to trigger environment panel update
      refreshWorkspaceTasks(true);

      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
      });
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleDeleteTaskConfirm = (taskId: number, taskName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Task',
      message: `Are you sure you want to delete "${taskName}"? This action cannot be undone.`,
      onConfirm: () => handleDeleteTask(taskId)
    });
  };

  const handleTaskModalClose = () => {
    setShowTaskForm(false);
    setSelectedTask(null);
  };

  return {
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
    handleSaveTask,
    handleCloneTask,
    handleDeleteTaskConfirm,
    handleTaskModalClose,

    // UI state
    confirmDialog,
    setConfirmDialog,
    
    // Limits
    isEnvironmentLimitReached: environments.length >= 1,
    
    // Alert dialog
    alertDialog,
    handleAlertConfirm
  };
}

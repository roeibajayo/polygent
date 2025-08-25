import { useState, useEffect } from 'react';
import { tasksApi } from '../api/tasks';
import type { Task } from '../types/entities';

export function useWorkspaceTasks(workspaceId: number | null) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const fetchTasks = async (silent?: boolean) => {
    if (!workspaceId) {
      setTasks([]);
      setLoading(false);
      return;
    }

    try {
      if (!silent) setLoading(true);
      setError(null);
      const workspaceTasks = await tasksApi.getByWorkspaceId(workspaceId);
      setTasks(workspaceTasks);
      setLastUpdate(Date.now());
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch workspace tasks'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [workspaceId]);

  const refreshTasks = (silent?: boolean) => {
    fetchTasks(silent);
  };

  return {
    tasks,
    loading,
    error,
    refreshTasks,
    lastUpdate,
    taskCount: tasks.length
  };
}

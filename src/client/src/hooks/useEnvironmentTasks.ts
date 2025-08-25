import { useState, useEffect } from 'react';
import { environmentsApi } from '../api/environments';
import type { EnvironmentTask } from '../types/entities';

export function useEnvironmentTasks(environmentId: number) {
  const [tasks, setTasks] = useState<EnvironmentTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async (silent?: boolean) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const environmentTasks = await environmentsApi.getTasks(environmentId);
      setTasks(environmentTasks);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch environment tasks'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (environmentId) {
      fetchTasks();
    }
  }, [environmentId]);

  const refreshTasks = (silent?: boolean) => {
    fetchTasks(silent);
  };

  return {
    tasks,
    loading,
    error,
    refreshTasks
  };
}

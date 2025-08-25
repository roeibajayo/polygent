import { useState, useEffect } from 'react';
import { sessionsApi } from '../api/sessions';
import type { SessionTask } from '../types/entities';

export function useSessionTasks(sessionId: number) {
  const [tasks, setTasks] = useState<SessionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = async (silent?: boolean) => {
    try {
      if (!silent) setLoading(true);
      setError(null);
      const sessionTasks = await sessionsApi.getTasks(sessionId);
      setTasks(sessionTasks);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch session tasks'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (sessionId) {
      fetchTasks();
    }
  }, [sessionId]);

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

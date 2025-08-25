import { useEffect } from 'react';
import { useEnvironmentStore } from '@/stores';

interface UseEnvironmentsOptions {
  workspaceId: number;
  autoLoad?: boolean;
}

/**
 * Hook to manage environments for a specific workspace
 */
export function useEnvironments({
  workspaceId,
  autoLoad = true
}: UseEnvironmentsOptions) {
  const { getEnvironmentsByWorkspace, loadEnvironments, isLoading, getError } =
    useEnvironmentStore();

  const environments = getEnvironmentsByWorkspace(workspaceId);
  const loading = isLoading(workspaceId);
  const error = getError(workspaceId);

  useEffect(() => {
    if (
      autoLoad &&
      workspaceId &&
      environments === undefined &&
      !loading
    ) {
      loadEnvironments(workspaceId);
    }
  }, [autoLoad, workspaceId, environments, loading, loadEnvironments]);

  const refetch = () => {
    if (workspaceId) {
      loadEnvironments(workspaceId);
    }
  };

  return {
    environments: environments ?? [],
    loading,
    error,
    refetch
  };
}

export default useEnvironments;

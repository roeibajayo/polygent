import { create } from 'zustand';
import { Environment } from '@/types/entities';
import { environmentsApi } from '@/api';

interface EnvironmentState {
  environmentsByWorkspace: Record<number, Environment[]>;
  loading: Record<number, boolean>;
  error: Record<number, string | null>;
}

interface EnvironmentActions {
  loadEnvironments: (workspaceId: number) => Promise<void>;
  setEnvironments: (workspaceId: number, environments: Environment[]) => void;
  addEnvironment: (workspaceId: number, environment: Environment) => void;
  updateEnvironment: (workspaceId: number, environment: Environment) => void;
  removeEnvironment: (workspaceId: number, environmentId: number) => void;
  clearEnvironments: (workspaceId: number) => void;
  getEnvironmentsByWorkspace: (
    workspaceId: number
  ) => Environment[] | undefined;
  getEnvironmentById: (environmentId: number) => Environment | undefined;
  isLoading: (workspaceId: number) => boolean;
  getError: (workspaceId: number) => string | null;
}

type EnvironmentStore = EnvironmentState & EnvironmentActions;

export const useEnvironmentStore = create<EnvironmentStore>((set, get) => ({
  environmentsByWorkspace: {},
  loading: {},
  error: {},

  loadEnvironments: async (workspaceId: number) => {
    set((state) => ({
      loading: { ...state.loading, [workspaceId]: true },
      error: { ...state.error, [workspaceId]: null }
    }));

    try {
      const environments = await environmentsApi.getByWorkspaceId(workspaceId);
      set((state) => ({
        environmentsByWorkspace: {
          ...state.environmentsByWorkspace,
          [workspaceId]: environments || []
        },
        loading: { ...state.loading, [workspaceId]: false }
      }));
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load environments';
      set((state) => ({
        loading: { ...state.loading, [workspaceId]: false },
        error: { ...state.error, [workspaceId]: errorMessage }
      }));
    }
  },

  setEnvironments: (workspaceId: number, environments: Environment[]) => {
    set((state) => ({
      environmentsByWorkspace: {
        ...state.environmentsByWorkspace,
        [workspaceId]: environments
      }
    }));
  },

  addEnvironment: (workspaceId: number, environment: Environment) => {
    set((state) => {
      const currentEnvironments =
        state.environmentsByWorkspace[workspaceId] || [];
      return {
        environmentsByWorkspace: {
          ...state.environmentsByWorkspace,
          [workspaceId]: [...currentEnvironments, environment]
        }
      };
    });
  },

  updateEnvironment: (workspaceId: number, environment: Environment) => {
    set((state) => {
      const currentEnvironments =
        state.environmentsByWorkspace[workspaceId] || [];
      return {
        environmentsByWorkspace: {
          ...state.environmentsByWorkspace,
          [workspaceId]: currentEnvironments.map((env) =>
            env.id === environment.id ? environment : env
          )
        }
      };
    });
  },

  removeEnvironment: (workspaceId: number, environmentId: number) => {
    set((state) => {
      const currentEnvironments =
        state.environmentsByWorkspace[workspaceId] || [];
      return {
        environmentsByWorkspace: {
          ...state.environmentsByWorkspace,
          [workspaceId]: currentEnvironments.filter(
            (env) => env.id !== environmentId
          )
        }
      };
    });
  },

  clearEnvironments: (workspaceId: number) => {
    set((state) => ({
      environmentsByWorkspace: {
        ...state.environmentsByWorkspace,
        [workspaceId]: []
      }
    }));
  },

  getEnvironmentsByWorkspace: (workspaceId: number) => {
    return get().environmentsByWorkspace[workspaceId];
  },

  getEnvironmentById: (environmentId: number) => {
    const { environmentsByWorkspace } = get();
    for (const workspaceEnvironments of Object.values(
      environmentsByWorkspace
    )) {
      const environment = workspaceEnvironments.find(
        (env) => env.id === environmentId
      );
      if (environment) return environment;
    }
    return undefined;
  },

  isLoading: (workspaceId: number) => {
    return get().loading[workspaceId] || false;
  },

  getError: (workspaceId: number) => {
    return get().error[workspaceId] || null;
  }
}));

export default useEnvironmentStore;

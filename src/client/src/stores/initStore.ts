import { create } from 'zustand';
import { startupApi } from '@/api';
import { Editor } from '@/types';
import { useWorkspaceStore } from './workspaceStore';
import { useEnvironmentStore } from './environmentStore';

interface InitState {
  editors: Editor[];
  isInitialized: boolean;
  isInitializing: boolean;
  initError: string | null;
}

interface InitActions {
  initialize: () => Promise<void>;
  clearInitError: () => void;
}

export const useInitStore = create<InitState & InitActions>((set, get) => ({
  editors: [],
  isInitialized: false,
  isInitializing: false,
  initError: null,

  initialize: async () => {
    const { isInitialized, isInitializing } = get();

    // Don't initialize if already done or currently initializing
    if (isInitialized || isInitializing) {
      return;
    }

    set({ isInitializing: true, initError: null });

    try {
      // Load startup data (workspaces, environments, and editors)
      const startupData = await startupApi.getStartupData();
      
      // Update stores with startup data
      const workspaceStore = useWorkspaceStore.getState();
      const environmentStore = useEnvironmentStore.getState();
      
      // Set workspaces
      workspaceStore.setWorkspaces(startupData.workspaces);
      
      // Set environments grouped by workspace
      const environmentsByWorkspace: Record<number, any[]> = {};
      startupData.environments.forEach(env => {
        if (!environmentsByWorkspace[env.workspaceId]) {
          environmentsByWorkspace[env.workspaceId] = [];
        }
        environmentsByWorkspace[env.workspaceId].push(env);
      });
      
      // Set environments for each workspace
      Object.entries(environmentsByWorkspace).forEach(([workspaceId, environments]) => {
        environmentStore.setEnvironments(parseInt(workspaceId), environments);
      });
      
      set({
        editors: startupData.availableEditors,
        isInitialized: true,
        isInitializing: false,
        initError: null
      });
    } catch (error) {
      console.error('Failed to initialize application:', error);
      set({
        isInitializing: false,
        initError:
          error instanceof Error ? error.message : 'Failed to initialize application'
      });
    }
  },

  clearInitError: () => set({ initError: null })
}));

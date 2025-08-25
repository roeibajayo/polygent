import { create } from 'zustand';
import { GitStatusResult } from '@/types';
import { sessionsApi } from '@/api';
import { useWorkspaceStore } from './workspaceStore';

export interface GitStatusData {
  gitStatus: GitStatusResult | null;
  isLoading: boolean;
  error: string | null;
  enabled: boolean;
}

interface GitStatusState {
  sessionGitStatus: Record<number, GitStatusData>;
}

interface GitStatusActions {
  setGitStatus: (sessionId: number, data: GitStatusData) => void;
  updateGitStatus: (sessionId: number, updates: Partial<GitStatusData>) => void;
  clearGitStatus: (sessionId: number) => void;
  getGitStatusForSession: (sessionId: number) => GitStatusData | undefined;
  fetchGitStatus: (sessionId: number) => Promise<void>;
  setEnabled: (sessionId: number, enabled: boolean) => void;
}

const initialGitStatusData: GitStatusData = {
  gitStatus: null,
  isLoading: false,
  error: null,
  enabled: true
};

export const useGitStatusStore = create<GitStatusState & GitStatusActions>((set, get) => ({
  sessionGitStatus: {},

  setGitStatus: (sessionId, data) =>
    set((state) => ({
      sessionGitStatus: {
        ...state.sessionGitStatus,
        [sessionId]: data
      }
    })),

  updateGitStatus: (sessionId, updates) =>
    set((state) => ({
      sessionGitStatus: {
        ...state.sessionGitStatus,
        [sessionId]: {
          ...state.sessionGitStatus[sessionId] || initialGitStatusData,
          ...updates
        }
      }
    })),

  clearGitStatus: (sessionId) =>
    set((state) => {
      const { [sessionId]: _, ...rest } = state.sessionGitStatus;
      return { sessionGitStatus: rest };
    }),

  getGitStatusForSession: (sessionId) => get().sessionGitStatus[sessionId],

  fetchGitStatus: async (sessionId) => {
    const { getGitStatusForSession, updateGitStatus, setGitStatus } = get();
    
    const sessionData = getGitStatusForSession(sessionId);
    const enabled = sessionData?.enabled ?? true;
    
    if (!enabled) return;
    
    updateGitStatus(sessionId, { isLoading: true, error: null });

    try {
      const status = await sessionsApi.getGitStatus(sessionId);
      setGitStatus(sessionId, {
        gitStatus: status,
        isLoading: false,
        error: null,
        enabled
      });
      
      // Refresh all diff tabs when git status is updated
      useWorkspaceStore.getState().refreshDiffTabs(sessionId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch git status';
      setGitStatus(sessionId, {
        gitStatus: null,
        isLoading: false,
        error: errorMessage,
        enabled
      });
    }
  },

  setEnabled: (sessionId, enabled) =>
    set((state) => ({
      sessionGitStatus: {
        ...state.sessionGitStatus,
        [sessionId]: {
          ...state.sessionGitStatus[sessionId] || initialGitStatusData,
          enabled
        }
      }
    }))
}));
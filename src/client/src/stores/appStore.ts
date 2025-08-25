import { create } from 'zustand';

export type Theme = 'light' | 'dark' | 'system';

interface AppState {
  theme: Theme;
  isSignalRConnected: boolean;
}

interface AppActions {
  setTheme: (theme: Theme) => void;
  setSignalRConnected: (connected: boolean) => void;
}

export const useAppStore = create<AppState & AppActions>((set) => ({
  theme: 'dark',
  isSignalRConnected: false,

  setTheme: (theme) => set({ theme }),
  setSignalRConnected: (connected) => set({ isSignalRConnected: connected })
}));

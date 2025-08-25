import { create } from 'zustand';
import {
  Workspace,
  Session,
  Environment,
  Task,
  SessionStatus,
  TaskStatus
} from '@/types/entities';
import { workspacesApi, sessionsApi } from '@/api';

export type ContentType = 'chat' | 'file' | 'diff' | 'task';

export interface FileContent {
  type: 'file';
  path: string;
  name: string;
  content: string;
  language: string;
  lastModified: string;
  editableContent: string;
}

export interface DiffContent {
  type: 'diff';
  path: string;
  name: string;
  original: string;
  modified: string;
  language: string;
  lastRefresh?: number;
}

export interface TaskContent {
  type: 'task';
  taskExecutionId: string;
  name: string;
  status: TaskStatus;
  output: string;
  startTime?: Date;
  endTime?: Date;
}

export interface ChatContent {
  type: 'chat';
}

export type MainContent = FileContent | DiffContent | TaskContent | ChatContent;

export interface Tab {
  id: string;
  content: MainContent;
  title: string;
  isDirty: boolean;
}

export interface SessionTabState {
  tabs: Tab[];
  activeTabId: string;
  inputMessage: string;
  messageHistoryIndex: number;
  autoDeployEnabled: false;
  selectedEnvironmentId: '';
  restartAfterSync: true;
}

interface WorkspaceState {
  workspaces: Workspace[];
  sessions: Session[];
  environments: Environment[];
  tasks: Task[];
  activeWorkspaceId: number | null;
  activeSessionId: number | null;
  sessionStates: Record<number, SessionStatus>;
  sessionTabStates: Record<string, SessionTabState>;
  sessionTabs: Record<number, Tab[]>;
  sessionActiveTabIds: Record<number, string>;
}

interface WorkspaceActions {
  loadWorkspaces: () => Promise<void>;
  loadSessions: (workspaceId?: number | null) => Promise<void>;
  setWorkspaces: (workspaces: Workspace[]) => void;
  addWorkspace: (workspace: Workspace) => void;
  updateWorkspace: (id: number, workspace: Workspace) => void;
  removeWorkspace: (id: number) => void;
  setSessions: (sessions: Session[]) => void;
  addSession: (session: Session) => void;
  updateSession: (session: Session) => void;
  removeSession: (sessionId: number) => void;
  setSessionStatus: (
    sessionId: number,
    status: SessionStatus,
    unreadCount?: number
  ) => void;
  clearUnreadMessages: (sessionId: number) => void;
  setSessionUnreadMessage: (
    sessionId: number,
    hasUnreadMessage: boolean
  ) => void;
  setEnvironments: (environments: Environment[]) => void;
  setTasks: (tasks: Task[]) => void;
  setActiveWorkspaceId: (workspaceId: number | null) => void;
  setActiveSessionId: (sessionId: number | null) => void;
  getSession: (sessionId: number) => Session | undefined;
  getSessionState: (sessionId: number) => SessionStatus;
  setSessionState: (sessionId: number, state: SessionStatus) => void;
  getTabState: (tabId: string) => SessionTabState | undefined;
  getSessionTabs: (sessionId: number) => Tab[];
  getSessionActiveTabId: (sessionId: number) => string;
  getTabContentById: (
    sessionId: number,
    tabId: string
  ) => MainContent | undefined;
  setSessionTabs: (sessionId: number, tabs: Tab[]) => void;
  setSessionActiveTabId: (sessionId: number, tabId: string) => void;
  setTabContent: (
    sessionId: number,
    tabId: string,
    content: MainContent
  ) => void;
  addSessionTab: (sessionId: number, tab: Tab) => void;
  removeSessionTab: (sessionId: number, tabId: string) => void;
  resetSessionTabs: (sessionId: number) => void;
  initializeSessionTabs: (sessionId: number) => void;
  getTabDirty: (sessionId: number, tabId: string) => boolean;
  setTabDirty: (sessionId: number, tabId: string, isDirty: boolean) => void;
  refreshDiffTabs: (sessionId: number) => void;
}

const WORKSPACE_STORAGE_KEY = 'polygent-active-workspace-id';

const getStoredWorkspaceId = (): number | null => {
  try {
    const stored = localStorage.getItem(WORKSPACE_STORAGE_KEY);
    return stored ? parseInt(stored) : null;
  } catch {
    return null;
  }
};

const setStoredWorkspaceId = (workspaceId: number | null): void => {
  try {
    if (workspaceId) {
      localStorage.setItem(WORKSPACE_STORAGE_KEY, workspaceId.toString());
    } else {
      localStorage.removeItem(WORKSPACE_STORAGE_KEY);
    }
  } catch {
    // Silently fail if localStorage is not available
  }
};

export const useWorkspaceStore = create<WorkspaceState & WorkspaceActions>(
  (set, get) => ({
    workspaces: [],
    sessions: [],
    environments: [],
    tasks: [],
    activeWorkspaceId: getStoredWorkspaceId(),
    activeSessionId: null,
    sessionStates: {},
    sessionTabStates: {},
    sessionTabs: {},
    sessionActiveTabIds: {},

    loadWorkspaces: async () => {
      try {
        const workspaces = await workspacesApi.getAll();
        set({ workspaces });
      } catch (error) {
        console.error('Failed to load workspaces:', error);
      }
    },

    loadSessions: async (workspaceId) => {
      try {
        let sessions: Session[];
        if (workspaceId) {
          sessions = await sessionsApi.getByWorkspaceId(workspaceId);
        } else {
          sessions = await sessionsApi.getAll();
        }
        set({ sessions });
      } catch (error) {
        console.error('Failed to load sessions:', error);
      }
    },

    setWorkspaces: (workspaces) => set({ workspaces }),

    addWorkspace: (workspace) => {
      const { workspaces } = get();
      set({ workspaces: [...workspaces, workspace] });
    },

    updateWorkspace: (id, updatedWorkspace) => {
      const { workspaces } = get();
      set({
        workspaces: workspaces.map((w) => (w.id === id ? updatedWorkspace : w))
      });
    },

    removeWorkspace: (id) => {
      const { workspaces } = get();
      set({ workspaces: workspaces.filter((w) => w.id !== id) });
    },

    setSessions: (sessions) => set({ sessions }),

    addSession: (session) => {
      const { sessions } = get();
      set({ sessions: [...sessions, session] });
    },

    updateSession: (updatedSession) => {
      const { sessions } = get();
      set({
        sessions: sessions.map((s) =>
          s.id === updatedSession.id ? updatedSession : s
        )
      });
    },

    removeSession: (sessionId) => {
      const { sessions } = get();
      set({ sessions: sessions.filter((s) => s.id !== sessionId) });
    },

    setSessionStatus: (sessionId, status, unreadCount) => {
      const { sessions } = get();
      set({
        sessions: sessions.map((session) =>
          session.id === sessionId
            ? {
                ...session,
                status,
                ...(unreadCount !== undefined && { unreadCount })
              }
            : session
        )
      });
    },

    clearUnreadMessages: (sessionId) => {
      const { sessions } = get();
      set({
        sessions: sessions.map((session) =>
          session.id === sessionId
            ? { ...session, hasUnreadMessage: false }
            : session
        )
      });
    },

    setSessionUnreadMessage: (sessionId, hasUnreadMessage) => {
      const { sessions } = get();
      set({
        sessions: sessions.map((session) =>
          session.id === sessionId ? { ...session, hasUnreadMessage } : session
        )
      });
    },

    setEnvironments: (environments) => set({ environments }),

    setTasks: (tasks) => set({ tasks }),

    setActiveWorkspaceId: (workspaceId) => {
      setStoredWorkspaceId(workspaceId);
      set({ activeWorkspaceId: workspaceId });
    },

    setActiveSessionId: (sessionId) => set({ activeSessionId: sessionId }),

    getSession: (sessionId) => {
      const { sessions } = get();
      return sessions.find((s) => s.id === sessionId);
    },

    getSessionState: (sessionId) => {
      const { sessionStates } = get();
      return sessionStates[sessionId];
    },

    setSessionState: (sessionId, state) => {
      const { sessionStates } = get();
      set({
        sessionStates: {
          ...sessionStates,
          [sessionId]: state
        }
      });
    },

    getTabState: (tabId) => {
      const { sessionTabStates } = get();
      return sessionTabStates[tabId];
    },

    getSessionTabs: (sessionId) => {
      const { sessionTabs } = get();
      return (
        sessionTabs[sessionId] || [
          { id: 'chat', content: { type: 'chat' }, title: 'Chat' }
        ]
      );
    },

    getSessionActiveTabId: (sessionId) => {
      const { sessionActiveTabIds } = get();
      return sessionActiveTabIds[sessionId] || 'chat';
    },

    getTabContentById: (sessionId, tabId) => {
      const { sessionTabs } = get();
      const tabs = sessionTabs[sessionId] || [
        { id: 'chat', content: { type: 'chat' }, title: 'Chat' }
      ];
      const tab = tabs.find((t) => t.id === tabId);
      return tab?.content;
    },

    setSessionTabs: (sessionId, tabs) => {
      const { sessionTabs } = get();
      set({
        sessionTabs: {
          ...sessionTabs,
          [sessionId]: tabs
        }
      });
    },

    setSessionActiveTabId: (sessionId, tabId) => {
      const { sessionActiveTabIds } = get();
      set({
        sessionActiveTabIds: {
          ...sessionActiveTabIds,
          [sessionId]: tabId
        }
      });
    },

    setTabContent: (sessionId, tabId, content) => {
      const { sessionTabs } = get();
      const tabs = sessionTabs[sessionId] || [
        { id: 'chat', content: { type: 'chat' }, title: 'Chat' }
      ];
      const updatedTabs = tabs.map((tab) =>
        tab.id === tabId ? { ...tab, content } : tab
      );
      set({
        sessionTabs: {
          ...sessionTabs,
          [sessionId]: updatedTabs
        }
      });
    },

    addSessionTab: (sessionId, tab) => {
      const { sessionTabs } = get();
      const tabs = sessionTabs[sessionId] || [
        { id: 'chat', content: { type: 'chat' }, title: 'Chat' }
      ];
      set({
        sessionTabs: {
          ...sessionTabs,
          [sessionId]: [...tabs, tab]
        }
      });
    },

    removeSessionTab: (sessionId, tabId) => {
      const { sessionTabs, sessionActiveTabIds } = get();
      const tabs = sessionTabs[sessionId] || [];
      const updatedTabs = tabs.filter((tab) => tab.id !== tabId);

      // If removing the active tab, switch to chat
      const activeTabId = sessionActiveTabIds[sessionId];
      const newActiveTabId = activeTabId === tabId ? 'chat' : activeTabId;

      set({
        sessionTabs: {
          ...sessionTabs,
          [sessionId]: updatedTabs
        },
        sessionActiveTabIds: {
          ...sessionActiveTabIds,
          [sessionId]: newActiveTabId
        }
      });
    },

    resetSessionTabs: (sessionId) => {
      const { sessionTabs, sessionActiveTabIds } = get();
      set({
        sessionTabs: {
          ...sessionTabs,
          [sessionId]: [
            {
              id: 'chat',
              content: { type: 'chat' },
              title: 'Chat',
              isDirty: false
            }
          ]
        },
        sessionActiveTabIds: {
          ...sessionActiveTabIds,
          [sessionId]: 'chat'
        }
      });
    },

    getTabDirty: (sessionId: number, tabId: string) => {
      const { sessionTabs } = get();
      const tabs = sessionTabs[sessionId] || [];
      const tab = tabs.find((t) => t.id === tabId);
      return tab?.isDirty || false;
    },

    setTabDirty: (sessionId: number, tabId: string, isDirty: boolean) => {
      const { sessionTabs } = get();
      const tabs = sessionTabs[sessionId] || [];
      const updatedTabs = tabs.map((tab) =>
        tab.id === tabId ? { ...tab, isDirty } : tab
      );
      set({
        sessionTabs: {
          ...sessionTabs,
          [sessionId]: updatedTabs
        }
      });
    },

    refreshDiffTabs: (sessionId: number) => {
      // This function now just triggers a re-render by updating the timestamp
      // The actual content refresh is handled by the DiffView component detecting the change
      const { sessionTabs } = get();
      const tabs = sessionTabs[sessionId] || [];
      
      const updatedTabs = tabs.map((tab) => {
        if (tab.content.type === 'diff') {
          return {
            ...tab,
            content: {
              ...tab.content,
              lastRefresh: Date.now()
            }
          };
        }
        return tab;
      });
      
      set({
        sessionTabs: {
          ...sessionTabs,
          [sessionId]: updatedTabs
        }
      });
    },

    initializeSessionTabs: (sessionId: number) => {
      const { sessionTabs, sessionActiveTabIds } = get();
      
      // Only initialize if not already initialized
      if (!sessionTabs[sessionId]) {
        const defaultChatTab: Tab = {
          id: 'chat',
          content: { type: 'chat' },
          title: 'Chat',
          isDirty: false
        };
        
        set({
          sessionTabs: {
            ...sessionTabs,
            [sessionId]: [defaultChatTab]
          },
          sessionActiveTabIds: {
            ...sessionActiveTabIds,
            [sessionId]: 'chat'
          }
        });
      }
    }
  })
);

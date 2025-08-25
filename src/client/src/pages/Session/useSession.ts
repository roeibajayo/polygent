import { useEffect } from 'react';
import { TaskStatus, SessionStatus } from '@/types';
import { sessionsApi } from '@/api';
import signalRService from '@/services/signalr';
import { GitDiffType } from './Sidebar/Git';
import {
  useWorkspaceStore,
  useTaskExecutionStore,
  type ContentType,
  type FileContent,
  type DiffContent,
  type TaskContent,
  type ChatContent,
  type MainContent,
  type Tab,
  type SessionTabState
} from '@/stores';

// Re-export the types for backward compatibility
export type {
  ContentType,
  FileContent,
  DiffContent,
  TaskContent,
  ChatContent,
  MainContent,
  Tab,
  SessionTabState
};

export default function useSession(sessionId: number) {
  const {
    setActiveSessionId,
    getSession,
    updateSession,
    getSessionTabs,
    getSessionActiveTabId,
    getTabContentById,
    setSessionTabs,
    setSessionActiveTabId,
    addSessionTab,
    removeSessionTab,
    resetSessionTabs,
    initializeSessionTabs,
    setActiveWorkspaceId
  } = useWorkspaceStore();
  const { getTaskExecution } = useTaskExecutionStore();

  // Get session from global state
  const session = getSession(sessionId);
  const tabs = getSessionTabs(sessionId);
  const activeTabId = getSessionActiveTabId(sessionId);

  // Reset state and fetch initial session status when sessionId changes
  useEffect(() => {
    const fetchSessionStatus = async () => {
      try {
        const sessionData = await sessionsApi.getById(sessionId);
        updateSession(sessionData);

        // Set the active workspace to match the session's workspace
        if (sessionData.workspaceId) {
          setActiveWorkspaceId(sessionData.workspaceId);
        }
      } catch (error) {
        console.error('Failed to fetch session status:', error);
      }
    };

    // Only fetch if session is not in global state
    if (!session) {
      fetchSessionStatus();
    } else if (session.workspaceId) {
      // If session exists in global state, still ensure workspace is set correctly
      setActiveWorkspaceId(session.workspaceId);
    }
  }, [
    sessionId,
    session,
    updateSession,
    resetSessionTabs,
    setActiveWorkspaceId
  ]);

  useEffect(() => {
    setActiveSessionId(sessionId!);
    
    // Initialize session tabs with default chat tab if needed
    initializeSessionTabs(sessionId);
  }, [sessionId, setActiveSessionId, initializeSessionTabs]);

  // Listen to task status updates via SignalR for TaskView updates
  useEffect(() => {
    const handleTaskStatusChange = (
      _taskId: number,
      _contextId: number,
      _isSession: boolean,
      taskExecutionId: string,
      status: TaskStatus
    ) => {
      // Update corresponding task tabs
      const currentTabs = getSessionTabs(sessionId);
      const updatedTabs = currentTabs.map((tab: Tab) => {
        if (
          tab.content.type === 'task' &&
          tab.content.taskExecutionId === taskExecutionId
        ) {
          return {
            ...tab,
            content: {
              ...tab.content,
              status: status,
              endTime:
                status === TaskStatus.Completed || status === TaskStatus.Failed
                  ? new Date()
                  : tab.content.endTime
            }
          };
        }
        return tab;
      });
      setSessionTabs(sessionId, updatedTabs);
    };

    const handleTaskOutputReceived = (
      _taskId: number,
      _contextId: number,
      _isSession: boolean,
      taskExecutionId: string,
      output: string
    ) => {
      // Update corresponding task tabs
      const currentTabs = getSessionTabs(sessionId);
      const updatedTabs = currentTabs.map((tab: Tab) => {
        if (
          tab.content.type === 'task' &&
          tab.content.taskExecutionId === taskExecutionId
        ) {
          const currentOutput = tab.content.output || '';
          return {
            ...tab,
            content: {
              ...tab.content,
              output: output ?? currentOutput
            }
          };
        }
        return tab;
      });
      setSessionTabs(sessionId, updatedTabs);
    };

    const cleanupStatus = signalRService.on(
      'onTaskStatusChanged',
      handleTaskStatusChange
    );
    const cleanupOutput = signalRService.on(
      'onTaskOutputChanged',
      handleTaskOutputReceived
    );

    return () => {
      cleanupStatus();
      cleanupOutput();
    };
  }, [sessionId, getSessionTabs, setSessionTabs]);

  const createTab = (content: MainContent, title: string): Tab => {
    const id = `${content.type}-${Date.now()}`;
    return { id, content, title, isDirty: false };
  };

  const openFile = async (path: string, name: string) => {
    // Check if tab already exists
    const currentTabs = getSessionTabs(sessionId);
    const existingTab = currentTabs.find(
      (tab: Tab) =>
        tab.content.type === 'file' &&
        (tab.content as FileContent).path === path
    );

    if (existingTab) {
      setSessionActiveTabId(sessionId, existingTab.id);
      return;
    }

    try {
      const { content: fileContent, lastModified } =
        await sessionsApi.getFileContent(sessionId, path);

      const language = getLanguageFromExtension(path);
      const content: FileContent = {
        type: 'file',
        path,
        name,
        content: fileContent,
        language,
        lastModified,
        editableContent: fileContent
      };

      const newTab = createTab(content, name);
      addSessionTab(sessionId, newTab);
      setSessionActiveTabId(sessionId, newTab.id);
    } catch (error) {
      console.error('Failed to load file:', error);
    }
  };

  const openDiff = async (
    path: string,
    name: string,
    diffType?: GitDiffType
  ) => {
    // Check if tab already exists for this file and diff type combination
    const currentTabs = getSessionTabs(sessionId);
    const existingTab = currentTabs.find(
      (tab: Tab) =>
        tab.content.type === 'diff' &&
        (tab.content as DiffContent).path === path &&
        tab.id.includes(diffType || 'WorkingVsHead')
    );

    if (existingTab) {
      setSessionActiveTabId(sessionId, existingTab.id);
      return;
    }

    try {
      let originalContent = '';
      let modifiedContent = '';

      // Map diffType to git file modes for full content comparison
      if (diffType === 'StagedVsHead') {
        // Compare staged version vs HEAD
        const [stagedResult, headResult] = await Promise.all([
          sessionsApi.getGitFileContent(sessionId, path, 'Staged'),
          sessionsApi.getGitFileContent(sessionId, path, 'Head')
        ]);
        originalContent = headResult.content;
        modifiedContent = stagedResult.content;
      } else if (diffType === 'WorkingVsStaged') {
        // Compare working directory vs staged
        const [workingResult, stagedResult] = await Promise.all([
          sessionsApi.getGitFileContent(sessionId, path, 'Working'),
          sessionsApi.getGitFileContent(sessionId, path, 'Staged')
        ]);
        originalContent = stagedResult.content;
        modifiedContent = workingResult.content;
      } else {
        // Default: WorkingVsHead - Compare working directory vs HEAD
        const [workingResult, headResult] = await Promise.all([
          sessionsApi.getGitFileContent(sessionId, path, 'Working'),
          sessionsApi.getGitFileContent(sessionId, path, 'Head')
        ]);
        originalContent = headResult.content;
        modifiedContent = workingResult.content;
      }

      const language = getLanguageFromExtension(path);

      const content: DiffContent = {
        type: 'diff',
        path,
        name,
        original: originalContent,
        modified: modifiedContent,
        language
      };

      const newTab = createTab(content, `${name} (Diff)`);
      newTab.id = `${newTab.id}-${diffType || 'WorkingVsHead'}`;
      addSessionTab(sessionId, newTab);
      setSessionActiveTabId(sessionId, newTab.id);
    } catch (error) {
      console.error('Failed to load full content diff:', error);

      const content: DiffContent = {
        type: 'diff',
        path,
        name,
        original: '',
        modified: '',
        language: 'text'
      };
      const newTab = createTab(content, `${name} (Diff)`);
      newTab.id = `${newTab.id}-${diffType || 'WorkingVsHead'}`;
      addSessionTab(sessionId, newTab);
      setSessionActiveTabId(sessionId, newTab.id);
    }
  };

  const openTask = (taskExecutionId: string, name: string) => {
    const execution = getTaskExecution(taskExecutionId);
    const status = execution?.status || TaskStatus.Running;
    const output = execution?.output || '';

    const content: TaskContent = {
      type: 'task',
      taskExecutionId,
      name,
      status,
      output,
      startTime: execution?.startTime || new Date(),
      endTime: execution?.endTime
    };

    // Check if tab already exists
    const currentTabs = getSessionTabs(sessionId);
    const existingTab = currentTabs.find(
      (tab: Tab) =>
        tab.content.type === 'task' &&
        (tab.content as TaskContent).taskExecutionId === taskExecutionId
    );

    if (existingTab) {
      // Update existing tab with latest data
      const updatedTabs = currentTabs.map((tab) =>
        tab.id === existingTab.id
          ? { ...tab, content: { ...tab.content, ...content } as TaskContent }
          : tab
      );
      setSessionTabs(sessionId, updatedTabs);
      setSessionActiveTabId(sessionId, existingTab.id);
    } else {
      const newTab = createTab(content, name);
      addSessionTab(sessionId, newTab);
      setSessionActiveTabId(sessionId, newTab.id);
    }
  };

  const openChat = () => {
    setSessionActiveTabId(sessionId, 'chat');
  };

  const closeTab = (tabId: string) => {
    removeSessionTab(sessionId, tabId);
  };

  const switchTab = (tabId: string) => {
    setSessionActiveTabId(sessionId, tabId);
  };

  const mergeToMain = async () => {
    try {
      const result = await sessionsApi.mergeToMain(sessionId);
      return result;
    } catch (error) {
      console.error('Failed to merge to main:', error);
      throw error;
    }
  };

  const pushBranch = async () => {
    try {
      const result = await sessionsApi.pushBranch(sessionId);
      return result;
    } catch (error) {
      console.error('Failed to push branch:', error);
      throw error;
    }
  };

  const pullFromStarterBranch = async () => {
    try {
      const result = await sessionsApi.pullFromStarterBranch(sessionId);
      return result;
    } catch (error) {
      console.error('Failed to pull from starter branch:', error);
      throw error;
    }
  };

  const resetSession = async () => {
    try {
      const result = await sessionsApi.resetSession(sessionId);

      // Clear all tabs except chat
      resetSessionTabs(sessionId);

      return result;
    } catch (error) {
      console.error('Failed to reset session:', error);
      throw error;
    }
  };

  const cancelSession = async () => {
    try {
      const result = await sessionsApi.cancelSession(sessionId);
      return result;
    } catch (error) {
      console.error('Failed to cancel session:', error);
      throw error;
    }
  };

  const stopWorkingMessages = async () => {
    try {
      const result = await sessionsApi.stopWorkingMessages(sessionId);
      return result;
    } catch (error) {
      console.error('Failed to stop working messages:', error);
      throw error;
    }
  };

  const openWithVSCode = async () => {
    try {
      const result = await sessionsApi.openWithVSCode(sessionId);
      return result;
    } catch (error) {
      console.error('Failed to open with VSCode:', error);
      throw error;
    }
  };

  const refreshFileContent = async (filePath: string) => {
    try {
      const { content: fileContent, lastModified } =
        await sessionsApi.getFileContent(sessionId, filePath);

      // Update the tab with fresh content
      const currentTabs = getSessionTabs(sessionId);
      const updatedTabs = currentTabs.map((tab: Tab) => {
        if (
          tab.content.type === 'file' &&
          (tab.content as FileContent).path === filePath
        ) {
          return {
            ...tab,
            content: {
              ...tab.content,
              content: fileContent,
              lastModified
            }
          };
        }
        return tab;
      });
      setSessionTabs(sessionId, updatedTabs);
    } catch (error) {
      console.error('Failed to refresh file content:', error);
      throw error;
    }
  };

  // Check if session is readonly (canceled or completed)
  const isSessionReadonly =
    session?.status === SessionStatus.Canceled ||
    session?.status === SessionStatus.Done;

  return {
    tabs,
    activeTabId,
    getTabContentById: (tabId: string) => getTabContentById(sessionId, tabId),
    session,
    isSessionReadonly,
    openFile,
    openDiff,
    openTask,
    openChat,
    closeTab,
    switchTab,
    refreshFileContent,
    mergeToMain,
    pushBranch,
    pullFromStarterBranch,
    resetSession,
    cancelSession,
    stopWorkingMessages,
    openWithVSCode
  };
}

// Helper function to determine language from file extension
function getLanguageFromExtension(filePath: string): string {
  const extension = filePath.split('.').pop()?.toLowerCase();

  const languageMap: Record<string, string> = {
    ts: 'typescript',
    tsx: 'typescript',
    js: 'javascript',
    jsx: 'javascript',
    json: 'json',
    css: 'css',
    scss: 'scss',
    html: 'html',
    md: 'markdown',
    py: 'python',
    cs: 'csharp',
    java: 'java',
    php: 'php',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    sql: 'sql',
    sh: 'shell',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    dockerfile: 'dockerfile'
  };

  return languageMap[extension || ''] || 'text';
}

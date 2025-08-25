import { useState, useRef, useEffect } from 'react';
import useSession, { type FileContent } from './useSession';
import Sidebar from './Sidebar';
import MainContent from './MainContent';
import { useParams } from 'react-router-dom';
import { useSignalR } from '@/hooks/useSignalR';
import { useSessionPresence } from '@/hooks/useSessionPresence';
import { LoadingModal } from '@/components';
import { deploySessionToEnvironment } from '@/api/environments';
import EnvironmentSelectionModal from './EnvironmentSelectionModal';
import { useWorkspaceStore, useInitStore } from '@/stores';
import { useGitStatusStore } from '@/stores/gitStatusStore';
import { useChat } from './MainContent/Chat/useChat';

type SidebarTab = 'session' | 'git' | 'files' | 'tasks';

const localState: Record<string, Record<string, any>> = {};

// Helper functions for managing session-specific settings
const saveSessionSettings = (
  sessionId: string,
  settings: {
    autoDeployEnabled: boolean;
    selectedEnvironmentId: string;
    restartAfterSync: boolean;
  }
) => {
  localState[sessionId] = { ...localState[sessionId], ...settings };
};

const loadSessionSettings = (sessionId: string) => {
  return (
    localState[sessionId] || {
      autoDeployEnabled: false,
      selectedEnvironmentId: '',
      restartAfterSync: true
    }
  );
};

// Helper functions for managing session-specific chat state
const saveChatState = (
  sessionId: string,
  chatState: {
    inputMessage: string;
    messageHistoryIndex: number;
  }
) => {
  localState[sessionId] = { ...localState[sessionId], chatState };
};

const loadChatState = (sessionId: string) => {
  return (
    localState[sessionId]?.chatState || {
      inputMessage: '',
      messageHistoryIndex: -1
    }
  );
};

export default function Session() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [sessionAction, setSessionAction] = useState<{
    isActive: boolean;
    title: string;
    message: string;
  }>({
    isActive: false,
    title: '',
    message: ''
  });
  const [isEnvironmentModalOpen, setIsEnvironmentModalOpen] = useState(false);
  const clearMessagesRef = useRef<(() => void) | null>(null);

  // Auto-deploy state lifted up to be shared between MainContent and Sidebar
  const [autoDeployEnabled, setAutoDeployEnabled] = useState(false);
  const [selectedEnvironmentId, setSelectedEnvironmentId] =
    useState<string>('');
  const [restartAfterSync, setRestartAfterSync] = useState(true);

  // Chat state lifted up to persist across tab switches
  const [chatInputMessage, setChatInputMessage] = useState('');
  const [messageHistoryIndex, setMessageHistoryIndex] = useState(-1);

  // Restore settings when sessionId changes
  useEffect(() => {
    if (sessionId) {
      const savedSettings = loadSessionSettings(sessionId);
      setAutoDeployEnabled(savedSettings.autoDeployEnabled);
      setSelectedEnvironmentId(savedSettings.selectedEnvironmentId);
      setRestartAfterSync(savedSettings.restartAfterSync);

      const savedChatState = loadChatState(sessionId);
      setChatInputMessage(savedChatState.inputMessage);
      setMessageHistoryIndex(savedChatState.messageHistoryIndex);
    }
  }, [sessionId]);

  // Helper functions to update state and save to localState
  const updateAutoDeployEnabled = (enabled: boolean) => {
    setAutoDeployEnabled(enabled);
    if (sessionId) {
      saveSessionSettings(sessionId, {
        autoDeployEnabled: enabled,
        selectedEnvironmentId,
        restartAfterSync
      });
    }
    if (!enabled) {
      updateSelectedEnvironmentId('');
    }
  };

  const updateSelectedEnvironmentId = (envId: string) => {
    setSelectedEnvironmentId(envId);
    if (sessionId) {
      saveSessionSettings(sessionId, {
        autoDeployEnabled,
        selectedEnvironmentId: envId,
        restartAfterSync
      });
    }
  };

  const updateRestartAfterSync = (restart: boolean) => {
    setRestartAfterSync(restart);
    if (sessionId) {
      saveSessionSettings(sessionId, {
        autoDeployEnabled,
        selectedEnvironmentId,
        restartAfterSync: restart
      });
    }
  };

  const updateChatInputMessage = (message: string) => {
    setChatInputMessage(message);
    if (sessionId) {
      saveChatState(sessionId, {
        inputMessage: message,
        messageHistoryIndex
      });
    }
  };

  const updateMessageHistoryIndex = (index: number) => {
    setMessageHistoryIndex(index);
    if (sessionId) {
      saveChatState(sessionId, {
        inputMessage: chatInputMessage,
        messageHistoryIndex: index
      });
    }
  };

  // Ensure SignalR connection and join session group
  useSignalR(
    {
      onMessageReceived: (receivedSessionId: number, message: any) => {
        // Refresh git status when a message is received for this session
        if (receivedSessionId === +sessionId!) {
          fetchGitStatus(+sessionId!);
        }
      },
      onMessageStatusChanged: (
        changedSessionId: number,
        messageId: number,
        status: any,
        content?: string
      ) => {
        // Refresh git status when a message status changes for this session
        if (changedSessionId === +sessionId!) {
          fetchGitStatus(+sessionId!);
        }
      }
    },
    {
      autoConnect: true,
      sessionId: sessionId
    }
  );

  // Track session presence with automatic enter/exit and pinging
  useSessionPresence({
    sessionId: +sessionId!,
    enabled: !!sessionId,
    pingInterval: 10000 // 10 seconds
  });

  const {
    tabs,
    activeTabId,
    session,
    isSessionReadonly,
    openFile,
    openDiff,
    openTask,
    closeTab,
    switchTab,
    mergeToMain,
    pushBranch,
    pullFromStarterBranch,
    resetSession: originalResetSession,
    cancelSession: originalCancelSession,
    stopWorkingMessages: originalStopWorkingMessages,
    openWithVSCode: originalOpenWithVSCode
  } = useSession(+sessionId!);

  // Get global workspace store methods
  const { updateSession: updateGlobalSession } = useWorkspaceStore();

  // Get available editors to check if VSCode is available
  const { editors } = useInitStore();
  const isVSCodeAvailable = editors.some(
    (editor) =>
      (editor.id === 'vscode' || editor.id === 'vscode-insiders') &&
      editor.isAvailable
  );

  // Get git status store for refreshing after message events
  const { fetchGitStatus } = useGitStatusStore();

  // Get messages count for button disable logic
  const { messages } = useChat(+sessionId!);
  const messagesCount = messages.length;

  // Generic session action handler
  const handleSessionAction = async (
    actionFn: () => Promise<{ message: string }>,
    title: string,
    message: string,
    clearMessages = false
  ) => {
    setSessionAction({
      isActive: true,
      title,
      message
    });

    try {
      const result = await actionFn();

      // Clear messages after successful action (only if clearMessages is true)
      if (clearMessages && clearMessagesRef.current) {
        clearMessagesRef.current();
      }

      return result;
    } finally {
      setSessionAction({
        isActive: false,
        title: '',
        message: ''
      });
    }
  };

  // Wrapper functions for specific actions
  const handleMergeToMain = () =>
    handleSessionAction(
      mergeToMain,
      'Merging to Main',
      'Please wait while merging changes to the main branch...'
    );

  const handlePushBranch = () =>
    handleSessionAction(
      pushBranch,
      'Completing Session',
      'Please wait while pushing changes and marking session as completed...'
    );

  const handlePullFromStarterBranch = () =>
    handleSessionAction(
      pullFromStarterBranch,
      'Pulling from Starter Branch',
      'Please wait while pulling latest changes from the starter branch...'
    );

  const handleResetSession = () =>
    handleSessionAction(
      originalResetSession,
      'Resetting Session',
      'Please wait while the session is being reset...',
      true
    );

  const handleCancelSession = () =>
    handleSessionAction(
      originalCancelSession,
      'Canceling Session',
      'Please wait while the session is being canceled...'
    );

  const handleStopWorkingMessages = () =>
    handleSessionAction(
      originalStopWorkingMessages,
      'Stopping Progress',
      'Please wait while stopping working messages...'
    );

  const handleOpenWithVSCode = () =>
    handleSessionAction(
      originalOpenWithVSCode,
      'Opening with VSCode',
      'Please wait while opening session with VSCode...'
    );

  const handleDeployToEnvironment = () => {
    // If auto-deploy is configured with a selected environment, deploy directly
    if (autoDeployEnabled && selectedEnvironmentId) {
      handleSessionAction(
        async () => {
          await deploySessionToEnvironment(
            +sessionId!,
            +selectedEnvironmentId,
            restartAfterSync
          );
          return { message: 'Deployment completed successfully' };
        },
        'Deploying to Environment',
        'Please wait while deploying to the selected environment...'
      );
    } else {
      // Otherwise, open the modal for manual selection
      setIsEnvironmentModalOpen(true);
    }
  };

  const handleSessionNameUpdate = (name: string) => {
    if (session) {
      const updatedSession = {
        ...session,
        name
      };

      // Update global store which will update both the Header and local session state
      updateGlobalSession(updatedSession);
    }
  };

  // Get the currently active file path
  const activeTab = tabs.find((tab) => tab.id === activeTabId);
  const activeFilePath =
    activeTab?.content.type === 'file'
      ? (activeTab.content as FileContent).path
      : null;

  // Determine which sidebar tab should be active based on content (only for non-chat tabs)
  const getSidebarTab = (): SidebarTab | null => {
    if (activeTab?.content.type === 'file') return 'files';
    if (activeTab?.content.type === 'diff') return 'git';
    if (activeTab?.content.type === 'task') return 'tasks';
    return null; // Don't override sidebar for chat
  };

  const suggestedSidebarTab = getSidebarTab();

  return (
    <>
      <div className="flex h-full min-h-0">
        <Sidebar
          sessionId={+sessionId!}
          activeFilePath={activeFilePath}
          suggestedSidebarTab={suggestedSidebarTab}
          isSessionReadonly={isSessionReadonly}
          session={session}
          onOpenFile={openFile}
          onOpenDiff={openDiff}
          onOpenTask={openTask}
          onMergeToMain={handleMergeToMain}
          onPushBranch={handlePushBranch}
          onPullFromStarterBranch={handlePullFromStarterBranch}
          onResetSession={handleResetSession}
          onCancelSession={handleCancelSession}
          onStopWorkingMessages={handleStopWorkingMessages}
          onOpenWithVSCode={handleOpenWithVSCode}
          isVSCodeAvailable={isVSCodeAvailable}
          onDeployToEnvironment={handleDeployToEnvironment}
          onSessionNameUpdate={handleSessionNameUpdate}
          autoDeployEnabled={autoDeployEnabled}
          selectedEnvironmentId={selectedEnvironmentId}
          restartAfterSync={restartAfterSync}
          onAutoDeployChange={updateAutoDeployEnabled}
          onSelectedEnvironmentIdChange={updateSelectedEnvironmentId}
          onRestartAfterSyncChange={updateRestartAfterSync}
          messagesCount={messagesCount}
          isCriticalOperationRunning={sessionAction.isActive}
        />
        <MainContent
          tabs={tabs}
          activeTabId={activeTabId}
          sessionId={+sessionId!}
          isSessionReadonly={isSessionReadonly}
          session={session}
          onCloseTab={closeTab}
          onSwitchTab={switchTab}
          onOpenFile={openFile}
          onClearMessagesRef={(clearFn) => {
            clearMessagesRef.current = clearFn;
          }}
          autoDeployEnabled={autoDeployEnabled}
          selectedEnvironmentId={selectedEnvironmentId}
          restartAfterSync={restartAfterSync}
          onAutoDeployChange={updateAutoDeployEnabled}
          onSelectedEnvironmentIdChange={updateSelectedEnvironmentId}
          chatInputMessage={chatInputMessage}
          messageHistoryIndex={messageHistoryIndex}
          onChatInputMessageChange={updateChatInputMessage}
          onMessageHistoryIndexChange={updateMessageHistoryIndex}
        />
      </div>

      <LoadingModal
        isOpen={sessionAction.isActive}
        title={sessionAction.title}
        message={sessionAction.message}
      />

      <EnvironmentSelectionModal
        isOpen={isEnvironmentModalOpen}
        onClose={() => setIsEnvironmentModalOpen(false)}
        sessionId={+sessionId!}
        workspaceId={session?.workspaceId}
      />
    </>
  );
}

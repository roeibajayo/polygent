import { useEffect, useRef } from 'react';
import { Tab, FileContent } from '../useSession';
import { MessageSquare, GitCompare, Terminal, X } from 'lucide-react';
import FileView from './FileView';
import DiffView from './DiffView';
import TaskView from './TaskView';
import ChatView from './Chat';
import { Session, SessionStatus } from '@/types';
import { useEnvironments } from '@/hooks/useEnvironments';
import { deploySessionToEnvironment } from '@/api/environments';
import { FileIcon } from '@/components';

interface MainContentProps {
  tabs: Tab[];
  activeTabId: string;
  sessionId: number;
  isSessionReadonly: boolean;
  session?: Session;
  onCloseTab: (tabId: string) => void;
  onSwitchTab: (tabId: string) => void;
  onOpenFile: (path: string, name: string) => void;
  onClearMessagesRef?: (clearMessages: () => void) => void;
  autoDeployEnabled: boolean;
  selectedEnvironmentId: string;
  restartAfterSync: boolean;
  onAutoDeployChange: (enabled: boolean) => void;
  onSelectedEnvironmentIdChange: (envId: string) => void;
  chatInputMessage: string;
  messageHistoryIndex: number;
  onChatInputMessageChange: (message: string) => void;
  onMessageHistoryIndexChange: (index: number) => void;
}

export default function MainContent({
  tabs,
  activeTabId,
  sessionId,
  isSessionReadonly,
  session,
  onCloseTab,
  onSwitchTab,
  onOpenFile,
  onClearMessagesRef,
  autoDeployEnabled,
  selectedEnvironmentId,
  restartAfterSync,
  onSelectedEnvironmentIdChange,
  chatInputMessage,
  messageHistoryIndex,
  onChatInputMessageChange,
  onMessageHistoryIndexChange
}: MainContentProps) {
  const prevSessionStatusRef = useRef<SessionStatus | undefined>(undefined);

  // Load environments for deployment when auto deploy is enabled
  const shouldLoadEnvironments = autoDeployEnabled && !!session?.workspaceId;
  const {
    environments,
    loading: environmentsLoading,
    error: environmentsError,
    refetch: refetchEnvironments
  } = useEnvironments({
    workspaceId: session?.workspaceId || 1, // Default to 1 if no workspaceId, but won't auto-load
    autoLoad: shouldLoadEnvironments
  });

  // Auto-select first environment when environments load and auto deploy is enabled
  useEffect(() => {
    if (
      environments.length > 0 &&
      !selectedEnvironmentId &&
      autoDeployEnabled
    ) {
      onSelectedEnvironmentIdChange(environments[0].id.toString());
    }
  }, [
    environments,
    selectedEnvironmentId,
    autoDeployEnabled,
    onSelectedEnvironmentIdChange
  ]);

  // Manually trigger environment loading when auto deploy is first enabled
  useEffect(() => {
    if (
      autoDeployEnabled &&
      session?.workspaceId &&
      environments.length === 0 &&
      !environmentsLoading &&
      !environmentsError
    ) {
      refetchEnvironments();
    }
  }, [
    autoDeployEnabled,
    session?.workspaceId,
    environments.length,
    environmentsLoading,
    environmentsError,
    refetchEnvironments
  ]);

  // Auto-execute task when session finishes
  useEffect(() => {
    const prevStatus = prevSessionStatusRef.current;
    const currentStatus = session?.status;

    // If session changed from InProgress to Done or Waiting and auto deploy is enabled
    if (
      prevStatus === SessionStatus.InProgress &&
      (currentStatus === SessionStatus.Done ||
        currentStatus === SessionStatus.Waiting) &&
      autoDeployEnabled &&
      selectedEnvironmentId
    ) {
      // Auto-deploy to selected environment
      deploySessionToEnvironment(
        sessionId,
        +selectedEnvironmentId,
        restartAfterSync
      ).catch((error) => console.error('Auto-deploy failed:', error));
    }

    prevSessionStatusRef.current = currentStatus;
  }, [
    session?.status,
    autoDeployEnabled,
    selectedEnvironmentId,
    sessionId,
    restartAfterSync
  ]);

  const getTabIcon = (tab: Tab) => {
    switch (tab.content.type) {
      case 'chat':
        return <MessageSquare className="w-4 h-4" />;
      case 'file':
        return <FileIcon fileName={(tab.content as FileContent).name || ''} size={16} className="text-neutral-600 dark:text-neutral-400" />;
      case 'diff':
        return <GitCompare className="w-4 h-4" />;
      case 'task':
        return <Terminal className="w-4 h-4" />;
      default:
        return <MessageSquare className="w-4 h-4" />;
    }
  };

  const renderContent = (tab: Tab) => {
    switch (tab.content.type) {
      case 'chat': {
        const selectedEnvironment = environments.find(
          (env) => env.id.toString() === selectedEnvironmentId
        );
        return (
          <ChatView
            sessionId={sessionId}
            className="h-full min-h-0"
            onOpenFile={onOpenFile}
            onClearMessagesRef={onClearMessagesRef}
            isReadonly={isSessionReadonly}
            autoDeployEnabled={autoDeployEnabled}
            selectedEnvironmentName={selectedEnvironment?.name}
            chatInputMessage={chatInputMessage}
            messageHistoryIndex={messageHistoryIndex}
            onChatInputMessageChange={onChatInputMessageChange}
            onMessageHistoryIndexChange={onMessageHistoryIndexChange}
          />
        );
      }
      case 'file':
        return <FileView tabId={activeTabId} />;
      case 'diff':
        return <DiffView tabId={activeTabId} />;
      case 'task':
        return <TaskView tabId={activeTabId} />;
      default:
        return null;
    }
  };

  const hasNonChatTabs = tabs.some((tab) => tab.id !== 'chat');

  return (
    <div className="flex-1 min-h-0 bg-neutral-50 dark:bg-neutral-900 flex flex-col">
      {/* Tabs Bar - only show if there are tabs other than chat */}
      {hasNonChatTabs && (
        <div className="bg-white dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex overflow-x-auto">
            {tabs.map((tab) => (
              <div
                key={tab.id}
                className={`flex items-center gap-2 px-4 py-2 border-r border-neutral-200 dark:border-neutral-700 min-w-0 ${
                  activeTabId === tab.id
                    ? 'bg-neutral-100 dark:bg-neutral-900'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-50 dark:hover:bg-neutral-700'
                }`}
                onClick={() => onSwitchTab(tab.id)}
                onMouseDown={(e) => {
                  // Middle mouse button (button 1)
                  if (e.button === 1 && tab.id !== 'chat') {
                    e.preventDefault();
                    onCloseTab(tab.id);
                  }
                }}>
                {getTabIcon(tab)}
                <span className="text-sm truncate max-w-32">
                  {tab.title}
                </span>
                {tab.isDirty && (
                  <span className="text-orange-500 text-sm">•</span>
                )}
                {tab.id !== 'chat' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab.id);
                    }}
                    className="ml-1 p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Content Area */}
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={
            'flex-1 min-h-0 flex flex-col' +
            (activeTabId !== tab.id ? ' hidden' : '')
          }>
          {renderContent(tab)}
        </div>
      ))}
    </div>
  );
}

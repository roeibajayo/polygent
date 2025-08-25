import { useState, useEffect, useRef, useCallback } from 'react';
import { Badge } from '@/components';
import useGitStatus from '@/hooks/useGitStatus';
import Session from './Session';
import Git, { GitDiffType } from './Git';
import Files from './Files';
import Tasks from './Tasks';
import {
  GitBranchIcon,
  MessagesSquareIcon,
  PlayIcon,
  FilesIcon
} from 'lucide-react';
import { Session as SessionType } from '@/types';

type SidebarTab = 'session' | 'git' | 'files' | 'tasks';

interface SidebarProps {
  sessionId: number;
  activeFilePath?: string | null;
  suggestedSidebarTab: SidebarTab | null;
  isSessionReadonly: boolean;
  session: SessionType | undefined;
  onOpenFile: (path: string, name: string) => void;
  onOpenDiff: (path: string, name: string, diffType?: GitDiffType) => void;
  onOpenTask: (id: string, name: string) => void;
  onMergeToMain: () => Promise<{ message: string }>;
  onPushBranch: () => Promise<{ message: string }>;
  onPullFromStarterBranch: () => Promise<{ message: string }>;
  onResetSession: () => Promise<{ message: string }>;
  onCancelSession: () => Promise<{ message: string }>;
  onStopWorkingMessages: () => Promise<{ message: string }>;
  onOpenWithVSCode: () => Promise<{ message: string }>;
  isVSCodeAvailable: boolean;
  onDeployToEnvironment: () => void;
  onSessionNameUpdate: (name: string) => void;
  autoDeployEnabled: boolean;
  selectedEnvironmentId: string;
  restartAfterSync: boolean;
  onAutoDeployChange: (enabled: boolean) => void;
  onSelectedEnvironmentIdChange: (envId: string) => void;
  onRestartAfterSyncChange: (enabled: boolean) => void;
  messagesCount: number;
  isCriticalOperationRunning?: boolean;
}

export default function SideBar({
  sessionId,
  activeFilePath,
  suggestedSidebarTab,
  isSessionReadonly,
  session,
  onOpenFile,
  onOpenDiff,
  onOpenTask,
  onMergeToMain,
  onPushBranch,
  onPullFromStarterBranch,
  onResetSession,
  onCancelSession,
  onStopWorkingMessages,
  onOpenWithVSCode,
  isVSCodeAvailable,
  onDeployToEnvironment,
  onSessionNameUpdate,
  autoDeployEnabled,
  selectedEnvironmentId,
  restartAfterSync,
  onAutoDeployChange,
  onSelectedEnvironmentIdChange,
  onRestartAfterSyncChange,
  messagesCount,
  isCriticalOperationRunning = false
}: SidebarProps) {
  const [activeTab, setActiveTab] = useState<SidebarTab>('session');
  const [userHasManuallySelected, setUserHasManuallySelected] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('sidebar-width');
    return saved ? parseInt(saved, 10) : 320;
  });
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { gitStatus, fetchGitStatus } = useGitStatus(sessionId);

  // Reset manual selection state when session changes
  useEffect(() => {
    setUserHasManuallySelected(false);
    fetchGitStatus();
  }, [sessionId]);

  // Only auto-switch to suggested tab if user hasn't manually selected a tab
  useEffect(() => {
    if (suggestedSidebarTab && !userHasManuallySelected) {
      setActiveTab(suggestedSidebarTab);
    }
  }, [suggestedSidebarTab, userHasManuallySelected]);

  // Save sidebar width to localStorage
  useEffect(() => {
    localStorage.setItem('sidebar-width', sidebarWidth.toString());
  }, [sidebarWidth]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing) return;

      const newWidth = e.clientX;
      const minWidth = 200;
      const maxWidth = 600;

      if (newWidth >= minWidth && newWidth <= maxWidth) {
        setSidebarWidth(newWidth);
      }
    },
    [isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const getTabBadgeCount = (tab: SidebarTab) => {
    switch (tab) {
      case 'session':
        return 0; // Could show session status or message count
      case 'git':
        return !isSessionReadonly && gitStatus
          ? gitStatus.stagedFiles.length +
              gitStatus.unstagedFiles.length +
              gitStatus.untrackedFiles.length
          : 0;
      case 'files':
        return 0;
      case 'tasks':
        return 0; // Could show running task count
      default:
        return 0;
    }
  };

  const renderSidebarContent = () => {
    switch (activeTab) {
      case 'session':
        return (
          <Session
            sessionId={sessionId}
            isSessionReadonly={isSessionReadonly}
            session={session}
            onOpenTask={onOpenTask}
            onMergeToMain={onMergeToMain}
            onPushBranch={onPushBranch}
            onPullFromStarterBranch={onPullFromStarterBranch}
            onResetSession={onResetSession}
            onCancelSession={onCancelSession}
            onStopWorkingMessages={onStopWorkingMessages}
            onOpenWithVSCode={onOpenWithVSCode}
            isVSCodeAvailable={isVSCodeAvailable}
            onDeployToEnvironment={onDeployToEnvironment}
            onSessionNameUpdate={onSessionNameUpdate}
            autoDeployEnabled={autoDeployEnabled}
            selectedEnvironmentId={selectedEnvironmentId}
            restartAfterSync={restartAfterSync}
            onAutoDeployChange={onAutoDeployChange}
            onSelectedEnvironmentIdChange={onSelectedEnvironmentIdChange}
            onRestartAfterSyncChange={onRestartAfterSyncChange}
            messagesCount={messagesCount}
            isCriticalOperationRunning={isCriticalOperationRunning}
          />
        );
      case 'git':
        return (
          <Git
            sessionId={sessionId}
            isSessionReadonly={isSessionReadonly}
            onOpenDiff={onOpenDiff}
          />
        );
      case 'files':
        return (
          <Files
            sessionId={sessionId}
            activeFilePath={activeFilePath}
            isSessionReadonly={isSessionReadonly}
            onOpenFile={onOpenFile}
          />
        );
      case 'tasks':
        return (
          <Tasks
            sessionId={sessionId}
            isSessionReadonly={isSessionReadonly}
            onOpenTask={onOpenTask}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div
      ref={sidebarRef}
      className="border-r border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 flex flex-col relative"
      style={{ width: `${sidebarWidth}px` }}>
      <div className="border-b border-neutral-200 dark:border-neutral-700 p-1">
        <div className="flex space-x-1">
          {(['session', 'git', 'files', 'tasks'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                if (!isCriticalOperationRunning) {
                  setActiveTab(tab);
                  setUserHasManuallySelected(true);
                }
              }}
              disabled={isCriticalOperationRunning}
              className={`flex items-center space-x-2 px-3 py-2 text-sm rounded-md ${
                activeTab === tab
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700'
              } ${isCriticalOperationRunning ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {tab === 'session' && (
                <span>
                  <MessagesSquareIcon size={18} />
                </span>
              )}
              {tab === 'git' && (
                <span>
                  <GitBranchIcon size={18} />
                </span>
              )}
              {tab === 'files' && (
                <span>
                  <FilesIcon size={18} />
                </span>
              )}
              {tab === 'tasks' && (
                <span>
                  <PlayIcon size={18} />
                </span>
              )}
              {getTabBadgeCount(tab) > 0 && (
                <Badge variant="default" size="sm">
                  {getTabBadgeCount(tab)}
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">{renderSidebarContent()}</div>

      {/* Resize handle */}
      <div
        className={`absolute top-0 right-0 w-1 h-full cursor-col-resize bg-transparent hover:bg-purple-400 ${
          isResizing ? 'bg-purple-400' : ''
        }`}
        onMouseDown={handleMouseDown}
        style={{ zIndex: 10 }}
      />
    </div>
  );
}

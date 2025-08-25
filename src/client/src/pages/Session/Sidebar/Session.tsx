import { Button, ConfirmDialog, SessionRenameModal } from '@/components';
import { useState, useEffect } from 'react';
import { SessionStatus, Session as SessionType, Agent } from '@/types';
import { useEnvironments } from '@/hooks/useEnvironments';
import { sessionsApi, agentsApi } from '@/api';
import { useWorkspaceStore } from '@/stores';
import useGitStatus from '@/hooks/useGitStatus';

interface SessionProps {
  sessionId: number;
  isSessionReadonly: boolean;
  session: SessionType | undefined;
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

export default function Session({
  sessionId,
  isSessionReadonly,
  session,
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
  isCriticalOperationRunning: externalCriticalOperationRunning = false
}: SessionProps) {
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [isRenameModalOpen, setIsRenameModalOpen] = useState(false);
  const [agent, setAgent] = useState<Agent | null>(null);

  const { workspaces } = useWorkspaceStore();
  const { gitStatus } = useGitStatus(sessionId);

  // Load environments for auto deploy configuration
  const {
    environments,
    loading: environmentsLoading,
    error: environmentsError,
    refetch: refetchEnvironments
  } = useEnvironments({
    workspaceId: session?.workspaceId || 1,
    autoLoad: !!session?.workspaceId
  });

  // Load agent information when session changes
  useEffect(() => {
    if (session?.agentId) {
      const loadAgent = async () => {
        try {
          const agentData = await agentsApi.getById(session.agentId);
          setAgent(agentData);
        } catch (error) {
          console.error('Failed to load agent:', error);
          setAgent(null);
        }
      };
      loadAgent();
    }
  }, [session?.agentId]);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    action: () => Promise<{ message: string }>;
    variant?: 'danger' | 'warning' | 'info';
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: async () => ({ message: '' })
  });

  const handleAction = async (
    actionName: string,
    actionFn: () => Promise<{ message: string }>
  ) => {
    setLoading((prev) => ({ ...prev, [actionName]: true }));
    try {
      await actionFn();
    } catch (error) {
      console.error(`${actionName} failed:`, error);
    } finally {
      setLoading((prev) => ({ ...prev, [actionName]: false }));
    }
  };

  const handleConfirmAction = (
    title: string,
    message: string,
    action: () => Promise<{ message: string }>,
    variant: 'danger' | 'warning' | 'info' = 'warning'
  ) => {
    setConfirmDialog({
      isOpen: true,
      title,
      message,
      action,
      variant
    });
  };

  const executeConfirmedAction = async () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
    const actionName = confirmDialog.action.name || 'action';
    await handleAction(actionName, confirmDialog.action);
  };

  const closeConfirmDialog = () => {
    setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
  };

  const handleRename = async (name: string) => {
    if (!session) {
      throw new Error('No session available');
    }

    try {
      await sessionsApi.update(session.id, { name });
      onSessionNameUpdate(name);
    } catch (error) {
      console.error('Failed to update session name:', error);
      throw error;
    }
  };

  const getStatusLabel = () => {
    switch (session?.status) {
      case SessionStatus.Waiting:
        return 'Waiting';
      case SessionStatus.InProgress:
        return 'In Progress';
      case SessionStatus.Done:
        return 'Completed';
      case SessionStatus.Canceled:
        return 'Canceled';
      default:
        return 'Unknown';
    }
  };

  // Helper function to check if git has changes
  const hasGitChanges = () => {
    if (!gitStatus) return false;
    return (
      gitStatus.stagedFiles.length > 0 ||
      gitStatus.unstagedFiles.length > 0 ||
      gitStatus.untrackedFiles.length > 0
    );
  };

  // Helper function to check if session should allow reset
  const canResetOrCompleteSession = () => {
    return messagesCount > 0 || hasGitChanges();
  };

  // Helper function to check if git-dependent actions should be enabled
  const canPerformGitActions = () => {
    return hasGitChanges();
  };

  // Critical operations that should lock all other actions
  const criticalOperations = [
    'mergeToMain',
    'pushBranch',
    'pullFromStarterBranch',
    'resetSession',
    'cancelSession'
  ];

  // Check if any critical operation is currently running (local or external)
  const isCriticalOperationRunning =
    criticalOperations.some((operation) => loading[operation]) ||
    externalCriticalOperationRunning;
  return (
    <>
      <div className="space-y-4 text-neutral-900 dark:text-neutral-100">
        <div>
          <h3 className="text-sm mb-2">Session</h3>
          <div className="text-xs bg-neutral-100 dark:bg-neutral-700 p-3 flex flex-col gap-2 rounded">
            <div>
              <strong>Name: </strong>
              <span
                className={`px-1 py-0.5 rounded ${
                  !isSessionReadonly
                    ? 'cursor-pointer hover:bg-neutral-200 dark:hover:bg-neutral-600 hover:underline'
                    : 'cursor-default'
                }`}
                onClick={() =>
                  !isSessionReadonly &&
                  !isCriticalOperationRunning &&
                  setIsRenameModalOpen(true)
                }
                title={
                  isSessionReadonly ? 'Read-only mode' : 'Click to rename'
                }>
                {session?.name || 'Untitled Session'}
              </span>
            </div>
            <div>
              <strong>Id: </strong>
              <span>{session?.id}</span>
            </div>
            <div>
              <strong>Status: </strong>
              <span>{getStatusLabel()}</span>
            </div>
            <div>
              <strong>Workspace: </strong>
              <span>
                {workspaces.find((w) => w.id === session?.workspaceId)?.name ||
                  'Unknown'}
              </span>
            </div>
            <div>
              <strong>Agent: </strong>
              <span>
                {agent
                  ? `${agent.name}` +
                    (agent.roleName ? ` (${agent.roleName})` : '')
                  : 'Loading...'}
              </span>
            </div>
          </div>
        </div>
        {environments.length > 0 && !isSessionReadonly && (
          <div>
            <h3 className="text-sm mb-2">Auto Deploy</h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="autoDeploy"
                  checked={autoDeployEnabled}
                  onChange={(e) => onAutoDeployChange(e.target.checked)}
                  disabled={isCriticalOperationRunning}
                  className="rounded border-neutral-300 dark:border-neutral-600 text-purple-600 dark:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <label
                  htmlFor="autoDeploy"
                  className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
                  Enable Auto Deploy
                </label>
              </div>

              {autoDeployEnabled && (
                <div className="space-y-2">
                  <div className="text-xs text-neutral-600 dark:text-neutral-400">
                    Deploy to environment:
                  </div>
                  {environmentsLoading ? (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400">
                      Loading environments...
                    </div>
                  ) : environmentsError ? (
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-red-500 dark:text-red-400">
                        Error: {environmentsError}
                      </div>
                      <button
                        onClick={refetchEnvironments}
                        className="text-xs px-2 py-1 bg-red-100 hover:bg-red-200 dark:bg-red-900 dark:hover:bg-red-800 text-red-600 dark:text-red-400 rounded">
                        Retry
                      </button>
                    </div>
                  ) : (
                    <select
                      value={selectedEnvironmentId}
                      onChange={(e) =>
                        onSelectedEnvironmentIdChange(e.target.value)
                      }
                      disabled={
                        environments.length === 0 || isCriticalOperationRunning
                      }
                      className="w-full text-xs border border-neutral-300 dark:border-neutral-600 rounded px-2 py-1 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed">
                      <option value="">
                        {environments.length === 0
                          ? 'No environments found'
                          : 'Select environment...'}
                      </option>
                      {environments.map((env) => (
                        <option key={env.id} value={env.id.toString()}>
                          {env.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="restartAfterSync"
                      checked={restartAfterSync}
                      onChange={(e) =>
                        onRestartAfterSyncChange(e.target.checked)
                      }
                      disabled={isCriticalOperationRunning}
                      className="rounded border-neutral-300 dark:border-neutral-600 text-purple-600 dark:bg-neutral-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <label
                      htmlFor="restartAfterSync"
                      className="text-xs text-neutral-600 dark:text-neutral-400 cursor-pointer">
                      Restart after sync
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        <div>
          <h3 className="text-sm mb-2">Actions</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                handleConfirmAction(
                  'Complete and Merge into Main',
                  'Are you sure you want to merge this session to the main branch? This action cannot be undone.',
                  onMergeToMain,
                  'warning'
                )
              }
              disabled={
                isSessionReadonly ||
                loading.mergeToMain ||
                !canPerformGitActions() ||
                isCriticalOperationRunning
              }>
              {loading.mergeToMain
                ? 'Merging...'
                : 'Complete and Merge into Main'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                handleConfirmAction(
                  'Mark as Completed',
                  'Are you sure you want to push this branch and mark the session as completed?',
                  onPushBranch,
                  'info'
                )
              }
              disabled={
                isSessionReadonly ||
                loading.pushBranch ||
                !canResetOrCompleteSession() ||
                isCriticalOperationRunning
              }>
              {loading.pushBranch ? 'Completing...' : 'Mark as Completed'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                handleConfirmAction(
                  'Pull from Starter Branch',
                  'Are you sure you want to pull changes from the starter branch? This may overwrite local changes.',
                  onPullFromStarterBranch,
                  'warning'
                )
              }
              disabled={
                isSessionReadonly ||
                loading.pullFromStarterBranch ||
                isCriticalOperationRunning
              }>
              {loading.pullFromStarterBranch
                ? 'Pulling...'
                : 'Pull from Starter Branch'}
            </Button>
            {environments.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={onDeployToEnvironment}
                disabled={
                  isSessionReadonly ||
                  !canPerformGitActions() ||
                  isCriticalOperationRunning
                }>
                {autoDeployEnabled && selectedEnvironmentId
                  ? `Deploy to ${environments.find((env) => env.id.toString() === selectedEnvironmentId)?.name || 'Environment'}`
                  : 'Deploy to Environment'}
              </Button>
            )}
            {isVSCodeAvailable && (
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => handleAction('openWithVSCode', onOpenWithVSCode)}
                disabled={
                  loading.openWithVSCode ||
                  isSessionReadonly ||
                  isCriticalOperationRunning
                }>
                {loading.openWithVSCode ? 'Opening...' : 'Open with VSCode'}
              </Button>
            )}
            {session?.status === SessionStatus.InProgress && (
              <Button
                variant="outline"
                size="sm"
                className="w-full text-orange-600 hover:text-orange-700 border-orange-300 hover:border-orange-400"
                onClick={() =>
                  handleConfirmAction(
                    'Stop Progress',
                    'Are you sure you want to stop working messages? This will cancel any currently processing messages.',
                    onStopWorkingMessages,
                    'warning'
                  )
                }
                disabled={
                  isSessionReadonly ||
                  loading.stopWorkingMessages ||
                  isCriticalOperationRunning
                }>
                {loading.stopWorkingMessages ? 'Stopping...' : 'Stop'}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() =>
                handleConfirmAction(
                  'Reset Session',
                  'Are you sure you want to reset this session? All progress and changes will be lost.',
                  onResetSession,
                  'danger'
                )
              }
              disabled={
                isSessionReadonly ||
                loading.resetSession ||
                !canResetOrCompleteSession() ||
                isCriticalOperationRunning
              }>
              {loading.resetSession ? 'Resetting...' : 'Reset'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full text-red-600 hover:text-red-700"
              onClick={() =>
                handleConfirmAction(
                  'Cancel Session',
                  'Are you sure you want to cancel this session? All progress and changes will be lost.',
                  onCancelSession,
                  'danger'
                )
              }
              disabled={
                isSessionReadonly ||
                loading.cancelSession ||
                isCriticalOperationRunning
              }>
              {loading.cancelSession ? 'Canceling...' : 'Cancel'}
            </Button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        variant={confirmDialog.variant}
        onConfirm={executeConfirmedAction}
        onCancel={closeConfirmDialog}
      />

      <SessionRenameModal
        isOpen={isRenameModalOpen}
        session={session}
        onClose={() => setIsRenameModalOpen(false)}
        onRename={handleRename}
      />
    </>
  );
}

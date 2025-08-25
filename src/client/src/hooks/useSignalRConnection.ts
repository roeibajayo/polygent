import { useEffect } from 'react';
import { useSignalR } from './useSignalR';
import {
  useAppStore,
  useTaskExecutionStore,
  useWorkspaceStore
} from '@/stores';

/**
 * Global SignalR connection manager hook
 * Manages the SignalR connection and updates the app store with connection status
 */
export default function useSignalRConnection() {
  const { setSignalRConnected } = useAppStore();

  const { updateTaskStatus, updateTaskOutput, mapTaskToExecution } =
    useTaskExecutionStore();

  const { setSessionStatus, setSessionUnreadMessage } = useWorkspaceStore();

  const { isConnected, connectionState } = useSignalR(
    {
      onConnected: () => {
        setSignalRConnected(true);
      },
      onDisconnected: () => {
        setSignalRConnected(false);
      },
      onReconnecting: () => {
        setSignalRConnected(false);
      },
      onReconnected: () => {
        setSignalRConnected(true);
      },
      onTaskStatusChanged(
        taskId,
        _contextId,
        isSession,
        taskExecutionId,
        status
      ) {
        updateTaskStatus(taskExecutionId, status);
        mapTaskToExecution(taskId, isSession, taskExecutionId);
      },
      onTaskOutputChanged(
        taskId,
        _contextId,
        isSession,
        taskExecutionId,
        output
      ) {
        updateTaskOutput(taskExecutionId, output);
        mapTaskToExecution(taskId, isSession, taskExecutionId);
      },
      onSessionStatusChanged(sessionId, status) {
        setSessionStatus(sessionId, status);
      },
      onSessionUnreadMessageChanged(sessionId, count) {
        setSessionUnreadMessage(sessionId, count);
      }
    },
    {
      autoConnect: true
    }
  );

  // Update app store with initial connection state
  useEffect(() => {
    setSignalRConnected(isConnected);
  }, [isConnected, setSignalRConnected]);

  return {
    isConnected,
    connectionState
  };
}

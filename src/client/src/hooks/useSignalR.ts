import { useEffect, useRef } from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import { signalRService, type SignalREvents } from '../services/signalr';

interface UseSignalROptions {
  autoConnect?: boolean;
  sessionId?: string;
  workspaceId?: string;
}

interface UseSignalRReturn {
  isConnected: boolean;
  connectionState: HubConnectionState | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  joinWorkspaceGroup: (workspaceId: string) => Promise<void>;
  leaveWorkspaceGroup: (workspaceId: string) => Promise<void>;
}

export function useSignalR(
  events: Partial<SignalREvents>,
  options: UseSignalROptions = {}
): UseSignalRReturn {
  const { autoConnect = true, sessionId, workspaceId } = options;
  const eventsRef = useRef(events);
  const joinedSessionRef = useRef<string | null>(null);
  const joinedWorkspaceRef = useRef<string | null>(null);

  // Update events ref when events change
  eventsRef.current = events;

  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    // Register event handlers
    Object.entries(eventsRef.current).forEach(([event, handler]) => {
      if (handler) {
        const cleanup = signalRService.on(
          event as keyof SignalREvents,
          handler
        );
        cleanupFunctions.push(cleanup);
      }
    });

    // Auto-connect if enabled
    if (autoConnect) {
      signalRService.connect().catch(console.error);
    }

    return () => {
      // Cleanup event handlers
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [autoConnect]);

  // Handle session group joining/leaving
  useEffect(() => {
    if (!sessionId) return;

    // Wait for connection before joining
    if (!signalRService.isConnected) {
      const handleConnected = () => {
        cleanup();
      };
      const cleanup = signalRService.on('onConnected', handleConnected);
    }

    return () => {
      // Store the current session ID for cleanup
      const currentSessionId = joinedSessionRef.current;
      if (currentSessionId) {
        joinedSessionRef.current = null;
      }
    };
  }, [sessionId]);

  // Handle workspace group joining/leaving
  useEffect(() => {
    if (!workspaceId) return;

    const previousWorkspaceId = joinedWorkspaceRef.current;

    const joinWorkspace = async () => {
      if (signalRService.isConnected) {
        // Leave previous workspace group if exists
        if (previousWorkspaceId && previousWorkspaceId !== workspaceId) {
          await signalRService.leaveWorkspaceGroup(previousWorkspaceId);
        }

        // Join new workspace group
        await signalRService.joinWorkspaceGroup(workspaceId);
        joinedWorkspaceRef.current = workspaceId;
      }
    };

    // Wait for connection before joining
    if (signalRService.isConnected) {
      joinWorkspace();
    } else {
      const handleConnected = () => {
        joinWorkspace();
        cleanup();
      };
      const cleanup = signalRService.on('onConnected', handleConnected);
    }

    return () => {
      // Store the current workspace ID for cleanup
      const currentWorkspaceId = joinedWorkspaceRef.current;
      if (currentWorkspaceId) {
        signalRService.leaveWorkspaceGroup(currentWorkspaceId);
        joinedWorkspaceRef.current = null;
      }
    };
  }, [workspaceId]);

  return {
    isConnected: signalRService.isConnected,
    connectionState: signalRService.connectionState,
    connect: () => signalRService.connect(),
    disconnect: () => signalRService.disconnect(),
    joinWorkspaceGroup: (workspaceId: string) =>
      signalRService.joinWorkspaceGroup(workspaceId),
    leaveWorkspaceGroup: (workspaceId: string) =>
      signalRService.leaveWorkspaceGroup(workspaceId)
  };
}

export default useSignalR;

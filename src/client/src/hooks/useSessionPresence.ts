import { useEffect, useRef } from 'react';
import { signalRService } from '../services/signalr';
import { sessionsApi } from '../api/sessions';
import { useWorkspaceStore } from '../stores/workspaceStore';

interface UseSessionPresenceOptions {
  sessionId: number;
  enabled?: boolean;
  pingInterval?: number; // in milliseconds, default 10000 (10 seconds)
}

export function useSessionPresence({
  sessionId,
  enabled = true,
  pingInterval = 10000
}: UseSessionPresenceOptions) {
  const pingIntervalRef = useRef<number | null>(null);
  const isPageVisibleRef = useRef(true);
  const { clearUnreadMessages } = useWorkspaceStore();

  useEffect(() => {
    if (!enabled || !sessionId) return;

    // Enter session when component mounts or when SignalR connects
    const enterSession = async () => {
      if (signalRService.isConnected && isPageVisibleRef.current) {
        await signalRService.enterSession(sessionId);
        // Clear unread messages flag when entering session
        try {
          await sessionsApi.clearUnreadMessages(sessionId);
          clearUnreadMessages(sessionId); // Update local state
        } catch (error) {
          console.error('Failed to clear unread messages:', error);
        }
        startPinging();
      }
    };

    // Exit session
    const exitSession = async () => {
      if (signalRService.isConnected) {
        await signalRService.exitSession(sessionId);
        stopPinging();
      }
    };

    // Start pinging mechanism
    const startPinging = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
      }

      pingIntervalRef.current = setInterval(async () => {
        if (signalRService.isConnected && isPageVisibleRef.current) {
          try {
            await signalRService.enterSession(sessionId);
          } catch (error) {
            console.error('Failed to ping session:', error);
          }
        }
      }, pingInterval);
    };

    // Stop pinging mechanism
    const stopPinging = () => {
      if (pingIntervalRef.current) {
        clearInterval(pingIntervalRef.current);
        pingIntervalRef.current = null;
      }
    };

    // Handle page visibility changes
    const handleVisibilityChange = async () => {
      const isVisible = !document.hidden;
      isPageVisibleRef.current = isVisible;

      if (isVisible) {
        // Page became visible - enter session and start pinging
        await enterSession();
      } else {
        // Page became hidden - exit session and stop pinging
        await exitSession();
      }
    };

    // Handle page focus/blur
    const handleFocus = async () => {
      isPageVisibleRef.current = true;
      await enterSession();
    };

    const handleBlur = async () => {
      isPageVisibleRef.current = false;
      await exitSession();
    };

    // Handle beforeunload (page refresh/close)
    const handleBeforeUnload = async () => {
      await exitSession();
    };

    // Handle SignalR connection events
    const handleConnected = () => {
      if (isPageVisibleRef.current) {
        enterSession();
      }
    };

    const handleDisconnected = () => {
      stopPinging();
    };

    // Set up event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Set up SignalR event listeners
    const cleanupConnected = signalRService.on('onConnected', handleConnected);
    const cleanupDisconnected = signalRService.on(
      'onDisconnected',
      handleDisconnected
    );

    // Initial setup
    if (signalRService.isConnected) {
      enterSession();
    }

    // Cleanup function
    return () => {
      // Exit session
      if (signalRService.isConnected) {
        signalRService.exitSession(sessionId).catch(console.error);
      }

      // Stop pinging
      stopPinging();

      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      // Cleanup SignalR event listeners
      cleanupConnected();
      cleanupDisconnected();
    };
  }, [sessionId, enabled, pingInterval]);

  return {
    // Utility methods to manually control session presence
    enterSession: () => {
      if (signalRService.isConnected) {
        return signalRService.enterSession(sessionId);
      }
    },
    exitSession: () => {
      if (signalRService.isConnected) {
        return signalRService.exitSession(sessionId);
      }
    }
  };
}

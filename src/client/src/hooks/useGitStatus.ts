import { useEffect, useCallback } from 'react';
import { GitStatusResult } from '@/types';
import { useGitStatusStore } from '@/stores/gitStatusStore';

export interface UseGitStatusOptions {
  sessionId: number;
}

export interface UseGitStatusReturn {
  gitStatus: GitStatusResult | null;
  isLoading: boolean;
  error: string | null;
  setEnabled: (enabled: boolean) => void;
  fetchGitStatus: () => Promise<void>;
}

export default function useGitStatus(sessionId: number): UseGitStatusReturn {
  const {
    getGitStatusForSession,
    fetchGitStatus: storeFetchGitStatus,
    setEnabled
  } = useGitStatusStore();

  const sessionData = getGitStatusForSession(sessionId);
  const gitStatus = sessionData?.gitStatus || null;
  const isLoading = sessionData?.isLoading || false;
  const error = sessionData?.error || null;

  const fetchGitStatus = useCallback(async () => {
    await storeFetchGitStatus(sessionId);
  }, [sessionId, storeFetchGitStatus]);

  const handleSetEnabled = useCallback(
    (enabled: boolean) => {
      setEnabled(sessionId, enabled);
    },
    [sessionId, setEnabled]
  );

  return {
    gitStatus,
    isLoading,
    error,
    setEnabled: handleSetEnabled,
    fetchGitStatus
  };
}

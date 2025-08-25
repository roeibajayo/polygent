import { useEffect, useRef, useCallback } from 'react';

interface UseAutoScrollOptions {
  enabled?: boolean;
  threshold?: number;
  dependencies?: any[];
}

export function useAutoScroll<T extends HTMLElement>(
  options: UseAutoScrollOptions = {}
) {
  const { enabled = true, threshold = 50, dependencies = [] } = options;

  const ref = useRef<T>(null);

  const scrollToBottom = useCallback(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, []);

  const isNearBottom = useCallback(() => {
    if (!ref.current) return false;
    const element = ref.current;
    return (
      element.scrollHeight - element.scrollTop - element.clientHeight <
      threshold
    );
  }, [threshold]);

  // Auto-scroll when dependencies change
  useEffect(() => {
    if (enabled && ref.current) {
      if (isNearBottom()) {
        scrollToBottom();
      }
    }
  }, [enabled, ...dependencies]);

  return {
    ref,
    scrollToBottom,
    isNearBottom
  };
}

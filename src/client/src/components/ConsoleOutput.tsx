import { useEffect, useRef } from 'react';

interface ConsoleOutputProps {
  output: string;
  className?: string;
  autoScroll?: boolean;
  placeholder?: string;
}

export default function ConsoleOutput({
  output,
  className = '',
  autoScroll = true,
  placeholder = 'Waiting for output...'
}: ConsoleOutputProps) {
  const outputRef = useRef<HTMLPreElement>(null);

  // Auto-scroll to bottom when output changes
  useEffect(() => {
    if (!autoScroll || !outputRef.current) return;

    // Force scroll to bottom - be very aggressive for live output
    const forceScrollToBottom = () => {
      if (outputRef.current) {
        outputRef.current.scrollTop = outputRef.current.scrollHeight;
      }
    };

    // Multiple attempts to ensure scroll happens
    requestAnimationFrame(forceScrollToBottom);
  }, [output, autoScroll]);

  const hasOutput = Boolean(output);
  // Initial scroll to bottom on mount and when content first appears
  useEffect(() => {
    if (autoScroll && outputRef.current) {
      // Use both setTimeout and requestAnimationFrame for maximum compatibility
      const scrollToBottom = () => {
        if (outputRef.current) {
          outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
      };

      requestAnimationFrame(scrollToBottom); // After paint
    }
  }, [autoScroll, hasOutput]);

  return (
    <div className="bg-neutral-900 dark:bg-neutral-950 rounded-lg p-4 h-full select-text">
      <pre
        ref={outputRef}
        className={`font-mono text-sm text-neutral-100 whitespace-pre-wrap wrap-break-word overflow-y-auto ${className}`}>
        {output || placeholder}
      </pre>
    </div>
  );
}

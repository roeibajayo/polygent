import { useRef, KeyboardEvent } from 'react';
import { Button } from '@/components';

interface MessageInputProps {
  onSendMessage: (content: string) => Promise<void>;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  messageHistory?: string[];
  messageHistoryIndex?: number;
  onMessageHistoryIndexChange?: (index: number) => void;
  inputMessage: string;
  onInputMessageChange: (message: string) => void;
}

export default function MessageInput({
  onSendMessage,
  disabled = false,
  placeholder = 'Type your message...',
  className = '',
  messageHistory = [],
  messageHistoryIndex = -1,
  onMessageHistoryIndexChange,
  inputMessage,
  onInputMessageChange
}: MessageInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = async () => {
    if (!inputMessage.trim() || disabled) return;

    const messageToSend = inputMessage.trim();
    onInputMessageChange('');

    // Reset textarea height and maintain focus
    const focusInput = () => {
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        // Use requestAnimationFrame to ensure DOM is updated before focusing
        requestAnimationFrame(() => {
          textareaRef.current?.focus();
        });
      }
    };

    try {
      await onSendMessage(messageToSend);
      focusInput();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Failed to send message:', error);
      // Still focus the input even if sending failed
      focusInput();
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
      return;
    }

    // Handle arrow key navigation for message history
    if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      // Only handle if input is empty or we're already navigating history
      if (inputMessage.trim() === '' || messageHistoryIndex >= 0) {
        e.preventDefault();

        if (!onMessageHistoryIndexChange || messageHistory.length === 0) return;

        if (e.key === 'ArrowUp') {
          // Navigate to previous message (newer in history)
          const newIndex = Math.min(
            messageHistoryIndex + 1,
            messageHistory.length - 1
          );
          onMessageHistoryIndexChange(newIndex);
          onInputMessageChange(messageHistory[newIndex] || '');
        } else if (e.key === 'ArrowDown') {
          // Navigate to next message (older in history) or clear input
          if (messageHistoryIndex > 0) {
            const newIndex = messageHistoryIndex - 1;
            onMessageHistoryIndexChange(newIndex);
            onInputMessageChange(messageHistory[newIndex] || '');
          } else {
            // Clear input and reset history index
            onMessageHistoryIndexChange(-1);
            onInputMessageChange('');
          }
        }
      }
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    onInputMessageChange(textarea.value);

    // Reset history index when user manually types
    if (onMessageHistoryIndexChange && messageHistoryIndex >= 0) {
      onMessageHistoryIndexChange(-1);
    }

    // Auto-resize textarea
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <textarea
        ref={textareaRef}
        value={inputMessage}
        onChange={handleInput}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={`
            w-full px-4 py-3 pr-12 rounded-lg border border-neutral-300 dark:border-neutral-600
            bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100
            placeholder-neutral-500 dark:placeholder-neutral-400
            focus:border-transparent
            resize-none overflow-hidden min-h-[48px] max-h-[200px]
            disabled:opacity-50 disabled:cursor-not-allowed
            duration-200  font-mono
          `}
        rows={1}
      />

      <Button
        onClick={handleSend}
        disabled={!inputMessage.trim()}
        loading={disabled}
        className="min-w-[80px] py-3 font-mono">
        Send
      </Button>
    </div>
  );
}

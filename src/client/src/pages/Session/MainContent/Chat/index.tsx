import { useRef, useEffect, useMemo } from 'react';
import { useChat } from './useChat';
import { MessageType } from '../../../../types/entities';
import MessageItem from './MessageItem';
import MessageInput from './MessageInput';
import LoadingSpinner from '../../../../components/LoadingSpinner';
import { Badge } from '@/components';

interface ChatViewProps {
  sessionId: number;
  className?: string;
  onOpenFile: (path: string, name: string) => void;
  onClearMessagesRef?: (clearMessages: () => void) => void;
  isReadonly?: boolean;
  autoDeployEnabled?: boolean;
  selectedEnvironmentName?: string;
  chatInputMessage: string;
  messageHistoryIndex: number;
  onChatInputMessageChange: (message: string) => void;
  onMessageHistoryIndexChange: (index: number) => void;
}

export default function Chat({
  sessionId,
  className = '',
  onOpenFile,
  onClearMessagesRef,
  isReadonly = false,
  autoDeployEnabled = false,
  selectedEnvironmentName,
  chatInputMessage,
  messageHistoryIndex,
  onChatInputMessageChange,
  onMessageHistoryIndexChange
}: ChatViewProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    messages,
    loading,
    sending,
    error,
    sendMessage,
    clearError,
    clearMessages
  } = useChat(sessionId);

  // Message history state is now managed at session level

  // Extract user messages for history
  const userMessageHistory = useMemo(() => {
    return messages
      .filter((msg) => msg.type === MessageType.User)
      .map((msg) => msg.content)
      .reverse(); // Most recent first
  }, [messages]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Expose clearMessages function to parent
  useEffect(() => {
    if (onClearMessagesRef) {
      onClearMessagesRef(clearMessages);
    }
  }, [clearMessages, onClearMessagesRef]);

  const handleSendMessage = async (content: string) => {
    // Reset history index when sending a new message
    onMessageHistoryIndexChange(-1);
    onChatInputMessageChange('');
    await sendMessage(content);
  };

  if (loading && messages.length === 0) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col h-full bg-neutral-100/30 dark:bg-neutral-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Session Chat
          {!isReadonly && autoDeployEnabled && selectedEnvironmentName && (
            <span className="ml-2 text-sm font-normal opacity-60">
              Auto Deploy to <Badge>{selectedEnvironmentName}</Badge>
            </span>
          )}
        </h2>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/50 border-b border-red-200 dark:border-red-800 p-3">
          <div className="flex items-center justify-between">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
            <button
              onClick={clearError}
              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-200">
              ×
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-neutral-500 dark:text-neutral-400">
              <p className="text-lg">No messages yet</p>
              <p className="text-sm">
                Start a conversation by sending a message below
              </p>
            </div>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <MessageItem
                key={message.id}
                message={message}
                onOpenFile={onOpenFile}
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      {!isReadonly && (
        <div className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 p-4">
          <MessageInput
            onSendMessage={handleSendMessage}
            disabled={sending || loading}
            placeholder={sending ? 'Sending...' : 'Type your message...'}
            messageHistory={userMessageHistory}
            messageHistoryIndex={messageHistoryIndex}
            onMessageHistoryIndexChange={onMessageHistoryIndexChange}
            inputMessage={chatInputMessage}
            onInputMessageChange={onChatInputMessageChange}
          />
        </div>
      )}
    </div>
  );
}

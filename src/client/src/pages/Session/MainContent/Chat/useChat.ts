import { useState, useEffect, useCallback, useRef } from 'react';
import { messagesApi } from '../../../../api/messages';
import signalRService from '../../../../services/signalr';
import {
  Message,
  SendMessageRequest,
  MessageStatus,
  MessageType,
  SessionStatus
} from '../../../../types/entities';

interface UseChatReturn {
  messages: Message[];
  loading: boolean;
  sending: boolean;
  error: string | null;
  sessionStatus: string | null;
  sendMessage: (
    content: string,
    metadata?: string,
    parentMessageId?: number
  ) => Promise<void>;
  clearError: () => void;
  clearMessages: () => void;
}

export function useChat(sessionId: number): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<string | null>(null);

  const addOrUpdateMessage = useCallback((message: Message) => {
    setMessages((prev) => {
      const found = prev.find((msg) => msg.id === message.id);
      let updated: Message[];
      if (found) {
        const updatedAt =
          message.updatedAt > found.updatedAt
            ? message.updatedAt
            : found.updatedAt;
        const status =
          message.updatedAt > found.updatedAt ? message.status : found.status;
        updated = prev.map((msg) =>
          msg.id === message.id
            ? {
                ...msg,
                status: status,
                content: message.content || msg.content,
                updatedAt: updatedAt || msg.updatedAt
              }
            : msg
        );
      } else {
        updated = [...prev, message];
      }

      // Re-sort messages by updatedAt to maintain correct order
      const sortedUpdated = updated.sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      );

      return sortedUpdated;
    });
  }, []);

  // Use refs to always have the latest values in event handlers
  const sessionIdRef = useRef(sessionId);
  const addOrUpdateMessageRef = useRef(addOrUpdateMessage);
  sessionIdRef.current = sessionId;
  addOrUpdateMessageRef.current = addOrUpdateMessage;

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const refreshMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedMessages = await messagesApi.getBySessionId(sessionId);
      // Sort messages by updatedAt (oldest first)
      const sortedMessages = fetchedMessages.sort(
        (a, b) =>
          new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
      );
      setMessages(sortedMessages);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  const sendMessage = useCallback(
    async (content: string, metadata?: string, parentMessageId?: number) => {
      if (!content.trim()) return;

      try {
        setSending(true);
        setError(null);

        const request: SendMessageRequest = {
          content: content.trim(),
          metadata,
          parentMessageId
        };

        const createdAt = new Date();
        const response = await messagesApi.send(sessionId, request);

        if (!response.success || !response.messageId) {
          throw new Error(response.error || 'Failed to send message');
        }

        // Add pending message immediately with returned messageId
        if (response.messageId) {
          const pendingMessage: Message = {
            id: response.messageId,
            sessionId,
            type: MessageType.User,
            content: content.trim(),
            status: MessageStatus.Pending,
            metadata,
            parentMessageId,
            createdAt,
            updatedAt: createdAt
          };

          addOrUpdateMessage(pendingMessage);
        }
      } catch (err) {
        console.error('Failed to send message:', err);
        setError(err instanceof Error ? err.message : 'Failed to send message');
      } finally {
        setSending(false);
      }
    },
    [sessionId]
  );
  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Create stable event handlers that use refs
  const stableHandleMessageReceived = useCallback(
    (msgSessionId: number, message: Message) => {
      if (msgSessionId === sessionIdRef.current) {
        addOrUpdateMessageRef.current({
          ...message,
          createdAt: new Date(message.createdAt),
          updatedAt: new Date(message.updatedAt)
        });
      }
    },
    []
  );

  const stableHandleMessageStatusChanged = useCallback(
    (
      msgSessionId: number,
      messageId: number,
      status: MessageStatus,
      content?: string,
      updatedAt?: string
    ) => {
      if (msgSessionId === sessionIdRef.current) {
        const parsedUpdatedAt = updatedAt ? new Date(updatedAt) : new Date();
        addOrUpdateMessageRef.current({
          id: messageId,
          sessionId: sessionIdRef.current,
          type: MessageType.User,
          status,
          content: content || '',
          updatedAt: parsedUpdatedAt,
          createdAt: parsedUpdatedAt
        });
      }
    },
    []
  );

  const stableHandleSessionStatusChanged = useCallback(
    (msgSessionId: number, status: SessionStatus) => {
      if (msgSessionId === sessionIdRef.current) {
        setSessionStatus(status.toString());
      }
    },
    []
  );

  // Set up SignalR event handlers (without group management)
  // Register once on mount with stable handlers
  useEffect(() => {
    const cleanupFunctions: (() => void)[] = [];

    // Register event handlers
    cleanupFunctions.push(
      signalRService.on('onMessageReceived', stableHandleMessageReceived),
      signalRService.on(
        'onMessageStatusChanged',
        stableHandleMessageStatusChanged
      )
    );

    return () => {
      // Only cleanup when component unmounts
      cleanupFunctions.forEach((cleanup) => cleanup());
    };
  }, [
    stableHandleMessageReceived,
    stableHandleMessageStatusChanged,
    stableHandleSessionStatusChanged
  ]);

  // Reset state and load messages when sessionId changes
  useEffect(() => {
    // Clear previous session's state
    setMessages([]);
    setError(null);
    setSessionStatus(null);

    // Load messages for new session
    refreshMessages();
  }, [sessionId, refreshMessages]);

  return {
    messages,
    loading,
    sending,
    error,
    sessionStatus,
    sendMessage,
    clearError,
    clearMessages
  };
}

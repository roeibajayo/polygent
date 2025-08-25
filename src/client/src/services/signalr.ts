import { MessageStatus, SessionStatus, TaskStatus } from '@/types';
import {
  HubConnection,
  HubConnectionBuilder,
  LogLevel,
  HubConnectionState
} from '@microsoft/signalr';

export interface SignalREvents {
  // Session events
  onSessionStatusChanged: (sessionId: number, status: SessionStatus) => void;
  onSessionUnreadMessageChanged: (
    sessionId: number,
    hasUnreadMessage: boolean
  ) => void;

  // Message events
  onMessageReceived: (sessionId: number, message: any) => void;
  onMessageStatusChanged: (
    sessionId: number,
    messageId: number,
    status: MessageStatus,
    content?: string
  ) => void;

  // Task events
  onTaskStatusChanged: (
    taskId: number,
    contextId: number,
    isSession: boolean,
    taskExecutionId: string,
    status: TaskStatus
  ) => void;
  onTaskOutputChanged: (
    taskId: number,
    contextId: number,
    isSession: boolean,
    taskExecutionId: string,
    output: string
  ) => void;

  // General events
  onConnected: () => void;
  onDisconnected: () => void;
  onReconnecting: () => void;
  onReconnected: () => void;
}

type EventHandler = (...args: any[]) => void;

class SignalRService {
  private connection: HubConnection | null = null;
  private eventHandlers: Map<keyof SignalREvents, Set<EventHandler>> =
    new Map();
  private isConnecting = false;

  constructor() {
    this.initializeConnection();
  }

  private initializeConnection(): void {
    this.connection = new HubConnectionBuilder()
      .withUrl('/hub')
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    if (!this.connection) return;

    // Connection events
    this.connection.onclose(() => {
      this.notifyHandlers('onDisconnected');
    });

    this.connection.onreconnecting(() => {
      this.notifyHandlers('onReconnecting');
    });

    this.connection.onreconnected(() => {
      this.notifyHandlers('onReconnected');
    });

    // Session events
    this.connection.on(
      'SessionStatusChanged',
      (sessionId: string, status: string) => {
        this.notifyHandlers(
          'onSessionStatusChanged',
          parseInt(sessionId),
          parseInt(status)
        );
      }
    );

    this.connection.on(
      'SessionUnreadMessageChanged',
      (sessionId: string, hasUnreadMessage: boolean) => {
        this.notifyHandlers(
          'onSessionUnreadMessageChanged',
          parseInt(sessionId),
          hasUnreadMessage
        );
      }
    );

    // Message events
    this.connection.on('MessageReceived', (sessionId: string, message: any) => {
      this.notifyHandlers('onMessageReceived', parseInt(sessionId), message);
    });

    this.connection.on(
      'MessageStatusChanged',
      (
        sessionId: string,
        messageId: string,
        status: string,
        content?: string,
        updatedAt?: string
      ) => {
        this.notifyHandlers(
          'onMessageStatusChanged',
          parseInt(sessionId),
          parseInt(messageId),
          parseInt(status),
          content,
          updatedAt
        );
      }
    );

    // Task events
    this.connection.on(
      'TaskStatusChanged',
      (
        taskId: number,
        contextId: number,
        isSession: boolean,
        taskExecutionId: string,
        status: TaskStatus
      ) => {
        this.notifyHandlers(
          'onTaskStatusChanged',
          taskId,
          contextId,
          isSession,
          taskExecutionId,
          status
        );
      }
    );

    this.connection.on(
      'TaskOutputChanged',
      (
        taskId: number,
        contextId: number,
        isSession: boolean,
        taskExecutionId: string,
        output: string
      ) => {
        this.notifyHandlers(
          'onTaskOutputChanged',
          taskId,
          contextId,
          isSession,
          taskExecutionId,
          output
        );
      }
    );
  }

  async connect(): Promise<void> {
    if (!this.connection || this.isConnecting) return;

    if (this.connection.state === HubConnectionState.Connected) {
      return;
    }

    try {
      this.isConnecting = true;
      await this.connection.start();
      this.notifyHandlers('onConnected');
    } catch (error) {
      console.error('SignalR connection failed:', error);
      throw error;
    } finally {
      this.isConnecting = false;
    }
  }

  async disconnect(): Promise<void> {
    if (!this.connection) return;

    try {
      await this.connection.stop();
    } catch (error) {
      console.error('SignalR disconnection failed:', error);
    }
  }

  private notifyHandlers(event: keyof SignalREvents, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(...args);
        } catch (error) {
          console.error(`Error in SignalR event handler for ${event}:`, error);
        }
      });
    }
  }

  on<K extends keyof SignalREvents>(
    event: K,
    handler: SignalREvents[K]
  ): () => void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }

    const handlers = this.eventHandlers.get(event)!;
    const eventHandler = handler as EventHandler;
    handlers.add(eventHandler);

    // Return cleanup function
    return () => {
      handlers.delete(eventHandler);
      if (handlers.size === 0) {
        this.eventHandlers.delete(event);
      }
    };
  }

  off<K extends keyof SignalREvents>(
    event: K,
    handler?: SignalREvents[K]
  ): void {
    if (handler) {
      // Remove specific handler
      const handlers = this.eventHandlers.get(event);
      if (handlers) {
        handlers.delete(handler as EventHandler);
        if (handlers.size === 0) {
          this.eventHandlers.delete(event);
        }
      }
    } else {
      // Remove all handlers for this event
      this.eventHandlers.delete(event);
    }
  }

  get isConnected(): boolean {
    return this.connection?.state === HubConnectionState.Connected;
  }

  get connectionState(): HubConnectionState | null {
    return this.connection?.state ?? null;
  }

  // Join/leave groups for targeted notifications
  async joinWorkspaceGroup(workspaceId: string): Promise<void> {
    if (!this.isConnected) return;
    await this.connection?.invoke('JoinWorkspaceGroup', workspaceId);
  }

  async leaveWorkspaceGroup(workspaceId: string): Promise<void> {
    if (!this.isConnected) return;
    await this.connection?.invoke('LeaveWorkspaceGroup', workspaceId);
  }

  // Session presence methods
  async enterSession(sessionId: number): Promise<void> {
    if (!this.isConnected) return;
    await this.connection?.invoke('EnterSession', sessionId);
  }

  async exitSession(sessionId: number): Promise<void> {
    if (!this.isConnected) return;
    await this.connection?.invoke('ExitSession', sessionId);
  }
}

// Create and export singleton instance
export const signalRService = new SignalRService();
export default signalRService;

import { create } from 'zustand';
import { TaskStatus } from '@/types/entities';

export interface TaskExecution {
  taskExecutionId: string;
  output: string;
  status: TaskStatus;
  startTime?: Date;
  endTime?: Date;
}

export function getTaskExecutionKey(
  taskId: number,
  isSession: boolean
): string {
  return `${isSession ? 'session' : 'env'}-${taskId}`;
}

interface TaskExecutionState {
  taskExecutions: Record<string, TaskExecution>;
  taskExecutionsMap: Record<string, string>;
}

interface TaskExecutionActions {
  // Task execution management
  setTaskExecution: (
    taskExecutionId: string,
    execution: Partial<TaskExecution>
  ) => void;
  updateTaskOutput: (taskExecutionId: string, output: string) => void;
  updateTaskStatus: (taskExecutionId: string, status: TaskStatus) => void;
  getTaskExecution: (taskExecutionId: string) => TaskExecution | undefined;

  // Task to execution mapping
  mapTaskToExecution: (
    taskId: number,
    isSession: boolean,
    taskExecutionId: string
  ) => void;
  getTaskExecutionId: (
    taskId: number,
    isSession: boolean
  ) => string | undefined;
}

export const useTaskExecutionStore = create<
  TaskExecutionState & TaskExecutionActions
>((set, get) => ({
  taskExecutions: {},
  taskExecutionsMap: {},

  setTaskExecution: (taskExecutionId, executionData) => {
    const { taskExecutions } = get();
    const existing = taskExecutions[taskExecutionId] || {
      taskExecutionId,
      output: '',
      status: TaskStatus.Pending
    };

    set({
      taskExecutions: {
        ...taskExecutions,
        [taskExecutionId]: {
          ...existing,
          ...executionData,
          taskExecutionId // Ensure ID is always set
        }
      }
    });
  },

  updateTaskOutput: (taskExecutionId, output) => {
    const { taskExecutions } = get();
    const existing = taskExecutions[taskExecutionId];

    if (existing) {
      set({
        taskExecutions: {
          ...taskExecutions,
          [taskExecutionId]: {
            ...existing,
            output
          }
        }
      });
    }
  },

  updateTaskStatus: (taskExecutionId, status) => {
    const { taskExecutions } = get();
    const existing = taskExecutions[taskExecutionId];

    const now = new Date();
    const updates: Partial<TaskExecution> = { status };

    // Set end time for completed/failed/canceled tasks
    if (
      status === TaskStatus.Completed ||
      status === TaskStatus.Failed ||
      status === TaskStatus.Canceled
    ) {
      updates.endTime = now;
    }

    // Set start time if transitioning to running
    if (status === TaskStatus.Running && !existing?.startTime) {
      updates.startTime = now;
    }

    set({
      taskExecutions: {
        ...taskExecutions,
        [taskExecutionId]: {
          ...existing,
          ...updates
        }
      }
    });
  },

  getTaskExecution: (taskExecutionId) => {
    const { taskExecutions } = get();
    return taskExecutions[taskExecutionId];
  },

  mapTaskToExecution: (taskId, isSession, taskExecutionId) => {
    const { taskExecutionsMap } = get();
    const key = getTaskExecutionKey(taskId, isSession);
    set({
      taskExecutionsMap: {
        ...taskExecutionsMap,
        [key]: taskExecutionId
      }
    });
  },

  getTaskExecutionId: (taskId, isSession) => {
    const { taskExecutionsMap } = get();
    return taskExecutionsMap[getTaskExecutionKey(taskId, isSession)];
  }
}));

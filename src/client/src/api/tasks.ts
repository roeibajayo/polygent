import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  type Options
} from './index';
import type {
  Task,
  CreateTask,
  UpdateTask,
  GetTaskOutputResponseDto
} from '../types/entities';

export const tasksApi = {
  /**
   * Get tasks for a workspace
   */
  async getByWorkspaceId(
    workspaceId: number,
    options?: Options
  ): Promise<Task[]> {
    return fetchGet<Task[]>(`/api/workspaces/${workspaceId}/tasks`, options);
  },

  /**
   * Get task by ID
   */
  async getById(id: number, options?: Options): Promise<Task> {
    return fetchGet<Task>(`/api/tasks/${id}`, options);
  },

  /**
   * Create a new task in a workspace
   */
  async create(
    workspaceId: number,
    task: CreateTask,
    options?: Options
  ): Promise<Task> {
    return fetchPost<Task>(
      `/api/workspaces/${workspaceId}/tasks`,
      task,
      options
    );
  },

  /**
   * Update an existing task
   */
  async update(id: number, task: UpdateTask, options?: Options): Promise<Task> {
    return fetchPut<Task>(`/api/tasks/${id}`, task, options);
  },

  /**
   * Delete a task
   */
  async delete(id: number, options?: Options): Promise<void> {
    return fetchDelete<void>(`/api/tasks/${id}`, options);
  },

  /**
   * Stop a running task in an environment
   */
  async stopTask(taskExecutionId: string, options?: Options): Promise<void> {
    return fetchPost<void>(`/api/tasks/${taskExecutionId}/stop`, {}, options);
  },

  /**
   * Get task output from an environment
   */
  async getTaskOutput(
    taskExecutionId: string,
    options?: Options
  ): Promise<GetTaskOutputResponseDto> {
    return fetchGet<GetTaskOutputResponseDto>(
      `/api/tasks/${taskExecutionId}/output`,
      options
    );
  }
};

export default tasksApi;

import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  type Options
} from './index';
import type {
  Environment,
  CreateEnvironment,
  UpdateEnvironment,
  EnvironmentTask,
  StartEnvironmentTaskResponse
} from '../types/entities';

export const deploySessionToEnvironment = (
  sessionId: number,
  environmentId: number,
  restartAfterSync?: boolean
) =>
  fetchPost(
    `/api/sessions/${sessionId}/actions/deploy-to-environment?environmentId=${environmentId}${restartAfterSync ? '&restartAfterSync=true' : ''}`
  );

export const environmentsApi = {
  /**
   * Get environments for a workspace
   */
  async getByWorkspaceId(
    workspaceId: number,
    options?: Options
  ): Promise<Environment[]> {
    return fetchGet<Environment[]>(
      `/api/workspaces/${workspaceId}/environments`,
      options
    );
  },

  /**
   * Get environment by ID
   */
  async getById(id: number, options?: Options): Promise<Environment> {
    return fetchGet<Environment>(`/api/environments/${id}`, options);
  },

  /**
   * Create a new environment in a workspace
   */
  async create(
    workspaceId: number,
    environment: CreateEnvironment,
    options?: Options
  ): Promise<Environment> {
    return fetchPost<Environment>(
      `/api/workspaces/${workspaceId}/environments`,
      environment,
      options
    );
  },

  /**
   * Update an existing environment
   */
  async update(
    id: number,
    environment: UpdateEnvironment,
    options?: Options
  ): Promise<Environment> {
    return fetchPut<Environment>(
      `/api/environments/${id}`,
      environment,
      options
    );
  },

  /**
   * Delete an environment
   */
  async delete(id: number, options?: Options): Promise<void> {
    return fetchDelete<void>(`/api/environments/${id}`, options);
  },

  /**
   * Validate a git branch for a workspace
   */
  async validateGitBranch(
    workspaceId: number,
    branch: string,
    options?: Options
  ): Promise<{ valid: boolean; message: string }> {
    return fetchGet<{ valid: boolean; message: string }>(
      `/api/workspaces/${workspaceId}/environments/validate-branch/${encodeURIComponent(branch)}`,
      options
    );
  },

  /**
   * Get tasks for an environment
   */
  async getTasks(
    environmentId: number,
    options?: Options
  ): Promise<EnvironmentTask[]> {
    return fetchGet<EnvironmentTask[]>(
      `/api/environments/${environmentId}/tasks`,
      options
    );
  },

  /**
   * Start a task in an environment
   */
  async startTask(
    environmentId: number,
    taskId: number,
    options?: Options
  ): Promise<StartEnvironmentTaskResponse> {
    return fetchPost<StartEnvironmentTaskResponse>(
      `/api/environments/${environmentId}/tasks/${taskId}/start`,
      {},
      options
    );
  },

  /**
   * Reset environment git repository (hard reset + pull)
   */
  async reset(
    environmentId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/environments/${environmentId}/reset`,
      {},
      options
    );
  }
};

export default environmentsApi;

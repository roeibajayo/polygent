import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  type Options
} from './index';
import type {
  WorkspaceEnvironmentVariable,
  CreateWorkspaceEnvironmentVariable,
  UpdateWorkspaceEnvironmentVariable
} from '../types/entities';

export const workspaceEnvironmentVariablesApi = {
  /**
   * Get all environment variables for a workspace
   */
  async getByWorkspaceId(
    workspaceId: number,
    options?: Options
  ): Promise<WorkspaceEnvironmentVariable[]> {
    return fetchGet<WorkspaceEnvironmentVariable[]>(
      `/api/workspaces/${workspaceId}/variables`,
      options
    );
  },

  /**
   * Create a new workspace environment variable
   */
  async create(
    workspaceId: number,
    variable: CreateWorkspaceEnvironmentVariable,
    options?: Options
  ): Promise<WorkspaceEnvironmentVariable> {
    return fetchPost<WorkspaceEnvironmentVariable>(
      `/api/workspaces/${workspaceId}/variables`,
      variable,
      options
    );
  },

  /**
   * Update an existing workspace environment variable by key
   */
  async update(
    workspaceId: number,
    key: string,
    variable: UpdateWorkspaceEnvironmentVariable,
    options?: Options
  ): Promise<WorkspaceEnvironmentVariable> {
    return fetchPut<WorkspaceEnvironmentVariable>(
      `/api/workspaces/${workspaceId}/variables/${encodeURIComponent(key)}`,
      variable,
      options
    );
  },

  /**
   * Delete a workspace environment variable by key
   */
  async delete(
    workspaceId: number,
    key: string,
    options?: Options
  ): Promise<void> {
    return fetchDelete<void>(
      `/api/workspaces/${workspaceId}/variables/${encodeURIComponent(key)}`,
      options
    );
  }
};

export default workspaceEnvironmentVariablesApi;

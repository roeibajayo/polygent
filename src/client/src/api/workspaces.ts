import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  type Options
} from './index';
import type {
  Workspace,
  CreateWorkspace,
  UpdateWorkspace
} from '../types/entities';

export const workspacesApi = {
  /**
   * Get all workspaces
   */
  async getAll(options?: Options): Promise<Workspace[]> {
    return fetchGet<Workspace[]>('/api/workspaces', options);
  },

  /**
   * Get workspace by ID
   */
  async getById(id: number, options?: Options): Promise<Workspace> {
    return fetchGet<Workspace>(`/api/workspaces/${id}`, options);
  },

  /**
   * Create a new workspace
   */
  async create(
    workspace: CreateWorkspace,
    options?: Options
  ): Promise<Workspace> {
    return fetchPost<Workspace>('/api/workspaces', workspace, options);
  },

  /**
   * Update an existing workspace
   */
  async update(
    id: number,
    workspace: UpdateWorkspace,
    options?: Options
  ): Promise<Workspace> {
    return fetchPut<Workspace>(`/api/workspaces/${id}`, workspace, options);
  },

  /**
   * Delete a workspace
   */
  async delete(id: number, options?: Options): Promise<void> {
    return fetchDelete<void>(`/api/workspaces/${id}`, options);
  },

  /**
   * Get git branches for a workspace
   */
  async getGitBranches(
    workspaceId: number,
    options?: Options
  ): Promise<string[]> {
    return fetchGet<string[]>(
      `/api/workspaces/${workspaceId}/git/branches`,
      options
    );
  }
};

export default workspacesApi;

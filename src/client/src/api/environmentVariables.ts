import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  type Options
} from './index';
import type {
  EnvironmentVariable,
  CreateEnvironmentVariable,
  UpdateEnvironmentVariable
} from '../types/entities';

export const environmentVariablesApi = {
  /**
   * Get all environment variables for an environment
   */
  async getByEnvironmentId(
    environmentId: number,
    options?: Options
  ): Promise<EnvironmentVariable[]> {
    return fetchGet<EnvironmentVariable[]>(
      `/api/environments/${environmentId}/variables`,
      options
    );
  },

  /**
   * Create a new environment variable
   */
  async create(
    environmentId: number,
    variable: CreateEnvironmentVariable,
    options?: Options
  ): Promise<EnvironmentVariable> {
    return fetchPost<EnvironmentVariable>(
      `/api/environments/${environmentId}/variables`,
      variable,
      options
    );
  },

  /**
   * Update an existing environment variable by key
   */
  async update(
    environmentId: number,
    key: string,
    variable: UpdateEnvironmentVariable,
    options?: Options
  ): Promise<EnvironmentVariable> {
    return fetchPut<EnvironmentVariable>(
      `/api/environments/${environmentId}/variables/${encodeURIComponent(key)}`,
      variable,
      options
    );
  },

  /**
   * Delete an environment variable by key
   */
  async delete(
    environmentId: number,
    key: string,
    options?: Options
  ): Promise<void> {
    return fetchDelete<void>(
      `/api/environments/${environmentId}/variables/${encodeURIComponent(key)}`,
      options
    );
  }
};

export default environmentVariablesApi;

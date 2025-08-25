import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  type Options
} from './index';
import type { Backlog, CreateBacklog, UpdateBacklog } from '../types/entities';

export const backlogsApi = {
  /**
   * Get all backlogs
   */
  async getAll(options?: Options): Promise<Backlog[]> {
    return fetchGet<Backlog[]>('/api/backlogs', options);
  },

  /**
   * Get backlog by ID
   */
  async getById(id: number, options?: Options): Promise<Backlog> {
    return fetchGet<Backlog>(`/api/backlogs/${id}`, options);
  },

  /**
   * Create a new backlog
   */
  async create(backlog: CreateBacklog, options?: Options): Promise<Backlog> {
    return fetchPost<Backlog>('/api/backlogs', backlog, options);
  },

  /**
   * Update an existing backlog
   */
  async update(
    id: number,
    backlog: UpdateBacklog,
    options?: Options
  ): Promise<Backlog> {
    return fetchPut<Backlog>(`/api/backlogs/${id}`, backlog, options);
  },

  /**
   * Delete a backlog
   */
  async delete(id: number, options?: Options): Promise<void> {
    return fetchDelete<void>(`/api/backlogs/${id}`, options);
  }
};

export default backlogsApi;

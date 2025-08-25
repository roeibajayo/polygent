import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  type Options
} from './index';
import type { Agent, CreateAgent, UpdateAgent } from '../types/entities';

export const agentsApi = {
  /**
   * Get all agents
   */
  async getAll(options?: Options): Promise<Agent[]> {
    return fetchGet<Agent[]>('/api/agents', options);
  },

  /**
   * Get agent by ID
   */
  async getById(id: number, options?: Options): Promise<Agent> {
    return fetchGet<Agent>(`/api/agents/${id}`, options);
  },

  /**
   * Create a new agent
   */
  async create(agent: CreateAgent, options?: Options): Promise<Agent> {
    return fetchPost<Agent>('/api/agents', agent, options);
  },

  /**
   * Update an existing agent
   */
  async update(
    id: number,
    agent: UpdateAgent,
    options?: Options
  ): Promise<Agent> {
    return fetchPut<Agent>(`/api/agents/${id}`, agent, options);
  },

  /**
   * Delete an agent
   */
  async delete(id: number, options?: Options): Promise<void> {
    return fetchDelete<void>(`/api/agents/${id}`, options);
  }
};

export default agentsApi;

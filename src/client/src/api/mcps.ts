import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  type Options
} from './index';
import type { MCP, CreateMCP, UpdateMCP } from '../types/entities';

export const mcpsApi = {
  /**
   * Get all MCPs
   */
  async getAll(options?: Options): Promise<MCP[]> {
    return fetchGet<MCP[]>('/api/mcps', options);
  },

  /**
   * Get MCP by ID
   */
  async getById(id: number, options?: Options): Promise<MCP> {
    return fetchGet<MCP>(`/api/mcps/${id}`, options);
  },

  /**
   * Create a new MCP
   */
  async create(mcp: CreateMCP, options?: Options): Promise<MCP> {
    return fetchPost<MCP>('/api/mcps', mcp, options);
  },

  /**
   * Update an existing MCP
   */
  async update(id: number, mcp: UpdateMCP, options?: Options): Promise<MCP> {
    return fetchPut<MCP>(`/api/mcps/${id}`, mcp, options);
  },

  /**
   * Delete an MCP
   */
  async delete(id: number, options?: Options): Promise<void> {
    return fetchDelete<void>(`/api/mcps/${id}`, options);
  }
};

export default mcpsApi;

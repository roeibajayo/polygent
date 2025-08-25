import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  type Options
} from './index';
import type {
  Message,
  UpdateMessage,
  SendMessageRequest
} from '../types/entities';

export const messagesApi = {
  /**
   * Get messages for a session
   */
  async getBySessionId(
    sessionId: number,
    options?: Options
  ): Promise<Message[]> {
    return fetchGet<Message[]>(`/api/sessions/${sessionId}/messages`, options);
  },

  /**
   * Get a specific message
   */
  async getById(
    sessionId: number,
    messageId: number,
    options?: Options
  ): Promise<Message> {
    return fetchGet<Message>(
      `/api/sessions/${sessionId}/messages/${messageId}`,
      options
    );
  },

  /**
   * Send a message and get AI response
   */
  async send(
    sessionId: number,
    request: SendMessageRequest,
    options?: Options
  ): Promise<{ success: boolean; messageId?: number; error?: string }> {
    return fetchPost<{ success: boolean; messageId?: number; error?: string }>(
      `/api/sessions/${sessionId}/messages/send`,
      request,
      options
    );
  },

  /**
   * Update an existing message
   */
  async update(
    sessionId: number,
    id: number,
    message: UpdateMessage,
    options?: Options
  ): Promise<void> {
    return fetchPut<void>(
      `/api/sessions/${sessionId}/messages/${id}`,
      message,
      options
    );
  },

  /**
   * Delete a message
   */
  async delete(
    sessionId: number,
    messageId: number,
    options?: Options
  ): Promise<void> {
    return fetchDelete<void>(
      `/api/sessions/${sessionId}/messages/${messageId}`,
      options
    );
  }
};

export default messagesApi;

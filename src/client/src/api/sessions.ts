import {
  fetchGet,
  fetchPost,
  fetchPut,
  fetchDelete,
  type Options
} from './index';
import type {
  Session,
  CreateSession,
  UpdateSession,
  SessionFile,
  GitStatusResult,
  Editor,
  SessionTask,
  StartSessionTaskResponse
} from '../types/entities';

export const sessionsApi = {
  /**
   * Get all active sessions
   */
  async getAll(options?: Options): Promise<Session[]> {
    return fetchGet<Session[]>('/api/sessions', options);
  },

  /**
   * Get session by ID
   */
  async getById(id: number, options?: Options): Promise<Session> {
    return fetchGet<Session>(`/api/sessions/${id}`, options);
  },

  /**
   * Get sessions by workspace ID
   */
  async getByWorkspaceId(
    workspaceId: number,
    options?: Options
  ): Promise<Session[]> {
    return fetchGet<Session[]>(
      `/api/workspaces/${workspaceId}/sessions`,
      options
    );
  },

  /**
   * Create a new session
   */
  async create(session: CreateSession, options?: Options): Promise<Session> {
    return fetchPost<Session>('/api/sessions', session, options);
  },

  /**
   * Update an existing session
   */
  async update(
    id: number,
    session: UpdateSession,
    options?: Options
  ): Promise<Session> {
    return fetchPut<Session>(`/api/sessions/${id}`, session, options);
  },

  /**
   * Delete a session
   */
  async delete(id: number, options?: Options): Promise<void> {
    return fetchDelete<void>(`/api/sessions/${id}`, options);
  },

  /**
   * Get files for a session folder
   */
  async getFiles(
    sessionId: number,
    folderPath?: string,
    options?: Options
  ): Promise<SessionFile[]> {
    const queryParam = folderPath
      ? `?folderPath=${encodeURIComponent(folderPath)}`
      : '';
    return fetchGet<SessionFile[]>(
      `/api/sessions/${sessionId}/files${queryParam}`,
      options
    );
  },

  /**
   * Get file content for a session
   */
  async getFileContent(
    sessionId: number,
    filePath: string,
    options?: Options
  ): Promise<{ content: string; filePath: string; lastModified: string }> {
    return fetchGet<{
      content: string;
      filePath: string;
      lastModified: string;
    }>(
      `/api/sessions/${sessionId}/files/content?filePath=${encodeURIComponent(filePath)}`,
      options
    );
  },

  /**
   * Update file content
   */
  async updateFileContent(
    sessionId: number,
    filePath: string,
    content: string,
    lastModified?: string,
    options?: Options
  ): Promise<{ message: string; lastModified: string }> {
    return fetchPut<{ message: string; lastModified: string }>(
      `/api/sessions/${sessionId}/files/content`,
      { filePath, content, lastModified },
      options
    );
  },

  /**
   * Get git status for a session
   */
  async getGitStatus(
    sessionId: number,
    options?: Options
  ): Promise<GitStatusResult> {
    return fetchGet<GitStatusResult>(
      `/api/sessions/${sessionId}/git/status`,
      options
    );
  },

  /**
   * Get git file content for a specific file in session by mode
   */
  async getGitFileContent(
    sessionId: number,
    filePath: string,
    mode?: 'Working' | 'Head' | 'Staged',
    options?: Options
  ): Promise<{ filePath: string; mode: string; content: string }> {
    const modeParam = mode ? `&mode=${mode}` : '';
    return fetchGet<{ filePath: string; mode: string; content: string }>(
      `/api/sessions/${sessionId}/git/file?filePath=${encodeURIComponent(filePath)}${modeParam}`,
      options
    );
  },

  /**
   * Unstage all staged changes in session
   */
  async unstageAllChanges(
    sessionId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/git/unstage-all`,
      {},
      options
    );
  },

  /**
   * Unstage specific file in session
   */
  async unstageFile(
    sessionId: number,
    filePath: string,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/git/unstage-file`,
      { filePath },
      options
    );
  },

  /**
   * Discard all changes (staged and unstaged) in session
   */
  async discardAllChanges(
    sessionId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/git/discard-all`,
      {},
      options
    );
  },

  /**
   * Discard changes for specific file in session
   */
  async discardFileChanges(
    sessionId: number,
    filePath: string,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/git/discard-file`,
      { filePath },
      options
    );
  },

  /**
   * Stage all changes in session
   */
  async stageAllChanges(
    sessionId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/git/stage-all`,
      {},
      options
    );
  },

  /**
   * Stage specific file in session
   */
  async stageFile(
    sessionId: number,
    filePath: string,
    options?: Options
  ): Promise<{ message: string; filePath: string }> {
    return fetchPost<{ message: string; filePath: string }>(
      `/api/sessions/${sessionId}/git/stage-file`,
      { filePath },
      options
    );
  },

  /**
   * Get available editors for session
   */
  async getAvailableEditors(
    sessionId: number,
    options?: Options
  ): Promise<Editor[]> {
    return fetchGet<Editor[]>(`/api/sessions/${sessionId}/editors`, options);
  },

  /**
   * Open file with external editor
   */
  async openFileWithEditor(
    sessionId: number,
    filePath: string,
    editorId: string,
    options?: Options
  ): Promise<{ message: string; filePath: string }> {
    return fetchPost<{ message: string; filePath: string }>(
      `/api/sessions/${sessionId}/files/open`,
      { filePath, editorId },
      options
    );
  },

  /**
   * Open file's containing folder in system explorer
   */
  async openFileFolder(
    sessionId: number,
    filePath: string,
    options?: Options
  ): Promise<{ message: string; filePath: string }> {
    return fetchPost<{ message: string; filePath: string }>(
      `/api/sessions/${sessionId}/files/open-folder`,
      { filePath },
      options
    );
  },

  /**
   * Create new file
   */
  async createFile(
    sessionId: number,
    filePath: string,
    content?: string,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/files`,
      { filePath, content },
      options
    );
  },

  /**
   * Create new folder
   */
  async createFolder(
    sessionId: number,
    folderPath: string,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/folders`,
      { folderPath },
      options
    );
  },

  /**
   * Rename file or directory
   */
  async renameFile(
    sessionId: number,
    oldPath: string,
    newName: string,
    options?: Options
  ): Promise<{
    message: string;
    oldPath: string;
    newPath: string;
    newName: string;
  }> {
    return fetchPut<{
      message: string;
      oldPath: string;
      newPath: string;
      newName: string;
    }>(
      `/api/sessions/${sessionId}/files/rename`,
      { oldPath, newName },
      options
    );
  },

  /**
   * Delete file or directory
   */
  async deleteFile(
    sessionId: number,
    filePath: string,
    options?: Options
  ): Promise<{ message: string; filePath: string }> {
    return fetchDelete<{ message: string; filePath: string }>(
      `/api/sessions/${sessionId}/files?filePath=${encodeURIComponent(filePath)}`,
      options
    );
  },

  /**
   * Merge session to main branch
   */
  async mergeToMain(
    sessionId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/actions/merge-to-main`,
      {},
      options
    );
  },

  /**
   * Push session branch
   */
  async pushBranch(
    sessionId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/actions/push-branch`,
      {},
      options
    );
  },

  /**
   * Pull from starter branch
   */
  async pullFromStarterBranch(
    sessionId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/actions/pull-from-starter`,
      {},
      options
    );
  },

  /**
   * Reset session (remove all messages and set status to ready)
   */
  async resetSession(
    sessionId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/actions/reset`,
      {},
      options
    );
  },

  /**
   * Cancel session
   */
  async cancelSession(
    sessionId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/actions/cancel`,
      {},
      options
    );
  },

  /**
   * Stop working messages (without canceling the session)
   */
  async stopWorkingMessages(
    sessionId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/actions/stop`,
      {},
      options
    );
  },

  /**
   * Open session with VSCode
   */
  async openWithVSCode(
    sessionId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/actions/open-with-vscode`,
      {},
      options
    );
  },

  /**
   * Cancel a specific message
   */
  async cancelMessage(
    sessionId: number,
    messageId: number,
    options?: Options
  ): Promise<{ message: string }> {
    return fetchPost<{ message: string }>(
      `/api/sessions/${sessionId}/actions/stop?messageId=${messageId}`,
      {},
      options
    );
  },

  /**
   * Get tasks for a session
   */
  async getTasks(sessionId: number, options?: Options): Promise<SessionTask[]> {
    return fetchGet<SessionTask[]>(`/api/sessions/${sessionId}/tasks`, options);
  },

  /**
   * Start a task for a session
   */
  async startTask(
    sessionId: number,
    taskId: number,
    options?: Options
  ): Promise<StartSessionTaskResponse> {
    return fetchPost<StartSessionTaskResponse>(
      `/api/sessions/${sessionId}/tasks/${taskId}/start`,
      {},
      options
    );
  },

  /**
   * Clear unread messages flag for a session
   */
  async clearUnreadMessages(
    sessionId: number,
    options?: Options
  ): Promise<void> {
    return fetchPost<void>(
      `/api/sessions/${sessionId}/clear-unread`,
      {},
      options
    );
  }
};

export default sessionsApi;

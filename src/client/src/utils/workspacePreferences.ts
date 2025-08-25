interface WorkspacePreferences {
  lastSelectedBranch?: string;
  lastSelectedAgentId?: number;
}

const STORAGE_KEY = 'polygent_workspace_preferences';

export const workspacePreferences = {
  /**
   * Get preferences for a specific workspace
   */
  getPreferences(workspaceId: number): WorkspacePreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return {};

      const allPreferences = JSON.parse(stored) as Record<
        string,
        WorkspacePreferences
      >;
      return allPreferences[workspaceId.toString()] || {};
    } catch (error) {
      console.error('Failed to load workspace preferences:', error);
      return {};
    }
  },

  /**
   * Save preferences for a specific workspace
   */
  savePreferences(
    workspaceId: number,
    preferences: WorkspacePreferences
  ): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allPreferences = stored
        ? (JSON.parse(stored) as Record<string, WorkspacePreferences>)
        : {};

      allPreferences[workspaceId.toString()] = {
        ...allPreferences[workspaceId.toString()],
        ...preferences
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(allPreferences));
    } catch (error) {
      console.error('Failed to save workspace preferences:', error);
    }
  },

  /**
   * Save last selected branch for a workspace
   */
  saveLastBranch(workspaceId: number, branch: string): void {
    this.savePreferences(workspaceId, { lastSelectedBranch: branch });
  },

  /**
   * Save last selected agent for a workspace
   */
  saveLastAgent(workspaceId: number, agentId: number): void {
    this.savePreferences(workspaceId, { lastSelectedAgentId: agentId });
  },

  /**
   * Get last selected branch for a workspace
   */
  getLastBranch(workspaceId: number): string | undefined {
    return this.getPreferences(workspaceId).lastSelectedBranch;
  },

  /**
   * Get last selected agent for a workspace
   */
  getLastAgent(workspaceId: number): number | undefined {
    return this.getPreferences(workspaceId).lastSelectedAgentId;
  }
};

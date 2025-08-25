import { useState, useEffect } from 'react';
import { Button, Dropdown, Modal, GitBranchSelector } from '@/components';
import { Agent } from '@/types';
import { agentsApi, workspacesApi } from '@/api';
import { workspacePreferences } from '@/utils';
import { useWorkspaceStore } from '@/stores';

interface CreateSessionModalProps {
  isOpen: boolean;
  activeWorkspaceId: number | null;
  defaultName?: string;
  onCreateSession: (data: {
    workspaceId: number;
    starterGitBranch: string;
    agentId: number;
    name?: string | null;
  }) => Promise<void>;
  onCancel: () => void;
}

export default function CreateSessionModal({
  isOpen,
  activeWorkspaceId,
  defaultName,
  onCreateSession,
  onCancel
}: CreateSessionModalProps) {
  const { workspaces } = useWorkspaceStore();
  const [selectedGitBranch, setSelectedGitBranch] = useState<string>('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    activeWorkspaceId
  );
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [sessionName, setSessionName] = useState<string>('');
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingSession, setIsCreatingSession] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadAgents();
      setSelectedGitBranch('');
      setSelectedWorkspaceId(activeWorkspaceId);
      setSelectedAgentId(null);
      setSessionName(defaultName || '');
      setIsCreatingSession(false);
    }
  }, [isOpen, activeWorkspaceId, defaultName]);

  useEffect(() => {
    if (selectedWorkspaceId) {
      // Auto-select agent based on workspace preference if agents are already loaded
      if (agents.length > 0) {
        const lastSelectedAgentId =
          workspacePreferences.getLastAgent(selectedWorkspaceId);
        if (
          lastSelectedAgentId &&
          agents.some((agent) => agent.id === lastSelectedAgentId)
        ) {
          setSelectedAgentId(lastSelectedAgentId);
        } else {
          setSelectedAgentId(null); // Reset if no preference or agent not found
        }
      }

      // Restore last selected branch preference (GitBranchSelector will handle auto-selection if no preference)
      const lastSelectedBranch =
        workspacePreferences.getLastBranch(selectedWorkspaceId);
      if (lastSelectedBranch) {
        setSelectedGitBranch(lastSelectedBranch);
      } else {
        setSelectedGitBranch(''); // Will be auto-selected by GitBranchSelector
      }
    } else {
      setSelectedGitBranch('');
      setSelectedAgentId(null);
    }
  }, [selectedWorkspaceId, agents]);

  const loadAgents = async () => {
    try {
      setIsLoading(true);
      const agentsData = await agentsApi.getAll();
      setAgents(agentsData);

      // Auto-select agent based on workspace preference if available
      if (selectedWorkspaceId) {
        const lastSelectedAgentId =
          workspacePreferences.getLastAgent(selectedWorkspaceId);
        if (
          lastSelectedAgentId &&
          agentsData.some((agent) => agent.id === lastSelectedAgentId)
        ) {
          setSelectedAgentId(lastSelectedAgentId);
        }
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedWorkspaceId || !selectedGitBranch || !selectedAgentId) {
      return;
    }

    try {
      setIsCreatingSession(true);

      // Save preferences before creating session
      workspacePreferences.saveLastBranch(
        selectedWorkspaceId,
        selectedGitBranch
      );
      workspacePreferences.saveLastAgent(selectedWorkspaceId, selectedAgentId);

      await onCreateSession({
        workspaceId: selectedWorkspaceId,
        starterGitBranch: selectedGitBranch,
        agentId: selectedAgentId,
        name: sessionName.trim() || null
      });
    } catch (error) {
      console.error('Failed to create session:', error);
      setIsCreatingSession(false);
    }
  };

  const isValid =
    selectedWorkspaceId && selectedGitBranch.trim() && selectedAgentId;

  const workspaceOptions = workspaces.map((workspace) => ({
    value: workspace.id.toString(),
    label: workspace.name
  }));

  const agentOptions = agents.map((agent) => ({
    value: agent.id.toString(),
    label: `${agent.name}` + (agent.roleName ? ` (${agent.roleName})` : '')
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={isCreatingSession ? () => {} : onCancel}
      title="Create Session"
      size="sm"
      contentClassName="p-6"
      footer={
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!isValid || isLoading}
            loading={isCreatingSession}>
            {isCreatingSession ? 'Creating Session...' : 'Create Session'}
          </Button>
          <Button
            variant="ghost"
            onClick={onCancel}
            disabled={isCreatingSession}>
            Cancel
          </Button>
        </div>
      }>
      <div
        className="space-y-4"
        style={{ opacity: isCreatingSession ? 0.6 : 1 }}>
        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Session Name
          </label>
          <input
            type="text"
            value={sessionName}
            onChange={(e) => setSessionName(e.target.value)}
            placeholder="Enter session name (optional)"
            className="w-full px-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-sm bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 focus:border-transparent"
            maxLength={100}
            disabled={isCreatingSession}
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            You can set it later
          </p>
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Workspace
          </label>
          <Dropdown
            options={workspaceOptions}
            value={selectedWorkspaceId?.toString()}
            placeholder="Select workspace"
            onSelect={
              isCreatingSession
                ? () => {}
                : (option) => {
                    setSelectedWorkspaceId(parseInt(option.value));
                    // Git branch and agent will be auto-selected by useEffect based on preferences
                  }
            }
          />
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Start Git Branch
          </label>
          {selectedWorkspaceId ? (
            <GitBranchSelector
              workspaceId={selectedWorkspaceId}
              value={selectedGitBranch}
              onSelect={
                isCreatingSession
                  ? () => {}
                  : (branch) => {
                      setSelectedGitBranch(branch);
                      // Save preference
                      if (selectedWorkspaceId) {
                        workspacePreferences.saveLastBranch(
                          selectedWorkspaceId,
                          branch
                        );
                      }
                    }
              }
              placeholder="Select git branch"
            />
          ) : (
            <div className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
              Select workspace first
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Agent
          </label>
          {isLoading ? (
            <div className="px-3 py-2 text-neutral-500 dark:text-neutral-400">
              Loading agents...
            </div>
          ) : (
            <Dropdown
              options={agentOptions}
              value={selectedAgentId?.toString()}
              placeholder="Select agent"
              onSelect={
                isCreatingSession
                  ? () => {}
                  : (option) => setSelectedAgentId(parseInt(option.value))
              }
            />
          )}
        </div>
      </div>
    </Modal>
  );
}

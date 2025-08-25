import { useState, useEffect } from 'react';
import { Button, Dropdown, Modal, GitBranchSelector } from '@/components';
import { Agent, Backlog, Workspace } from '@/types';
import { agentsApi, workspacesApi } from '@/api';
import { workspacePreferences } from '@/utils';

interface StartBacklogSessionModalProps {
  isOpen: boolean;
  backlog: Backlog | null;
  workspaces: Workspace[];
  onCreateSession: (data: {
    workspaceId: number;
    starterGitBranch: string;
    agentId: number;
    backlogId: number;
    initialMessage: string;
  }) => void;
  onCancel: () => void;
}

export default function StartBacklogSessionModal({
  isOpen,
  backlog,
  workspaces,
  onCreateSession,
  onCancel
}: StartBacklogSessionModalProps) {
  const [selectedGitBranch, setSelectedGitBranch] = useState<string>('');
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<number | null>(
    null
  );
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && backlog) {
      loadAgents();
      setSelectedGitBranch('');
      setSelectedWorkspaceId(backlog.workspaceId || null);
      setSelectedAgentId(null);
    }
  }, [isOpen, backlog]);

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
          setSelectedAgentId(null);
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

  const handleSubmit = () => {
    if (
      !selectedWorkspaceId ||
      !selectedGitBranch ||
      !selectedAgentId ||
      !backlog
    ) {
      return;
    }

    // Save preferences before creating session
    workspacePreferences.saveLastBranch(selectedWorkspaceId, selectedGitBranch);
    workspacePreferences.saveLastAgent(selectedWorkspaceId, selectedAgentId);

    const initialMessage = `${backlog.title}\n\n${backlog.description}`;

    onCreateSession({
      workspaceId: selectedWorkspaceId,
      starterGitBranch: selectedGitBranch,
      agentId: selectedAgentId,
      backlogId: backlog.id,
      initialMessage
    });
  };

  const isValid =
    selectedWorkspaceId && selectedGitBranch.trim() && selectedAgentId;
  const showWorkspaceSelector = !backlog?.workspaceId;

  const workspaceOptions = workspaces.map((workspace) => ({
    value: workspace.id.toString(),
    label: workspace.name
  }));

  const agentOptions = agents.map((agent) => ({
    value: agent.id.toString(),
    label: agent.name + (agent.roleName ? ` (${agent.roleName})` : '')
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      title={`Start Session for "${backlog?.title}"`}
      size="sm"
      contentClassName="p-6"
      footer={
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={!isValid}
            loading={isLoading}>
            Start Session
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      }>
      <div className="space-y-4">
        {showWorkspaceSelector && (
          <div>
            <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
              Workspace
            </label>
            <Dropdown
              options={workspaceOptions}
              value={selectedWorkspaceId?.toString()}
              placeholder="Select workspace"
              onSelect={(option) => {
                setSelectedWorkspaceId(parseInt(option.value));
              }}
            />
          </div>
        )}

        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Start Git Branch
          </label>
          {selectedWorkspaceId ? (
            <GitBranchSelector
              workspaceId={selectedWorkspaceId}
              value={selectedGitBranch}
              onSelect={(branch) => {
                setSelectedGitBranch(branch);
                // Save preference
                if (selectedWorkspaceId) {
                  workspacePreferences.saveLastBranch(
                    selectedWorkspaceId,
                    branch
                  );
                }
              }}
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
              onSelect={(option) => setSelectedAgentId(parseInt(option.value))}
            />
          )}
        </div>

        <div className="bg-neutral-50 dark:bg-neutral-700 p-3 rounded-md">
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-1">
            Initial Message
          </label>
          <div className="text-sm text-neutral-600 dark:text-neutral-300 whitespace-pre-wrap">
            {backlog ? `${backlog.title}\n\n${backlog.description}` : ''}
          </div>
        </div>
      </div>
    </Modal>
  );
}

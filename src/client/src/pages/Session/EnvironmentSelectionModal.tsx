import { useState, useEffect } from 'react';
import { Button, Dropdown, Modal } from '@/components';
import { useEnvironments } from '@/hooks/useEnvironments';
import { deploySessionToEnvironment } from '@/api/environments';
import useGitStatus from '@/hooks/useGitStatus';

interface EnvironmentSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  workspaceId?: number;
}

export default function EnvironmentSelectionModal({
  isOpen,
  onClose,
  sessionId,
  workspaceId
}: EnvironmentSelectionModalProps) {
  const [selectedEnvironmentId, setSelectedEnvironmentId] =
    useState<string>('');
  const [isDeploying, setIsDeploying] = useState(false);
  const [restartAfterSync, setRestartAfterSync] = useState(true);

  const { environments, loading, error } = useEnvironments({
    workspaceId: workspaceId || 0,
    autoLoad: isOpen && !!workspaceId
  });

  const { gitStatus } = useGitStatus(sessionId);

  // Helper function to check if git has changes
  const hasGitChanges = () => {
    if (!gitStatus) return false;
    return (
      gitStatus.stagedFiles.length > 0 ||
      gitStatus.unstagedFiles.length > 0 ||
      gitStatus.untrackedFiles.length > 0
    );
  };

  // Auto-select first environment when environments load
  useEffect(() => {
    if (environments.length > 0 && !selectedEnvironmentId) {
      setSelectedEnvironmentId(environments[0].id.toString());
    }
  }, [environments, selectedEnvironmentId]);

  const handleDeploy = async () => {
    if (!selectedEnvironmentId) return;

    setIsDeploying(true);
    try {
      await deploySessionToEnvironment(
        sessionId,
        +selectedEnvironmentId,
        restartAfterSync
      );
      onClose();
      // TODO: Show success message
    } catch (error) {
      console.error('Failed to deploy to environment:', error);
      // TODO: Show error message
    } finally {
      setIsDeploying(false);
    }
  };

  const handleClose = () => {
    if (!isDeploying) {
      setSelectedEnvironmentId('');
      setRestartAfterSync(true);
      onClose();
    }
  };

  const environmentOptions = environments.map((env) => ({
    value: env.id.toString(),
    label: env.name
  }));

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Deploy to Environment"
      size="sm"
      contentClassName="p-6"
      footer={
        <div className="flex justify-end space-x-3">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeploying}>
            Cancel
          </Button>
          <Button
            onClick={handleDeploy}
            disabled={
              !selectedEnvironmentId ||
              isDeploying ||
              environments.length === 0 ||
              !hasGitChanges()
            }>
            {isDeploying ? 'Deploying...' : 'Deploy'}
          </Button>
        </div>
      }>
      <div className="space-y-4">
        <div>
          <label className="block text-sm text-neutral-700 dark:text-neutral-300 mb-2">
            Select Environment
          </label>
          {loading ? (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              Loading environments...
            </div>
          ) : error ? (
            <div className="text-sm text-red-500 dark:text-red-400">
              Error loading environments: {error}
            </div>
          ) : environments.length === 0 ? (
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              No environments found for this workspace.
            </div>
          ) : (
            <Dropdown
              value={selectedEnvironmentId}
              onSelect={(option) => setSelectedEnvironmentId(option.value)}
              options={environmentOptions}
              placeholder="Choose an environment..."
            />
          )}
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="restartAfterSync"
            checked={restartAfterSync}
            onChange={(e) => setRestartAfterSync(e.target.checked)}
            className="rounded border-neutral-300 dark:border-neutral-600 text-purple-600 dark:bg-neutral-700"
          />
          <label
            htmlFor="restartAfterSync"
            className="text-sm text-neutral-700 dark:text-neutral-300 cursor-pointer">
            Restart after sync
          </label>
        </div>
      </div>
    </Modal>
  );
}

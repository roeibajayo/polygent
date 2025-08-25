import { EnvironmentPanel } from '@/components';
import { useWorkspaceStore } from '@/stores';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useWorkspaceTasks } from '@/hooks/useWorkspaceTasks';

export default function Footer() {
  const { activeWorkspaceId, workspaces } = useWorkspaceStore();

  // Use the new environment hook
  const { environments } = useEnvironments({
    workspaceId: activeWorkspaceId ?? 0,
    autoLoad: true
  });

  // Track workspace tasks to trigger environment panel refresh
  const { lastUpdate } = useWorkspaceTasks(activeWorkspaceId);

  // Get the current workspace name
  const currentWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const workspaceName = currentWorkspace?.name;

  return (
    <footer className="border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-4 py-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <EnvironmentPanel
            environments={environments}
            className="min-w-32"
            taskUpdateTrigger={lastUpdate}
            workspaceName={workspaceName}
          />
        </div>

        <div className="flex items-center space-x-2">
          <div className="text-xs text-neutral-500 dark:text-neutral-400">v1.0.0</div>
        </div>
      </div>
    </footer>
  );
}

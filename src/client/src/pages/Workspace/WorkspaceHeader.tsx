import { Badge, Button } from '@/components';
import { PencilIcon } from 'lucide-react';
import { Workspace } from '@/types';

interface WorkspaceHeaderProps {
  workspace: Workspace;
  onWorkspaceEdit: () => void;
}

export default function WorkspaceHeader({
  workspace,
  onWorkspaceEdit
}: WorkspaceHeaderProps) {
  return (
    <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            {workspace.name}
          </h1>
          <Button variant="ghost" size="sm" onClick={onWorkspaceEdit}>
            <PencilIcon className="w-4 h-4 mr-2" />
          </Button>
          <Badge className="font-mono">{workspace.gitRepository}</Badge>
        </div>
      </div>
    </div>
  );
}

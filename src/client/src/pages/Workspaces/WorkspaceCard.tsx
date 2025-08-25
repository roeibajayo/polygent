import { Badge, Button } from '@/components';
import { Workspace } from '@/types';
import { Edit3, Trash2, FolderGit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface WorkspaceCardProps {
  workspace: Workspace;
  onEdit: (workspace: Workspace) => void;
  onDelete: (workspaceId: number) => void;
}

export default function WorkspaceCard({
  workspace,
  onEdit,
  onDelete
}: WorkspaceCardProps) {
  const navigate = useNavigate();

  const handleButtonClick = (e: React.MouseEvent, _action: () => void) => {
    e.stopPropagation();
    navigate(`/workspace/${workspace.id}`);
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <FolderGit2 className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg text-neutral-900 dark:text-neutral-100">
              {workspace.name}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleButtonClick(e, () => onEdit(workspace))}>
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => handleButtonClick(e, () => onDelete(workspace.id))}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <Badge className="font-mono">{workspace.gitRepository}</Badge>
      </div>
    </div>
  );
}

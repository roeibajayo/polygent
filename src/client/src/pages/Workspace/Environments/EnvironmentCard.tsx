import { Button } from '@/components';
import { Environment } from '@/types';
import {
  Edit3,
  Trash2,
  Globe,
  GitBranch,
  ExternalLink,
  Copy
} from 'lucide-react';

interface EnvironmentCardProps {
  environment: Environment;
  onEdit: (environment: Environment) => void;
  onDelete: (environmentId: number) => void;
  onClone: (environment: Environment) => void;
}

export default function EnvironmentCard({
  environment,
  onEdit,
  onDelete,
  onClone
}: EnvironmentCardProps) {
  return (
    <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 p-6 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg">
            <Globe className="w-6 h-6 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg text-neutral-900 dark:text-neutral-100">
              {environment.name}
            </h3>
            <div className="flex items-center gap-1 text-sm opacity-70">
              <GitBranch className="w-3 h-3" />
              {environment.gitBranch}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onClone(environment)}
            title="Clone environment">
            <Copy className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(environment)}
            title="Edit environment">
            <Edit3 className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(environment.id)}
            title="Delete environment">
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        {environment.url && (
          <div>
            <div className="flex items-center gap-2 mt-1">
              <a
                href={environment.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-purple-600 hover:text-purple-800 underline break-all font-mono">
                {environment.url}
              </a>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </div>
          </div>
        )}
        {Object.keys(environment.environmentVariables).length > 0 && (
          <div>
            <div className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">
              {Object.keys(environment.environmentVariables).length} variables
              configured
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

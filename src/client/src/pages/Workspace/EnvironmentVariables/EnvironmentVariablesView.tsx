import { Button, EnvironmentVariablesPanel } from '@/components';
import { ArrowLeft } from 'lucide-react';
import { Environment } from '@/types';

interface EnvironmentVariablesViewProps {
  environment: Environment;
  onBack: () => void;
}

export default function EnvironmentVariablesView({
  environment,
  onBack
}: EnvironmentVariablesViewProps) {
  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Workspace
          </Button>
          <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
            Environment Variables - {environment.name}
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <EnvironmentVariablesPanel
          environmentId={environment.id}
          environmentName={environment.name}
        />
      </div>
    </div>
  );
}

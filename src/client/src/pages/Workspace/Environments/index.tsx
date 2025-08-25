import { EnvironmentCard } from '@/components';
import { Environment } from '@/types';

interface EnvironmentsViewProps {
  environments: Environment[];
  loading: boolean;
  onEditEnvironment: (environment: Environment) => void;
  onDeleteEnvironment: (id: number, name: string) => void;
  onCloneEnvironment: (environment: Environment) => void;
}

export default function EnvironmentsView({
  environments,
  loading,
  onEditEnvironment,
  onDeleteEnvironment,
  onCloneEnvironment
}: EnvironmentsViewProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-lg">Loading environments...</div>
      </div>
    );
  }

  if (environments.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-neutral-500 dark:text-neutral-400 mb-4">
          No environments found
        </div>
      </div>
    );
  }

  return environments.map((environment) => (
    <EnvironmentCard
      key={environment.id}
      environment={environment}
      onEdit={onEditEnvironment}
      onDelete={(id: number) => onDeleteEnvironment(id, environment.name)}
      onClone={onCloneEnvironment}
    />
  ));
}

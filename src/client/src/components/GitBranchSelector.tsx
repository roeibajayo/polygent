import { useState, useEffect } from 'react';
import { Dropdown } from '@/components';
import { workspacesApi } from '@/api';

interface GitBranchSelectorProps {
  workspaceId: number;
  value?: string;
  onSelect: (branch: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  autoSelectDefault?: boolean;
}

export default function GitBranchSelector({
  workspaceId,
  value,
  onSelect,
  placeholder = "Select git branch",
  disabled = false,
  className,
  autoSelectDefault = true
}: GitBranchSelectorProps) {
  const [gitBranches, setGitBranches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (workspaceId) {
      loadGitBranches();
    } else {
      setGitBranches([]);
    }
  }, [workspaceId]);

  const loadGitBranches = async () => {
    try {
      setIsLoading(true);
      const branches = await workspacesApi.getGitBranches(workspaceId);
      setGitBranches(branches);

      // Auto-select branch if no value is set and autoSelectDefault is true
      if (autoSelectDefault && !value && branches.length > 0) {
        let selectedBranch = '';
        if (branches.includes('main')) {
          selectedBranch = 'main';
        } else if (branches.includes('master')) {
          selectedBranch = 'master';
        } else {
          selectedBranch = branches[0];
        }
        onSelect(selectedBranch);
      }
    } catch (error) {
      console.error('Failed to load git branches:', error);
      setGitBranches([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={`px-3 py-2 text-neutral-500 dark:text-neutral-400 ${className || ''}`}>
        Loading branches...
      </div>
    );
  }

  if (gitBranches.length === 0) {
    return (
      <div className={`px-3 py-2 text-neutral-500 dark:text-neutral-400 ${className || ''}`}>
        No branches found
      </div>
    );
  }

  return (
    <Dropdown
      options={gitBranches.map(branch => ({ value: branch, label: branch }))}
      value={value}
      placeholder={placeholder}
      onSelect={(option) => onSelect(option.value)}
      disabled={disabled}
      className={className}
    />
  );
}
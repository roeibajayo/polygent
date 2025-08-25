import { useState, useEffect } from 'react';
import useGitStatus from '@/hooks/useGitStatus';
import { GitChangeType } from '@/types';
import { sessionsApi } from '@/api';
import { Badge, FileIcon, ConfirmDialog, AlertDialog } from '@/components';
import { useConfirmDialog, useAlertDialog } from '@/hooks';
import {
  RefreshCw,
  AlertCircle,
  Trash2,
  Undo,
  Plus,
  Minus,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export type GitDiffType = 'WorkingVsHead' | 'WorkingVsStaged' | 'StagedVsHead';

interface GitProps {
  sessionId?: number;
  isSessionReadonly?: boolean;
  onOpenDiff: (path: string, name: string, diffType?: GitDiffType) => void;
}

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children: Map<string, TreeNode>;
  fileInfo?: {
    changeType: GitChangeType;
    type: 'staged' | 'unstaged' | 'untracked';
  };
}

// Helper function to build tree structure from file paths
const buildTree = (
  filePaths: Array<{
    filePath: string;
    changeType: GitChangeType;
    type: 'staged' | 'unstaged' | 'untracked';
  }>
): TreeNode => {
  const root: TreeNode = {
    name: '',
    path: '',
    isFolder: true,
    children: new Map()
  };

  filePaths.forEach(({ filePath, changeType, type }) => {
    const parts = filePath.split('/');
    let current = root;
    let currentPath = '';

    parts.forEach((part, index) => {
      const isLastPart = index === parts.length - 1;
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (!current.children.has(part)) {
        current.children.set(part, {
          name: part,
          path: currentPath,
          isFolder: !isLastPart,
          children: new Map(),
          ...(isLastPart && { fileInfo: { changeType, type } })
        });
      }

      current = current.children.get(part)!;
    });
  });

  return root;
};

export default function Git({
  sessionId = 1,
  isSessionReadonly = false,
  onOpenDiff
}: GitProps) {
  const { gitStatus, isLoading, error, fetchGitStatus } =
    useGitStatus(sessionId);

  // State for collapsible sections
  const [stagedCollapsed, setStagedCollapsed] = useState(false);
  const [changesCollapsed, setChangesCollapsed] = useState(false);

  // State for collapsed folders in tree view (all folders expanded by default)
  const [collapsedFolders, setCollapsedFolders] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const handleFocus = () => {
      fetchGitStatus();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchGitStatus]);

  // Helper function to determine if a file has both staged and unstaged changes
  const isFilePartiallyStaged = (filePath: string): boolean => {
    if (!gitStatus) return false;
    const isStaged = gitStatus.stagedFiles.some((f) => f.filePath === filePath);
    const isUnstaged = gitStatus.unstagedFiles.some(
      (f) => f.filePath === filePath
    );
    return isStaged && isUnstaged;
  };

  const [actionLoading, setActionLoading] = useState<{
    unstageAll: boolean;
    discardAll: boolean;
    stageAll: boolean;
    unstageFile: string | null;
    discardFile: string | null;
    stageFile: string | null;
  }>({
    unstageAll: false,
    discardAll: false,
    stageAll: false,
    unstageFile: null,
    discardFile: null,
    stageFile: null
  });

  const getChangeIcon = (changeType: GitChangeType) => {
    switch (changeType) {
      case GitChangeType.Added:
        return '+';
      case GitChangeType.Modified:
        return 'M';
      case GitChangeType.Deleted:
        return 'D';
      case GitChangeType.Renamed:
        return 'R';
      case GitChangeType.Copied:
        return 'C';
      default:
        return 'M';
    }
  };

  const handleUnstageAll = async () => {
    if (isSessionReadonly) return;

    setActionLoading((prev) => ({ ...prev, unstageAll: true }));
    try {
      await sessionsApi.unstageAllChanges(sessionId);
      await fetchGitStatus();
    } catch (error) {
      console.error('Failed to unstage all changes:', error);
    } finally {
      setActionLoading((prev) => ({ ...prev, unstageAll: false }));
    }
  };

  const { confirmDialog, showConfirm, handleConfirm, handleCancel } =
    useConfirmDialog();
  const {
    alertDialog,
    showAlert,
    handleConfirm: handleAlertConfirm
  } = useAlertDialog();

  const handleDiscardAll = async () => {
    showConfirm({
      title: 'Discard All Changes',
      message:
        'Are you sure you want to discard all changes? This action cannot be undone.',
      variant: 'danger',
      confirmText: 'Discard All',
      onConfirm: async () => {
        if (isSessionReadonly) return;

        setActionLoading((prev) => ({ ...prev, discardAll: true }));
        try {
          await sessionsApi.discardAllChanges(sessionId);
          await fetchGitStatus();
        } catch (error) {
          console.error('Failed to discard all changes:', error);
        } finally {
          setActionLoading((prev) => ({ ...prev, discardAll: false }));
        }
      }
    });
  };

  const handleUnstageFile = async (filePath: string) => {
    if (isSessionReadonly) return;

    setActionLoading((prev) => ({ ...prev, unstageFile: filePath }));
    try {
      await retryGitOperation(async () => {
        await sessionsApi.unstageFile(sessionId, filePath);
      });
      await fetchGitStatus();
    } catch (error) {
      console.error('Failed to unstage file:', error);
      const fileName = filePath.split('/').pop();
      showAlert({
        title: 'Unstage Failed',
        message: `Failed to unstage ${fileName}. Please try again.`,
        variant: 'danger'
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, unstageFile: null }));
    }
  };

  const handleDiscardFile = async (filePath: string) => {
    const fileName = filePath.split('/').pop();
    showConfirm({
      title: 'Discard File Changes',
      message: `Are you sure you want to discard changes to ${fileName}? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Discard Changes',
      onConfirm: async () => {
        if (isSessionReadonly) return;

        setActionLoading((prev) => ({ ...prev, discardFile: filePath }));
        try {
          await retryGitOperation(async () => {
            await sessionsApi.discardFileChanges(sessionId, filePath);
          });
          await fetchGitStatus();
        } catch (error) {
          console.error('Failed to discard file changes:', error);
          showAlert({
            title: 'Discard Failed',
            message: `Failed to discard changes to ${fileName}. Please try again.`,
            variant: 'danger'
          });
        } finally {
          setActionLoading((prev) => ({ ...prev, discardFile: null }));
        }
      }
    });
  };

  const handleStageAll = async () => {
    if (isSessionReadonly) return;

    setActionLoading((prev) => ({ ...prev, stageAll: true }));
    try {
      await sessionsApi.stageAllChanges(sessionId);
      await fetchGitStatus();
    } catch (error) {
      console.error('Failed to stage all changes:', error);
    } finally {
      setActionLoading((prev) => ({ ...prev, stageAll: false }));
    }
  };

  const handleStageFile = async (filePath: string) => {
    if (isSessionReadonly) return;

    setActionLoading((prev) => ({ ...prev, stageFile: filePath }));
    try {
      await retryGitOperation(async () => {
        await sessionsApi.stageFile(sessionId, filePath);
      });
      await fetchGitStatus();
    } catch (error) {
      console.error('Failed to stage file:', error);
      const fileName = filePath.split('/').pop();
      showAlert({
        title: 'Stage Failed',
        message: `Failed to stage ${fileName}. Please try again.`,
        variant: 'danger'
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, stageFile: null }));
    }
  };

  const toggleFolder = (path: string) => {
    const newCollapsed = new Set(collapsedFolders);
    if (newCollapsed.has(path)) {
      newCollapsed.delete(path); // Remove from collapsed = expand
    } else {
      newCollapsed.add(path); // Add to collapsed = collapse
    }
    setCollapsedFolders(newCollapsed);
  };

  // Helper function to get all files in a folder (recursively)
  const getFilesInFolder = (
    node: TreeNode,
    type: 'staged' | 'unstaged' | 'untracked'
  ): string[] => {
    const files: string[] = [];

    const collectFiles = (currentNode: TreeNode) => {
      if (currentNode.isFolder) {
        Array.from(currentNode.children.values()).forEach((child) => {
          collectFiles(child);
        });
      } else {
        if (currentNode.fileInfo?.type === type) {
          files.push(currentNode.path);
        }
      }
    };

    collectFiles(node);
    return files;
  };

  // Utility function to retry git operations with exponential backoff
  const retryGitOperation = async (
    operation: () => Promise<void>,
    maxRetries: number = 3,
    baseDelay: number = 100
  ): Promise<void> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await operation();
        return; // Success, exit retry loop
      } catch (error: any) {
        const isLastAttempt = attempt === maxRetries;
        const isLockError =
          error?.message?.includes('index.lock') ||
          error?.detail?.includes('index.lock');

        if (isLockError && !isLastAttempt) {
          // Wait with exponential backoff before retrying
          const delay = baseDelay * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        // Re-throw error if not a lock error or if it's the last attempt
        throw error;
      }
    }
  };

  const handleStageFolderFiles = async (folderNode: TreeNode) => {
    if (isSessionReadonly) return;

    const filesToStage = getFilesInFolder(folderNode, 'unstaged').concat(
      getFilesInFolder(folderNode, 'untracked')
    );
    if (filesToStage.length === 0) return;

    setActionLoading((prev) => ({ ...prev, stageFile: folderNode.path }));
    const processedFiles: string[] = [];
    const failedFiles: string[] = [];

    try {
      // Process files sequentially to avoid git index lock conflicts
      for (const filePath of filesToStage) {
        try {
          await retryGitOperation(async () => {
            await sessionsApi.stageFile(sessionId, filePath);
          });
          processedFiles.push(filePath);
        } catch (error) {
          console.error(`Failed to stage file ${filePath}:`, error);
          failedFiles.push(filePath);
        }
      }

      await fetchGitStatus();

      // Show results to user
      if (failedFiles.length > 0) {
        const successCount = processedFiles.length;
        const failCount = failedFiles.length;
        const message = `Staging completed with ${successCount} success(es) and ${failCount} failure(s).\nFailed files: ${failedFiles.map((f) => f.split('/').pop()).join(', ')}`;
        showAlert({
          title: 'Unstaging Results',
          message: message.replace(/\n/g, '\n\n'),
          variant: 'warning'
        });
      }
    } catch (error) {
      console.error('Failed to stage folder files:', error);
      const message =
        processedFiles.length > 0
          ? `Partially completed: ${processedFiles.length} file(s) staged successfully. ${failedFiles.length} file(s) failed.`
          : 'Failed to stage files. Please try again or refresh the page if the issue persists.';
      showAlert({
        title: 'Operation Results',
        message: message,
        variant: 'warning'
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, stageFile: null }));
    }
  };

  const handleUnstageFolderFiles = async (folderNode: TreeNode) => {
    if (isSessionReadonly) return;

    const filesToUnstage = getFilesInFolder(folderNode, 'staged');
    if (filesToUnstage.length === 0) return;

    setActionLoading((prev) => ({ ...prev, unstageFile: folderNode.path }));
    const processedFiles: string[] = [];
    const failedFiles: string[] = [];

    try {
      // Process files sequentially to avoid git index lock conflicts
      for (const filePath of filesToUnstage) {
        try {
          await retryGitOperation(async () => {
            await sessionsApi.unstageFile(sessionId, filePath);
          });
          processedFiles.push(filePath);
        } catch (error) {
          console.error(`Failed to unstage file ${filePath}:`, error);
          failedFiles.push(filePath);
        }
      }

      await fetchGitStatus();

      // Show results to user
      if (failedFiles.length > 0) {
        const successCount = processedFiles.length;
        const failCount = failedFiles.length;
        const message = `Unstaging completed with ${successCount} success(es) and ${failCount} failure(s).\nFailed files: ${failedFiles.map((f) => f.split('/').pop()).join(', ')}`;
        showAlert({
          title: 'Unstaging Results',
          message: message.replace(/\n/g, '\n\n'),
          variant: 'warning'
        });
      }
    } catch (error) {
      console.error('Failed to unstage folder files:', error);
      const message =
        processedFiles.length > 0
          ? `Partially completed: ${processedFiles.length} file(s) unstaged successfully. ${failedFiles.length} file(s) failed.`
          : 'Failed to unstage files. Please try again or refresh the page if the issue persists.';
      showAlert({
        title: 'Operation Results',
        message: message,
        variant: 'warning'
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, unstageFile: null }));
    }
  };

  const handleDiscardFolderFiles = async (folderNode: TreeNode) => {
    if (isSessionReadonly) return;

    const filesToDiscard = getFilesInFolder(folderNode, 'unstaged');
    if (filesToDiscard.length === 0) return;

    showConfirm({
      title: 'Discard Folder Changes',
      message: `Are you sure you want to discard all changes in "${folderNode.name}"? This action cannot be undone.`,
      variant: 'danger',
      confirmText: 'Discard All',
      onConfirm: () => performDiscardFolderFiles(folderNode)
    });
  };

  const performDiscardFolderFiles = async (folderNode: TreeNode) => {
    if (isSessionReadonly) return;

    const filesToDiscard = getFilesInFolder(folderNode, 'unstaged');
    if (filesToDiscard.length === 0) return;

    setActionLoading((prev) => ({ ...prev, discardFile: folderNode.path }));
    const processedFiles: string[] = [];
    const failedFiles: string[] = [];

    try {
      // Process files sequentially to avoid git index lock conflicts
      for (const filePath of filesToDiscard) {
        try {
          await retryGitOperation(async () => {
            await sessionsApi.discardFileChanges(sessionId, filePath);
          });
          processedFiles.push(filePath);
        } catch (error) {
          console.error(`Failed to discard file ${filePath}:`, error);
          failedFiles.push(filePath);
        }
      }

      await fetchGitStatus();

      // Show results to user
      if (failedFiles.length > 0) {
        const successCount = processedFiles.length;
        const failCount = failedFiles.length;
        const message = `Discard completed with ${successCount} success(es) and ${failCount} failure(s).\nFailed files: ${failedFiles.map((f) => f.split('/').pop()).join(', ')}`;
        showAlert({
          title: 'Unstaging Results',
          message: message.replace(/\n/g, '\n\n'),
          variant: 'warning'
        });
      }
    } catch (error) {
      console.error('Failed to discard folder files:', error);
      const message =
        processedFiles.length > 0
          ? `Partially completed: ${processedFiles.length} file(s) discarded successfully. ${failedFiles.length} file(s) failed.`
          : 'Failed to discard files. Please try again or refresh the page if the issue persists.';
      showAlert({
        title: 'Operation Results',
        message: message,
        variant: 'warning'
      });
    } finally {
      setActionLoading((prev) => ({ ...prev, discardFile: null }));
    }
  };

  const renderTreeNode = (
    node: TreeNode,
    depth: number = 0,
    diffType?: GitDiffType
  ) => {
    const isExpanded = !collapsedFolders.has(node.path); // Expanded by default unless in collapsed set
    const indentStyle = { paddingLeft: `${depth * 12}px` };

    if (node.isFolder) {
      const hasChildren = node.children.size > 0;

      // Determine what actions are available for this folder
      const stagedFiles = getFilesInFolder(node, 'staged');
      const unstagedFiles = getFilesInFolder(node, 'unstaged');
      const untrackedFiles = getFilesInFolder(node, 'untracked');
      const hasAnyFiles =
        stagedFiles.length > 0 ||
        unstagedFiles.length > 0 ||
        untrackedFiles.length > 0;

      return (
        <div key={node.path}>
          <div className="flex items-center justify-between group">
            <div
              className="flex items-center py-1 text-sm cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded flex-1 min-w-0"
              style={indentStyle}
              onClick={() => hasChildren && toggleFolder(node.path)}>
              {hasChildren && (
                <>
                  {isExpanded ? (
                    <ChevronDown className="w-3 h-3 mr-1 flex-shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 mr-1 flex-shrink-0" />
                  )}
                </>
              )}
              <FileIcon
                fileName={node.name}
                isFolder={true}
                size={14}
                className="mr-2 flex-shrink-0"
              />
              <span className="truncate text-neutral-700 dark:text-neutral-300">
                {node.name}
              </span>
            </div>

            {/* Action buttons for folders */}
            {hasAnyFiles && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 pr-2">
                {/* Show unstage button if folder has staged files */}
                {stagedFiles.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnstageFolderFiles(node);
                    }}
                    disabled={
                      actionLoading.unstageFile === node.path ||
                      isSessionReadonly
                    }
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                    title={`Unstage all files in ${node.name} (${stagedFiles.length} files)`}>
                    {actionLoading.unstageFile === node.path ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Minus className="w-3 h-3" />
                    )}
                  </button>
                )}

                {/* Show discard button if folder has unstaged files */}
                {unstagedFiles.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDiscardFolderFiles(node);
                    }}
                    disabled={
                      actionLoading.discardFile === node.path ||
                      isSessionReadonly
                    }
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                    title={`Discard all changes in ${node.name} (${unstagedFiles.length} files)`}>
                    {actionLoading.discardFile === node.path ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Undo className="w-3 h-3" />
                    )}
                  </button>
                )}

                {/* Show stage button if folder has unstaged or untracked files */}
                {(unstagedFiles.length > 0 || untrackedFiles.length > 0) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleStageFolderFiles(node);
                    }}
                    disabled={
                      actionLoading.stageFile === node.path || isSessionReadonly
                    }
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                    title={`Stage all files in ${node.name} (${unstagedFiles.length + untrackedFiles.length} files)`}>
                    {actionLoading.stageFile === node.path ? (
                      <RefreshCw className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {isExpanded && hasChildren && (
            <div>
              {Array.from(node.children.values())
                .sort((a, b) => {
                  // Folders first, then files
                  if (a.isFolder && !b.isFolder) return -1;
                  if (!a.isFolder && b.isFolder) return 1;
                  return a.name.localeCompare(b.name);
                })
                .map((child) => renderTreeNode(child, depth + 1, diffType))}
            </div>
          )}
        </div>
      );
    } else {
      // File node
      const { changeType, type } = node.fileInfo!;
      const fileName = node.path.split('/').pop() || node.path;

      return (
        <div
          key={node.path}
          className="flex items-center justify-between group ps-2">
          <div
            className="flex items-center py-1 text-sm cursor-pointer hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded flex-1 min-w-0"
            style={indentStyle}
            onClick={() => onOpenDiff(node.path, fileName, diffType)}
            title="Click to view full content comparison">
            <FileIcon
              fileName={node.name}
              size={14}
              className="mx-2 flex-shrink-0"
            />
            <span className="truncate text-neutral-700 dark:text-neutral-300">
              <span className="inline-block w-3 text-center">
                {getChangeIcon(changeType)}
              </span>{' '}
              {node.name}
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 pr-2">
            {type === 'staged' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnstageFile(node.path);
                }}
                disabled={
                  actionLoading.unstageFile === node.path || isSessionReadonly
                }
                className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                title="Unstage file">
                {actionLoading.unstageFile === node.path ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  <Minus className="w-3 h-3" />
                )}
              </button>
            ) : (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDiscardFile(node.path);
                  }}
                  disabled={
                    actionLoading.discardFile === node.path || isSessionReadonly
                  }
                  className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                  title="Discard file changes">
                  {actionLoading.discardFile === node.path ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Undo className="w-3 h-3" />
                  )}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStageFile(node.path);
                  }}
                  disabled={
                    actionLoading.stageFile === node.path || isSessionReadonly
                  }
                  className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                  title="Stage file">
                  {actionLoading.stageFile === node.path ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Plus className="w-3 h-3" />
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      );
    }
  };

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm text-neutral-900 dark:text-neutral-100">
            Git Status
          </h3>
          <button
            onClick={fetchGitStatus}
            className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700"
            title="Refresh">
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
        </div>
      </div>
    );
  }

  // Build tree structures for both sections
  const stagedTree = gitStatus?.stagedFiles
    ? buildTree(
        gitStatus.stagedFiles.map((file) => ({
          filePath: file.filePath,
          changeType: file.changeType,
          type: 'staged' as const
        }))
      )
    : null;

  const changesTree = gitStatus
    ? buildTree([
        ...(gitStatus.unstagedFiles || []).map((file) => ({
          filePath: file.filePath,
          changeType: file.changeType,
          type: 'unstaged' as const
        })),
        ...(gitStatus.untrackedFiles || []).map((file) => ({
          filePath: file,
          changeType: GitChangeType.Added,
          type: 'untracked' as const
        }))
      ])
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm text-neutral-900 dark:text-neutral-100">Git Status</h3>
        {!isSessionReadonly && (
          <div className="flex items-center gap-1">
            <button
              onClick={fetchGitStatus}
              disabled={isLoading}
              className="p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-700 disabled:opacity-50"
              title="Refresh">
              <RefreshCw
                className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`}
              />
            </button>
          </div>
        )}
      </div>

      {isSessionReadonly ? (
        <div className="text-sm opacity-50">
          You are viewing a read-only session.
        </div>
      ) : (
        <>
          {/* Staged Changes Section */}
          {stagedTree && stagedTree.children.size > 0 && (
            <div>
              <div className="group flex items-center justify-between mb-2">
                <button
                  className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded p-1"
                  onClick={() => setStagedCollapsed(!stagedCollapsed)}>
                  {stagedCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Staged Changes ({gitStatus?.stagedFiles?.length || 0})
                </button>

                <button
                  onClick={handleUnstageAll}
                  disabled={actionLoading.unstageAll || isSessionReadonly}
                  className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50 opacity-0 group-hover:opacity-100"
                  title="Unstage all changes">
                  {actionLoading.unstageAll ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Minus className="w-4 h-4" />
                  )}
                </button>
              </div>

              {!stagedCollapsed && (
                <div className="ml-2">
                  {Array.from(stagedTree.children.values())
                    .sort((a, b) => {
                      if (a.isFolder && !b.isFolder) return -1;
                      if (!a.isFolder && b.isFolder) return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map((child) => renderTreeNode(child, 0, 'StagedVsHead'))}
                </div>
              )}
            </div>
          )}

          {/* Changes Section */}
          {changesTree && changesTree.children.size > 0 && (
            <div>
              <div className="group flex items-center justify-between mb-2">
                <button
                  className="flex items-center gap-2 text-sm text-neutral-900 dark:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded p-1"
                  onClick={() => setChangesCollapsed(!changesCollapsed)}>
                  {changesCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  Changes (
                  {(gitStatus?.unstagedFiles?.length || 0) +
                    (gitStatus?.untrackedFiles?.length || 0)}
                  )
                </button>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 pr-2">
                  <button
                    onClick={handleDiscardAll}
                    disabled={actionLoading.discardAll || isSessionReadonly}
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                    title="Discard all changes">
                    {actionLoading.discardAll ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={handleStageAll}
                    disabled={actionLoading.stageAll || isSessionReadonly}
                    className="p-1 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 disabled:opacity-50"
                    title="Stage all changes">
                    {actionLoading.stageAll ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {!changesCollapsed && (
                <div className="ml-2">
                  {Array.from(changesTree.children.values())
                    .sort((a, b) => {
                      if (a.isFolder && !b.isFolder) return -1;
                      if (!a.isFolder && b.isFolder) return 1;
                      return a.name.localeCompare(b.name);
                    })
                    .map((child) =>
                      renderTreeNode(
                        child,
                        0,
                        isFilePartiallyStaged(child.path)
                          ? 'WorkingVsStaged'
                          : 'WorkingVsHead'
                      )
                    )}
                </div>
              )}
            </div>
          )}

          {/* No changes message */}
          {gitStatus &&
            (gitStatus.stagedFiles?.length || 0) === 0 &&
            (gitStatus.unstagedFiles?.length || 0) === 0 &&
            (gitStatus.untrackedFiles?.length || 0) === 0 && (
              <div className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
                No changes detected
              </div>
            )}

          {/* Loading message */}
          {isLoading && !gitStatus && (
            <div className="text-sm text-neutral-500 dark:text-neutral-400 text-center py-4">
              Loading git status...
            </div>
          )}
        </>
      )}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />

      <AlertDialog
        isOpen={alertDialog.isOpen}
        title={alertDialog.title}
        message={alertDialog.message}
        confirmText={alertDialog.confirmText}
        variant={alertDialog.variant}
        onConfirm={handleAlertConfirm}
      />
    </div>
  );
}

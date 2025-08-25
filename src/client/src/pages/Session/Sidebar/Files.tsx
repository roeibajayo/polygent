import { useState, useEffect, useRef } from 'react';
import { sessionsApi } from '@/api';
import { SessionFile } from '@/types';
import {
  ContextMenu,
  RenameModal,
  CreateModal,
  FileIcon,
  ConfirmDialog,
  AlertDialog,
  type ContextMenuItem
} from '@/components';
import { useConfirmDialog, useAlertDialog } from '@/hooks';
import { ChevronRight } from 'lucide-react';
import { useInitStore } from '@/stores';

interface FilesProps {
  sessionId: number;
  activeFilePath?: string | null;
  isSessionReadonly?: boolean;
  onOpenFile: (path: string, name: string) => void;
}

interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
  size?: number;
  lastModified?: Date;
  isLoaded?: boolean;
  isLoading?: boolean;
}

export default function Files({
  sessionId,
  activeFilePath,
  isSessionReadonly = false,
  onOpenFile
}: FilesProps) {
  const [rootNodes, setRootNodes] = useState<FileTreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { confirmDialog, showConfirm, handleConfirm, handleCancel } =
    useConfirmDialog();
  const {
    alertDialog,
    showAlert,
    handleConfirm: handleAlertConfirm
  } = useAlertDialog();
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeFileRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Auto-expand folders to show active file
  useEffect(() => {
    if (!activeFilePath || rootNodes.length === 0) return;

    const expandFoldersForFile = async () => {
      const pathSegments = activeFilePath
        .split('/')
        .filter((segment) => segment.length > 0);
      if (pathSegments.length <= 1) return; // File is in root, no folders to expand

      const foldersToExpand: string[] = [];

      // Build all parent folder paths that need to be expanded (in order from root to deepest)
      for (let i = 0; i < pathSegments.length - 1; i++) {
        const folderPath = pathSegments.slice(0, i + 1).join('/');
        foldersToExpand.push(folderPath);
      }

      // Load folders sequentially to ensure proper tree building
      for (const folderPath of foldersToExpand) {
        if (!expandedFolders.has(folderPath)) {
          // First expand the folder
          setExpandedFolders((prev) => new Set([...prev, folderPath]));

          // Then load its contents if needed and wait for completion
          const loadSuccess = await loadFolderIfNeeded(folderPath);

          // Wait a bit more for the state to update and DOM to render
          await new Promise((resolve) =>
            setTimeout(resolve, loadSuccess ? 150 : 50)
          );
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(expandFoldersForFile, 50);
    return () => clearTimeout(timeoutId);
  }, [activeFilePath, rootNodes.length]);

  // Helper function to load folder contents if needed
  const loadFolderIfNeeded = async (folderPath: string) => {
    const findFolderNode = (
      nodes: FileTreeNode[],
      targetPath: string
    ): FileTreeNode | null => {
      for (const node of nodes) {
        if (node.path === targetPath && node.isDirectory) {
          return node;
        }
        if (node.children) {
          const found = findFolderNode(node.children, targetPath);
          if (found) return found;
        }
      }
      return null;
    };

    const folderNode = findFolderNode(rootNodes, folderPath);

    if (folderNode && !folderNode.isLoaded && !folderNode.isLoading) {
      // Set loading state
      const setLoadingState = (
        nodes: FileTreeNode[],
        targetPath: string
      ): FileTreeNode[] => {
        return nodes.map((node) => {
          if (node.path === targetPath && node.isDirectory) {
            return { ...node, isLoading: true };
          }
          if (node.children) {
            return {
              ...node,
              children: setLoadingState(node.children, targetPath)
            };
          }
          return node;
        });
      };

      setRootNodes((prev) => setLoadingState(prev, folderPath));

      // Load folder contents
      try {
        const children = await loadFolderContents(folderPath);

        // Update the node with loaded children
        const updateNodeWithChildren = (
          nodes: FileTreeNode[],
          targetPath: string,
          children: FileTreeNode[]
        ): FileTreeNode[] => {
          return nodes.map((node) => {
            if (node.path === targetPath && node.isDirectory) {
              return { ...node, children, isLoaded: true, isLoading: false };
            }
            if (node.children) {
              return {
                ...node,
                children: updateNodeWithChildren(
                  node.children,
                  targetPath,
                  children
                )
              };
            }
            return node;
          });
        };

        setRootNodes((prev) =>
          updateNodeWithChildren(prev, folderPath, children)
        );
        return true; // Successfully loaded
      } catch (error) {
        console.error(`Failed to load folder ${folderPath}:`, error);

        // Clear loading state on error
        const clearLoadingState = (
          nodes: FileTreeNode[],
          targetPath: string
        ): FileTreeNode[] => {
          return nodes.map((node) => {
            if (node.path === targetPath && node.isDirectory) {
              return { ...node, isLoading: false };
            }
            if (node.children) {
              return {
                ...node,
                children: clearLoadingState(node.children, targetPath)
              };
            }
            return node;
          });
        };

        setRootNodes((prev) => clearLoadingState(prev, folderPath));
        return false; // Failed to load
      }
    }

    return folderNode?.isLoaded || false; // Return true if already loaded
  };

  // Fallback: Check if active file becomes visible after expansion
  useEffect(() => {
    if (!activeFilePath || rootNodes.length === 0) return;

    const checkFileVisibility = () => {
      const pathSegments = activeFilePath
        .split('/')
        .filter((segment) => segment.length > 0);
      if (pathSegments.length <= 1) return; // File is in root

      const requiredFolders: string[] = [];
      for (let i = 0; i < pathSegments.length - 1; i++) {
        const folderPath = pathSegments.slice(0, i + 1).join('/');
        requiredFolders.push(folderPath);
      }

      const missingFolders = requiredFolders.filter(
        (folder) => !expandedFolders.has(folder)
      );

      if (missingFolders.length > 0) {
        setExpandedFolders((prev) => {
          const newExpanded = new Set(prev);
          missingFolders.forEach((folder) => newExpanded.add(folder));
          return newExpanded;
        });
      }
    };

    // Check after a delay to see if folders were properly expanded
    const timeoutId = setTimeout(checkFileVisibility, 200);
    return () => clearTimeout(timeoutId);
  }, [activeFilePath, expandedFolders, rootNodes.length]);

  // Scroll active file into view
  useEffect(() => {
    if (!activeFilePath || !scrollContainerRef.current) return;

    const scrollToActiveFile = () => {
      const activeFileElement = activeFileRefs.current.get(activeFilePath);
      if (activeFileElement) {
        activeFileElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'nearest'
        });
      } else {
        // If element not found, try again after a short delay
        setTimeout(scrollToActiveFile, 100);
      }
    };

    // Delay to ensure DOM is updated after folder expansion and loading
    const timeoutId = setTimeout(scrollToActiveFile, 200);
    return () => clearTimeout(timeoutId);
  }, [activeFilePath, expandedFolders, rootNodes]);

  const [_loadingFolders, _setLoadingFolders] = useState<Set<string>>(
    new Set()
  );

  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    visible: boolean;
    x: number;
    y: number;
    targetPath?: string;
    targetName?: string;
    isDirectory?: boolean;
  }>({ visible: false, x: 0, y: 0 });

  // Get editors from global store
  const { editors, isInitializing } = useInitStore();

  // Rename modal state
  const [renameModal, setRenameModal] = useState<{
    isOpen: boolean;
    currentPath?: string;
    currentName?: string;
  }>({ isOpen: false });

  // Create modals state
  const [createFileModal, setCreateFileModal] = useState<{
    isOpen: boolean;
    parentPath?: string;
  }>({ isOpen: false });

  const [createFolderModal, setCreateFolderModal] = useState<{
    isOpen: boolean;
    parentPath?: string;
  }>({ isOpen: false });

  useEffect(() => {
    const fetchRootFiles = async () => {
      // Skip API call for readonly sessions
      if (isSessionReadonly) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const sessionFiles = await sessionsApi.getFiles(sessionId);
        const nodes = convertFilesToNodes(sessionFiles);
        setRootNodes(nodes);
      } catch (err) {
        console.error('Failed to fetch session files:', err);
        setError('Failed to load files');
      } finally {
        setLoading(false);
      }
    };

    fetchRootFiles();
  }, [sessionId, isSessionReadonly]);

  const convertFilesToNodes = (files: SessionFile[]): FileTreeNode[] => {
    const nodes = files.map((file) => ({
      name: file.fileName,
      path: file.relativePath,
      isDirectory: file.isDirectory,
      children: file.isDirectory ? [] : undefined,
      size: file.isDirectory ? undefined : file.size,
      lastModified: file.lastModified,
      isLoaded: !file.isDirectory, // Files are always "loaded", directories need to be loaded
      isLoading: false
    }));

    // Sort function: directories first, then files, both alphabetically
    return nodes.sort((a, b) => {
      // Directories come before files
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      // Both are same type, sort alphabetically (case-insensitive)
      return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
    });
  };

  const loadFolderContents = async (
    folderPath: string
  ): Promise<FileTreeNode[]> => {
    if (isSessionReadonly) {
      return [];
    }

    try {
      const files = await sessionsApi.getFiles(sessionId, folderPath);
      return convertFilesToNodes(files);
    } catch (error) {
      console.error(`Failed to load folder contents for ${folderPath}:`, error);
      return [];
    }
  };

  const handleRightClick = (
    e: React.MouseEvent,
    filePath?: string,
    fileName?: string,
    isDirectory?: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();

    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetPath: filePath,
      targetName: fileName,
      isDirectory
    });
  };

  const handleRename = async (newName: string) => {
    if (!renameModal.currentPath || isSessionReadonly) return;

    try {
      await sessionsApi.renameFile(sessionId, renameModal.currentPath, newName);

      // Refresh the current directory
      const parentPath = renameModal.currentPath.includes('/')
        ? renameModal.currentPath.substring(
            0,
            renameModal.currentPath.lastIndexOf('/')
          )
        : '';

      await refreshDirectory(parentPath);
    } catch (error) {
      console.error('Failed to rename file:', error);
      showAlert({
        title: 'Rename Failed',
        message: 'Failed to rename file. Please try again.',
        variant: 'danger'
      });
    } finally {
      setRenameModal({ isOpen: false });
    }
  };

  const handleDelete = async (filePath: string) => {
    if (isSessionReadonly) return;

    showConfirm({
      title: 'Delete File',
      message: `Are you sure you want to delete "${filePath}"?`,
      variant: 'danger',
      confirmText: 'Delete',
      onConfirm: async () => {
        try {
          await sessionsApi.deleteFile(sessionId, filePath);

          // Refresh the current directory
          const parentPath = filePath.includes('/')
            ? filePath.substring(0, filePath.lastIndexOf('/'))
            : '';

          await refreshDirectory(parentPath);
        } catch (error) {
          console.error('Failed to delete file:', error);
          showAlert({
            title: 'Delete Failed',
            message: 'Failed to delete file. Please try again.',
            variant: 'danger'
          });
        }
      }
    });
  };

  const handleOpenWith = async (filePath: string, editorId: string) => {
    if (isSessionReadonly) return;

    try {
      await sessionsApi.openFileWithEditor(sessionId, filePath, editorId);
    } catch (error) {
      console.error('Failed to open file with editor:', error);
      showAlert({
        title: 'Open Failed',
        message: 'Failed to open file with editor. Please try again.',
        variant: 'danger'
      });
    }
  };

  const handleOpenFileFolder = async (filePath: string) => {
    try {
      await sessionsApi.openFileFolder(sessionId, filePath);
    } catch (error) {
      console.error('Failed to open file folder:', error);
      showAlert({
        title: 'Open Failed',
        message: 'Failed to open file folder. Please try again.',
        variant: 'danger'
      });
    }
  };

  const handleCreateFile = async (fileName: string) => {
    if (isSessionReadonly) return;

    try {
      const parentPath = createFileModal.parentPath || '';
      const filePath = parentPath ? `${parentPath}/${fileName}` : fileName;

      await sessionsApi.createFile(sessionId, filePath);

      // Refresh the directory
      await refreshDirectory(parentPath);
    } catch (error) {
      console.error('Failed to create file:', error);
      showAlert({
        title: 'Create Failed',
        message: 'Failed to create file. Please try again.',
        variant: 'danger'
      });
    } finally {
      setCreateFileModal({ isOpen: false });
    }
  };

  const handleCreateFolder = async (folderName: string) => {
    if (isSessionReadonly) return;

    try {
      const parentPath = createFolderModal.parentPath || '';
      const folderPath = parentPath
        ? `${parentPath}/${folderName}`
        : folderName;

      await sessionsApi.createFolder(sessionId, folderPath);

      // Refresh the directory
      await refreshDirectory(parentPath);
    } catch (error) {
      console.error('Failed to create folder:', error);
      showAlert({
        title: 'Create Failed',
        message: 'Failed to create folder. Please try again.',
        variant: 'danger'
      });
    } finally {
      setCreateFolderModal({ isOpen: false });
    }
  };

  const refreshDirectory = async (folderPath: string) => {
    try {
      if (folderPath === '') {
        // Refresh root directory
        const sessionFiles = await sessionsApi.getFiles(sessionId);
        const nodes = convertFilesToNodes(sessionFiles);
        setRootNodes(nodes);
      } else {
        // Refresh specific directory - more complex logic needed here
        // For now, we'll just refresh the root and re-expand folders
        const sessionFiles = await sessionsApi.getFiles(sessionId);
        const nodes = convertFilesToNodes(sessionFiles);
        setRootNodes(nodes);
      }
    } catch (error) {
      console.error('Failed to refresh directory:', error);
    }
  };

  const createContextMenuItems = (): ContextMenuItem[] => {
    const items: ContextMenuItem[] = [];

    if (contextMenu.targetPath && !contextMenu.isDirectory) {
      // File-specific actions
      items.push({
        id: 'open',
        label: 'Open',
        onClick: () => {
          if (contextMenu.targetPath && contextMenu.targetName) {
            onOpenFile(contextMenu.targetPath, contextMenu.targetName);
          }
        }
      });

      if (!isSessionReadonly) {
        if (isInitializing) {
          items.push({
            id: 'open-with-loading',
            label: 'Loading editors...',
            onClick: () => {}
          });
        } else if (editors.length > 0) {
          items.push({
            id: 'open-with',
            label: 'Open with',
            onClick: () => {},
            submenu: editors.map((editor) => ({
              id: `editor-${editor.id}`,
              label: editor.displayName,
              onClick: () => {
                if (contextMenu.targetPath) {
                  handleOpenWith(contextMenu.targetPath, editor.id);
                }
              }
            }))
          });
        }
      }

      items.push({ id: 'sep1', label: '', separator: true });
    }

    if (contextMenu.targetPath) {
      if (!isSessionReadonly) {
        items.push({
          id: 'open-folder',
          label: 'Open folder',
          onClick: () => {
            if (contextMenu.targetPath) {
              handleOpenFileFolder(contextMenu.targetPath);
            }
          }
        });

        items.push({ id: 'sep2', label: '', separator: true });

        items.push({
          id: 'rename',
          label: 'Rename',
          onClick: () => {
            setRenameModal({
              isOpen: true,
              currentPath: contextMenu.targetPath,
              currentName: contextMenu.targetName
            });
          }
        });

        items.push({
          id: 'delete',
          label: 'Delete',
          onClick: () => {
            if (contextMenu.targetPath) {
              handleDelete(contextMenu.targetPath);
            }
          }
        });
      }
    } else if (!isSessionReadonly) {
      // Background context menu - only show if not readonly
      items.push({
        id: 'new-file',
        label: 'New File',
        onClick: () => {
          setCreateFileModal({ isOpen: true, parentPath: '' });
        }
      });

      items.push({
        id: 'new-folder',
        label: 'New Folder',
        onClick: () => {
          setCreateFolderModal({ isOpen: true, parentPath: '' });
        }
      });
    }

    return items;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const toggleFolder = async (folderPath: string) => {
    if (expandedFolders.has(folderPath)) {
      // Just collapse the folder
      setExpandedFolders((prev) => {
        const newSet = new Set(prev);
        newSet.delete(folderPath);
        return newSet;
      });
      return;
    }

    // Expand the folder
    setExpandedFolders((prev) => new Set([...prev, folderPath]));

    // Find the node and check if it needs loading
    const findAndUpdateNode = (
      nodes: FileTreeNode[],
      targetPath: string
    ): FileTreeNode[] => {
      return nodes.map((node) => {
        if (node.path === targetPath && node.isDirectory && !node.isLoaded) {
          return { ...node, isLoading: true };
        }
        if (node.children) {
          return {
            ...node,
            children: findAndUpdateNode(node.children, targetPath)
          };
        }
        return node;
      });
    };

    // Check if we need to load contents
    const needsLoading = (
      nodes: FileTreeNode[],
      targetPath: string
    ): boolean => {
      for (const node of nodes) {
        if (node.path === targetPath && node.isDirectory && !node.isLoaded) {
          return true;
        }
        if (node.children && needsLoading(node.children, targetPath)) {
          return true;
        }
      }
      return false;
    };

    if (needsLoading(rootNodes, folderPath)) {
      _setLoadingFolders((prev: Set<string>) => new Set([...prev, folderPath]));
      setRootNodes((prev) => findAndUpdateNode(prev, folderPath));

      try {
        const children = await loadFolderContents(folderPath);

        // Update the node with loaded children
        const updateNodeWithChildren = (
          nodes: FileTreeNode[],
          targetPath: string,
          children: FileTreeNode[]
        ): FileTreeNode[] => {
          return nodes.map((node) => {
            if (node.path === targetPath && node.isDirectory) {
              return { ...node, children, isLoaded: true, isLoading: false };
            }
            if (node.children) {
              return {
                ...node,
                children: updateNodeWithChildren(
                  node.children,
                  targetPath,
                  children
                )
              };
            }
            return node;
          });
        };

        setRootNodes((prev) =>
          updateNodeWithChildren(prev, folderPath, children)
        );
      } catch (error) {
        console.error(`Failed to load folder ${folderPath}:`, error);
        // Update node to show error state
        const updateNodeWithError = (
          nodes: FileTreeNode[],
          targetPath: string
        ): FileTreeNode[] => {
          return nodes.map((node) => {
            if (node.path === targetPath && node.isDirectory) {
              return { ...node, isLoading: false };
            }
            if (node.children) {
              return {
                ...node,
                children: updateNodeWithError(node.children, targetPath)
              };
            }
            return node;
          });
        };

        setRootNodes((prev) => updateNodeWithError(prev, folderPath));
      } finally {
        _setLoadingFolders((prev: Set<string>) => {
          const newSet = new Set(prev);
          newSet.delete(folderPath);
          return newSet;
        });
      }
    }
  };

  const renderFileTree = (nodes: FileTreeNode[], isRoot: boolean) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: `${isRoot ? 0 : 12}px` }}>
        {node.isDirectory ? (
          <>
            <div
              className="py-1 px-2 flex items-center hover:bg-neutral-50 dark:hover:bg-neutral-700/50"
              onClick={() => toggleFolder(node.path)}
              onContextMenu={(e) =>
                !isSessionReadonly &&
                handleRightClick(e, node.path, node.name, true)
              }>
              {node.isLoading ? (
                <span className="mr-1 text-xs animate-spin">⏳</span>
              ) : (
                <span
                  className="mr-1 text-xs duration-200"
                  style={{
                    transform: expandedFolders.has(node.path)
                      ? 'rotate(90deg)'
                      : 'rotate(0deg)'
                  }}>
                  <ChevronRight size={12} />
                </span>
              )}
              <FileIcon
                fileName={node.name}
                isFolder={true}
                size={14}
                className="mr-1 flex-shrink-0"
              />
              <span className="text-sm">{node.name}/</span>
            </div>
            {expandedFolders.has(node.path) &&
              node.children &&
              renderFileTree(node.children, false)}
          </>
        ) : (
          <div
            ref={(el) => {
              if (el) {
                activeFileRefs.current.set(node.path, el);
              } else {
                activeFileRefs.current.delete(node.path);
              }
            }}
            className={`py-1 px-2 rounded-sm flex items-center justify-between group ${
              activeFilePath === node.path
                ? 'bg-purple-100 dark:bg-purple-900/50'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-700/50'
            }`}
            onClick={() => onOpenFile(node.path, node.name)}
            onContextMenu={(e) =>
              !isSessionReadonly &&
              handleRightClick(e, node.path, node.name, false)
            }
            title={`${node.path} (${formatFileSize(node.size || 0)})`}>
            <div className="flex items-center min-w-0 flex-1 ps-4">
              <FileIcon
                fileName={node.name}
                size={14}
                className="mr-2 flex-shrink-0"
              />
              <span className="text-sm truncate">{node.name}</span>
            </div>
            <div
              className={`text-xs ml-2 flex-shrink-0 ${
                activeFilePath === node.path
                  ? 'text-purple-600 dark:text-purple-300 opacity-100'
                  : 'text-neutral-500 dark:text-neutral-400 opacity-0 group-hover:opacity-100'
              }`}>
              {formatFileSize(node.size || 0)}
            </div>
          </div>
        )}
      </div>
    ));
  };

  if (loading) {
    return (
      <div>
        <h3 className="text-sm text-neutral-900 dark:text-neutral-100 mb-2">
          Session Files
        </h3>
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          Loading files...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h3 className="text-sm text-neutral-900 dark:text-neutral-100 mb-2">
          Session Files
        </h3>
        <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
      </div>
    );
  }

  if (isSessionReadonly) {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm text-neutral-900 dark:text-neutral-100">
            Session Files
          </h3>
        </div>

        <div className="text-sm opacity-50 mt-4">
          You are viewing a read-only session.
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-sm text-neutral-900 dark:text-neutral-100">
          Session Files
        </h3>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCreateFileModal({ isOpen: true, parentPath: '' })}
            disabled={isSessionReadonly}
            className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              isSessionReadonly
                ? 'Actions disabled in read-only mode'
                : 'New File'
            }>
            <FileIcon fileName="file.txt" size={16} />
          </button>
          <button
            onClick={() =>
              setCreateFolderModal({ isOpen: true, parentPath: '' })
            }
            disabled={isSessionReadonly}
            className="p-1 text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title={
              isSessionReadonly
                ? 'Actions disabled in read-only mode'
                : 'New Folder'
            }>
            <FileIcon fileName="folder" isFolder={true} size={16} />
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        onContextMenu={(e) => !isSessionReadonly && handleRightClick(e)}>
        <div className="space-y-1 text-sm">
          {rootNodes.length > 0 ? (
            renderFileTree(rootNodes, true)
          ) : (
            <div className="text-neutral-600 dark:text-neutral-400 text-center py-8">
              <div className="mb-2 flex justify-center">
                <FileIcon fileName="empty" isFolder={true} size={32} />
              </div>
              <div>No files found</div>
              <div className="text-xs mt-1">The session directory is empty</div>
            </div>
          )}
        </div>
      </div>

      {/* Context Menu */}
      <ContextMenu
        items={createContextMenuItems()}
        position={{ x: contextMenu.x, y: contextMenu.y }}
        isVisible={contextMenu.visible}
        onClose={() => setContextMenu({ visible: false, x: 0, y: 0 })}
      />

      {/* Rename Modal */}
      <RenameModal
        isOpen={renameModal.isOpen}
        currentName={renameModal.currentName || ''}
        onConfirm={handleRename}
        onCancel={() => setRenameModal({ isOpen: false })}
      />

      {/* Create File Modal */}
      <CreateModal
        isOpen={createFileModal.isOpen}
        title="Create New File"
        placeholder="Enter file name (e.g., example.txt)"
        onConfirm={handleCreateFile}
        onCancel={() => setCreateFileModal({ isOpen: false })}
      />

      {/* Create Folder Modal */}
      <CreateModal
        isOpen={createFolderModal.isOpen}
        title="Create New Folder"
        placeholder="Enter folder name"
        onConfirm={handleCreateFolder}
        onCancel={() => setCreateFolderModal({ isOpen: false })}
      />

      {/* Confirm Dialog */}
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

      {/* Alert Dialog */}
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

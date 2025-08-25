import { useState, useEffect, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Save, RefreshCw } from 'lucide-react';
import { FileContent } from '../useSession';
import { useWorkspaceStore } from '@/stores';
import { useGitStatusStore } from '@/stores/gitStatusStore';
import { sessionsApi } from '@/api';
import { ConfirmDialog, Modal, FileIcon, Button } from '@/components';

interface FileViewProps {
  tabId: string;
}

export default function FileView({ tabId }: FileViewProps) {
  const {
    getTabContentById,
    activeSessionId,
    setTabContent,
    getTabDirty,
    setTabDirty
  } = useWorkspaceStore();
  const { fetchGitStatus } = useGitStatusStore();
  const content =
    (getTabContentById(activeSessionId!, tabId) as FileContent) || {};
  const isDirty = getTabDirty(activeSessionId!, tabId);
  const setIsDirty = useCallback(
    (isDirty: boolean) => {
      setTabDirty(activeSessionId!, tabId, isDirty);
    },
    [activeSessionId, setTabDirty, tabId]
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { editableContent, lastModified, content: lastSavedContent } = content;
  const [conflictDialog, setConflictDialog] = useState<{
    isOpen: boolean;
    currentLastModified?: string;
  }>({ isOpen: false });
  const [successModal, setSuccessModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: '' });

  // Handle content changes
  const handleContentChange = useCallback(
    (value: string | undefined) => {
      const newContent = value || '';

      setTabContent(activeSessionId!, tabId, {
        ...content,
        editableContent: newContent
      });
      setIsDirty(newContent !== lastSavedContent);
    },
    [
      activeSessionId,
      content,
      lastSavedContent,
      setIsDirty,
      setTabContent,
      tabId
    ]
  );

  // Save file content
  const handleSave = useCallback(
    async (forceOverride: boolean = false) => {
      if (!isDirty || isSaving) return;

      try {
        setIsSaving(true);
        const result = await sessionsApi.updateFileContent(
          activeSessionId!,
          content.path,
          editableContent,
          forceOverride ? undefined : lastModified
        );
        setTabContent(activeSessionId!, tabId, {
          ...content,
          editableContent,
          content: editableContent,
          lastModified: result.lastModified
        });
        setIsDirty(false);

        // Refresh git status after successful save
        fetchGitStatus(activeSessionId!);
      } catch (error: any) {
        console.error('Failed to save file:', error);

        // Handle conflict (409 status code)
        if (error.status === 409) {
          const conflictData = error.data || {};
          setConflictDialog({
            isOpen: true,
            currentLastModified: conflictData.currentLastModified
          });
        } else {
          setSuccessModal({
            isOpen: true,
            message: 'Failed to save file. Please try again.'
          });
        }
      } finally {
        setIsSaving(false);
      }
    },
    [
      activeSessionId,
      content,
      editableContent,
      isDirty,
      isSaving,
      lastModified,
      setIsDirty,
      setTabContent,
      tabId
    ]
  );

  // Refresh file content
  const handleRefresh = useCallback(async () => {
    if (isDirty || isRefreshing) return;

    try {
      setIsRefreshing(true);
      const { content: fileContent, lastModified: newLastModified } =
        await sessionsApi.getFileContent(activeSessionId!, content.path);
      setTabContent(activeSessionId!, tabId, {
        ...content,
        lastModified: newLastModified,
        editableContent: fileContent,
        content: fileContent
      });
      setIsDirty(false);
    } catch (error) {
      console.error('Failed to refresh file:', error);
      setSuccessModal({
        isOpen: true,
        message: 'Failed to refresh file. Please try again.'
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [
    isDirty,
    isRefreshing,
    activeSessionId,
    content,
    tabId,
    setTabContent,
    setIsDirty
  ]);

  // Handle keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    },
    [handleSave]
  );

  // Add keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleConflictOverride = () => {
    setConflictDialog({ isOpen: false });
    handleSave(true); // Force override
  };

  const handleConflictReload = async () => {
    setConflictDialog({ isOpen: false });
    try {
      const { content: fileContent, lastModified: newLastModified } =
        await sessionsApi.getFileContent(activeSessionId!, content.path);
      setTabContent(activeSessionId!, tabId, {
        ...content,
        lastModified: newLastModified,
        editableContent: fileContent,
        content: fileContent
      });
      setIsDirty(false);
      setSuccessModal({
        isOpen: true,
        message:
          'File has been reloaded with the latest changes. Your changes have been discarded.'
      });
    } catch (reloadError) {
      console.error('Failed to reload file:', reloadError);
      setSuccessModal({
        isOpen: true,
        message: 'Failed to reload file. Please refresh the page.'
      });
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileIcon
              fileName={content.name || ''}
              size={20}
              className="text-neutral-600 dark:text-neutral-400"
            />
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              {content.name}
              {isDirty && <span className="text-orange-500 ml-2">•</span>}
            </h2>
            {content.path != content.name && (
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                {content.path}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={isDirty}
              loading={isRefreshing}
              title="Refresh file content">
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button
              onClick={() => handleSave()}
              disabled={!isDirty || isSaving}
              title="Save (Ctrl+S)">
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <Editor
          height="100%"
          language={content.language}
          value={editableContent}
          onChange={handleContentChange}
          theme="vs-dark"
          options={{
            readOnly: false,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            lineNumbers: 'on',
            renderWhitespace: 'selection',
            folding: true,
            wordWrap: 'on',
            automaticLayout: true,
            tabSize: 2,
            insertSpaces: true,
            formatOnPaste: true,
            formatOnType: true
          }}
        />
      </div>

      {/* Conflict Resolution Dialog */}
      <ConfirmDialog
        isOpen={conflictDialog.isOpen}
        title="File Conflict Detected"
        message={`This file has been modified by another process.

Your last modified: ${new Date(lastModified).toLocaleString()}
Current last modified: ${new Date(conflictDialog.currentLastModified || '').toLocaleString()}

Click Override to save your changes anyway, or Reload to discard your changes and reload the latest version.`}
        confirmText="Override"
        cancelText="Reload"
        variant="warning"
        onConfirm={handleConflictOverride}
        onCancel={handleConflictReload}
      />

      {/* Success/Error Message Modal */}
      <Modal
        isOpen={successModal.isOpen}
        onClose={() => setSuccessModal({ isOpen: false, message: '' })}
        title="Information"
        size="sm"
        contentClassName="p-6"
        footer={
          <div className="flex justify-end">
            <Button
              onClick={() => setSuccessModal({ isOpen: false, message: '' })}>
              OK
            </Button>
          </div>
        }>
        <p className="text-sm text-neutral-600 dark:text-neutral-300">
          {successModal.message}
        </p>
      </Modal>
    </div>
  );
}

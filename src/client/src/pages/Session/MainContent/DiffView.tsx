import { DiffEditor } from '@monaco-editor/react';
import { GitCompare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { DiffContent } from '../useSession';
import { useWorkspaceStore } from '@/stores';
import { sessionsApi } from '@/api';

interface DiffViewProps {
  tabId: string;
}

export default function DiffView({ tabId }: DiffViewProps) {
  const { getTabContentById, activeSessionId, setTabContent } =
    useWorkspaceStore();
  const content = getTabContentById(activeSessionId!, tabId) as DiffContent;
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Effect to handle content refresh when lastRefresh timestamp changes
  useEffect(() => {
    if (!content || content.type !== 'diff' || !content.lastRefresh) return;

    const refreshDiffContent = async () => {
      if (isRefreshing) return; // Prevent duplicate refreshes

      setIsRefreshing(true);
      try {
        // Extract diff type from tab ID
        const diffType = tabId.includes('StagedVsHead')
          ? 'StagedVsHead'
          : tabId.includes('WorkingVsStaged')
            ? 'WorkingVsStaged'
            : 'WorkingVsHead';

        let originalContent = '';
        let modifiedContent = '';

        // Map diffType to git file modes for full content comparison
        if (diffType === 'StagedVsHead') {
          const [stagedResult, headResult] = await Promise.all([
            sessionsApi.getGitFileContent(
              activeSessionId!,
              content.path,
              'Staged'
            ),
            sessionsApi.getGitFileContent(
              activeSessionId!,
              content.path,
              'Head'
            )
          ]);
          originalContent = headResult.content;
          modifiedContent = stagedResult.content;
        } else if (diffType === 'WorkingVsStaged') {
          const [workingResult, stagedResult] = await Promise.all([
            sessionsApi.getGitFileContent(
              activeSessionId!,
              content.path,
              'Working'
            ),
            sessionsApi.getGitFileContent(
              activeSessionId!,
              content.path,
              'Staged'
            )
          ]);
          originalContent = stagedResult.content;
          modifiedContent = workingResult.content;
        } else {
          const [workingResult, headResult] = await Promise.all([
            sessionsApi.getGitFileContent(
              activeSessionId!,
              content.path,
              'Working'
            ),
            sessionsApi.getGitFileContent(
              activeSessionId!,
              content.path,
              'Head'
            )
          ]);
          originalContent = headResult.content;
          modifiedContent = workingResult.content;
        }

        // Update the tab content
        const updatedContent: DiffContent = {
          ...content,
          original: originalContent,
          modified: modifiedContent
        };

        setTabContent(activeSessionId!, tabId, updatedContent);
      } catch (error) {
        console.error('Failed to refresh diff content:', error);
      } finally {
        setIsRefreshing(false);
      }
    };

    refreshDiffContent();
  }, [
    content?.lastRefresh,
    tabId,
    activeSessionId,
    content?.path,
    isRefreshing,
    setTabContent
  ]);

  // Return early if content is not available
  if (!content || content.type !== 'diff') {
    return (
      <div className="flex items-center justify-center h-full text-neutral-500">
        Content not available
      </div>
    );
  }
  return (
    <div className="flex flex-col h-full">
      <div className="border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <GitCompare className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
            {content.name} (Changes)
          </h2>
          <span className="text-sm text-neutral-500 dark:text-neutral-400">
            {content.path}
          </span>
        </div>
      </div>

      <div className="flex-1">
        <DiffEditor
          height="100%"
          language={content.language}
          original={content.original}
          modified={content.modified}
          theme="vs-dark"
          options={{
            readOnly: true,
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            fontSize: 14,
            renderSideBySide: true,
            ignoreTrimWhitespace: false
          }}
        />
      </div>
    </div>
  );
}

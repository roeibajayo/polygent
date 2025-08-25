import { useBacklogs } from './useBacklogs';
import { Button, Badge, ConfirmDialog } from '@/components';
import {
  Plus,
  Edit3,
  Trash2,
  Filter,
  Search,
  Tag,
  RotateCcw,
  X,
  Building,
  Play,
  ExternalLink
} from 'lucide-react';
import BacklogModal from './BacklogModal';
import BulkTagsModal from './BulkTagsModal';
import BulkStatusModal from './BulkStatusModal';
import BulkWorkspaceModal from './BulkWorkspaceModal';
import StartBacklogSessionModal from './StartBacklogSessionModal';
import { BacklogStatus } from '@/types';

export default function Backlogs() {
  const {
    backlogs,
    workspaces,
    loading,
    selectedBacklog,
    selectedBacklogs,
    showForm,
    showBulkTagsModal,
    setShowBulkTagsModal,
    showBulkStatusModal,
    setShowBulkStatusModal,
    showBulkWorkspaceModal,
    setShowBulkWorkspaceModal,
    showStartSessionModal,
    setShowStartSessionModal,
    selectedBacklogForSession,
    setSelectedBacklogForSession,
    bulkTagsToAdd,
    setBulkTagsToAdd,
    bulkStatusToSet,
    setBulkStatusToSet,
    bulkWorkspaceToSet,
    setBulkWorkspaceToSet,
    formData,
    setFormData,
    setShowForm,
    setSelectedBacklog,
    handleSave,
    handleDelete,
    handleEdit,
    handleCreate,
    handleBulkDelete,
    handleBulkAddTags,
    handleBulkChangeStatus,
    handleBulkChangeWorkspace,
    handleStartSession,
    handleCreateSession,
    handleOpenSession,
    toggleBacklogSelection,
    selectAllBacklogs,
    clearSelection,
    filteredBacklogs,
    filters,
    setFilters,
    confirmDialog,
    setConfirmDialog,
    availableTags
  } = useBacklogs();

  const getStatusDisplayName = (status: BacklogStatus): string => {
    switch (status) {
      case BacklogStatus.InMind:
        return 'In mind';
      case BacklogStatus.Ready:
        return 'Ready';
      case BacklogStatus.InProgress:
        return 'In Progress';
      case BacklogStatus.Done:
        return 'Done';
      case BacklogStatus.Canceled:
        return 'Canceled';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (status: BacklogStatus) => {
    switch (status) {
      case BacklogStatus.InMind:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
      case BacklogStatus.Ready:
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case BacklogStatus.InProgress:
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case BacklogStatus.Done:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case BacklogStatus.Canceled:
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-neutral-100 text-neutral-800 dark:bg-neutral-700 dark:text-neutral-300';
    }
  };

  const statusOptions = [
    'All',
    'In mind',
    'Ready',
    'In Progress',
    'Done',
    'Canceled'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-lg">Loading backlogs...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-neutral-50 dark:bg-neutral-900">
      <div className="p-6 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-neutral-900 dark:text-neutral-100">
              Backlogs
            </h1>
            {selectedBacklogs.size > 0 && (
              <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
                {selectedBacklogs.size} backlog
                {selectedBacklogs.size > 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {selectedBacklogs.size > 0 ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBulkTagsModal(true)}>
                  <Tag className="w-4 h-4 mr-2" />
                  Add Tags
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBulkStatusModal(true)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Change Status
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowBulkWorkspaceModal(true)}>
                  <Building className="w-4 h-4 mr-2" />
                  Set Workspace
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setConfirmDialog({
                      isOpen: true,
                      title: 'Delete Backlogs',
                      message: `Are you sure you want to delete ${selectedBacklogs.size} backlog${selectedBacklogs.size > 1 ? 's' : ''}? This action cannot be undone.`,
                      onConfirm: handleBulkDelete
                    })
                  }>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
                <Button variant="ghost" size="sm" onClick={clearSelection}>
                  <X className="w-4 h-4 mr-2" />
                  Clear
                </Button>
              </>
            ) : (
              <Button onClick={handleCreate} icon={<Plus size={12} />}>
                Create Backlog
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <input
              type="text"
              placeholder="Search backlogs..."
              value={filters.search}
              onChange={(e) =>
                setFilters({ ...filters, search: e.target.value })
              }
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <select
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm">
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-500 dark:text-neutral-400">
              Tags:
            </span>
            <input
              type="text"
              placeholder="Filter by tags..."
              value={filters.tags}
              onChange={(e) => setFilters({ ...filters, tags: e.target.value })}
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm"
            />
          </div>

          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
            <select
              value={filters.workspace}
              onChange={(e) =>
                setFilters({ ...filters, workspace: e.target.value })
              }
              className="px-3 py-1.5 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 text-sm">
              <option value="All">All Workspaces</option>
              <option value="No workspace">No workspace</option>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.name}>
                  {workspace.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={
                  filteredBacklogs.length > 0 &&
                  selectedBacklogs.size === filteredBacklogs.length
                }
                onChange={(e) => {
                  if (e.target.checked) {
                    selectAllBacklogs();
                  } else {
                    clearSelection();
                  }
                }}
                className="rounded border-neutral-300 dark:border-neutral-600"
              />
              <span className="text-sm text-neutral-500 dark:text-neutral-400">
                Select all
              </span>
            </div>
            <div className="text-sm text-neutral-500 dark:text-neutral-400">
              {filteredBacklogs.length} of {backlogs.length} backlogs
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {filteredBacklogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-neutral-500 dark:text-neutral-400 mb-4">
              {backlogs.length === 0
                ? 'No backlogs found'
                : 'No backlogs match your filters'}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border border-neutral-200 dark:border-neutral-700 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-700 border-b border-neutral-200 dark:border-neutral-600">
                <tr>
                  <th className="px-6 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={
                        filteredBacklogs.length > 0 &&
                        selectedBacklogs.size === filteredBacklogs.length
                      }
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllBacklogs();
                        } else {
                          clearSelection();
                        }
                      }}
                      className="rounded border-neutral-300 dark:border-neutral-600"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Workspace
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-right text-xs text-neutral-500 dark:text-neutral-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-600">
                {filteredBacklogs.map((backlog) => (
                  <tr
                    key={backlog.id}
                    className={
                      selectedBacklogs.has(backlog.id)
                        ? 'bg-purple-50 dark:bg-purple-900/20'
                        : ''
                    }>
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedBacklogs.has(backlog.id)}
                        onChange={() => toggleBacklogSelection(backlog.id)}
                        className="rounded border-neutral-300 dark:border-neutral-600"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-900 dark:text-neutral-100">
                        {backlog.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={getStatusColor(backlog.status)}>
                        {getStatusDisplayName(backlog.status)}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-600 dark:text-neutral-300">
                        {backlog.workspaceId
                          ? workspaces.find((w) => w.id === backlog.workspaceId)
                              ?.name || 'Unknown'
                          : 'No workspace'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {backlog.tags && backlog.tags.length > 0 ? (
                          backlog.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 text-xs rounded">
                              {tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-neutral-400 dark:text-neutral-500 text-xs">
                            No tags
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-neutral-600 dark:text-neutral-300 max-w-xs truncate">
                        {backlog.description}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {backlog.sessionId ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenSession(backlog.sessionId!)}>
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Open
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleStartSession(backlog)}>
                          <Play className="w-4 h-4 mr-2" />
                          Start
                        </Button>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(backlog)}>
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setConfirmDialog({
                              isOpen: true,
                              title: 'Delete Backlog',
                              message: `Are you sure you want to delete "${backlog.title}"? This action cannot be undone.`,
                              onConfirm: () => handleDelete(backlog.id)
                            })
                          }>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <BacklogModal
        isOpen={showForm}
        selectedBacklog={selectedBacklog}
        formData={formData}
        setFormData={setFormData}
        onSave={handleSave}
        onClose={() => {
          setShowForm(false);
          setSelectedBacklog(null);
        }}
        availableTags={availableTags}
        workspaces={workspaces}
      />

      {/* Bulk Tags Modal */}
      <BulkTagsModal
        isOpen={showBulkTagsModal}
        selectedCount={selectedBacklogs.size}
        bulkTags={bulkTagsToAdd}
        setBulkTags={setBulkTagsToAdd}
        availableTags={availableTags}
        onSave={handleBulkAddTags}
        onClose={() => {
          setShowBulkTagsModal(false);
          setBulkTagsToAdd([]);
        }}
      />

      {/* Bulk Status Modal */}
      <BulkStatusModal
        isOpen={showBulkStatusModal}
        selectedCount={selectedBacklogs.size}
        bulkStatus={bulkStatusToSet}
        setBulkStatus={setBulkStatusToSet}
        onSave={handleBulkChangeStatus}
        onClose={() => setShowBulkStatusModal(false)}
      />

      {/* Bulk Workspace Modal */}
      <BulkWorkspaceModal
        isOpen={showBulkWorkspaceModal}
        selectedCount={selectedBacklogs.size}
        bulkWorkspaceId={bulkWorkspaceToSet}
        setBulkWorkspaceId={setBulkWorkspaceToSet}
        workspaces={workspaces}
        onSave={handleBulkChangeWorkspace}
        onClose={() => setShowBulkWorkspaceModal(false)}
      />

      {/* Start Session Modal */}
      <StartBacklogSessionModal
        isOpen={showStartSessionModal}
        backlog={selectedBacklogForSession}
        workspaces={workspaces}
        onCreateSession={handleCreateSession}
        onCancel={() => {
          setShowStartSessionModal(false);
          setSelectedBacklogForSession(null);
        }}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          confirmDialog.onConfirm();
          setConfirmDialog({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: () => {}
          });
        }}
        onCancel={() =>
          setConfirmDialog({
            isOpen: false,
            title: '',
            message: '',
            onConfirm: () => {}
          })
        }
        variant="danger"
        confirmText="Delete"
      />
    </div>
  );
}

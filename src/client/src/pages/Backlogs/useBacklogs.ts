import { useState, useEffect, useMemo } from 'react';
import { Backlog, BacklogStatus } from '@/types';
import { backlogsApi } from '@/api/backlogs';
import { sessionsApi, messagesApi } from '@/api';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '@/stores';

interface BacklogFormData {
  title: string;
  description: string;
  status: BacklogStatus;
  tags: string[];
  workspaceId?: number;
  sessionId?: number;
}

interface BacklogFilters {
  search: string;
  status: string;
  tags: string;
  workspace: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function useBacklogs() {
  const navigate = useNavigate();
  const { workspaces, addSession } = useWorkspaceStore();
  const [backlogs, setBacklogs] = useState<Backlog[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBacklog, setSelectedBacklog] = useState<Backlog | null>(null);
  const [selectedBacklogs, setSelectedBacklogs] = useState<Set<number>>(
    new Set()
  );
  const [showForm, setShowForm] = useState(false);
  const [showBulkTagsModal, setShowBulkTagsModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkWorkspaceModal, setShowBulkWorkspaceModal] = useState(false);
  const [showStartSessionModal, setShowStartSessionModal] = useState(false);
  const [selectedBacklogForSession, setSelectedBacklogForSession] = useState<Backlog | null>(null);
  const [bulkTagsToAdd, setBulkTagsToAdd] = useState<string[]>([]);
  const [bulkStatusToSet, setBulkStatusToSet] = useState<BacklogStatus>(
    BacklogStatus.InMind
  );
  const [bulkWorkspaceToSet, setBulkWorkspaceToSet] = useState<
    number | undefined
  >(undefined);
  const [formData, setFormData] = useState<BacklogFormData>({
    title: '',
    description: '',
    status: BacklogStatus.InMind,
    tags: []
  });
  const [filters, setFilters] = useState<BacklogFilters>({
    search: '',
    status: 'All',
    tags: '',
    workspace: 'All'
  });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const fetchedBacklogs = await backlogsApi.getAll();
      setBacklogs(fetchedBacklogs);
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const availableTags = useMemo(() => {
    const allTags = backlogs.flatMap((backlog) => backlog.tags || []);
    return [...new Set(allTags)].sort();
  }, [backlogs]);

  const filteredBacklogs = useMemo(() => {
    return backlogs.filter((backlog) => {
      // Search filter
      const searchMatch =
        filters.search === '' ||
        backlog.title.toLowerCase().includes(filters.search.toLowerCase()) ||
        backlog.description
          .toLowerCase()
          .includes(filters.search.toLowerCase());

      // Status filter
      const statusMatch =
        filters.status === 'All' ||
        (filters.status === 'In mind' &&
          backlog.status === BacklogStatus.InMind) ||
        (filters.status === 'Ready' &&
          backlog.status === BacklogStatus.Ready) ||
        (filters.status === 'In Progress' &&
          backlog.status === BacklogStatus.InProgress) ||
        (filters.status === 'Done' && backlog.status === BacklogStatus.Done) ||
        (filters.status === 'Canceled' &&
          backlog.status === BacklogStatus.Canceled);

      // Tags filter
      const tagsMatch =
        filters.tags === '' ||
        (backlog.tags &&
          backlog.tags.some((tag) =>
            tag.toLowerCase().includes(filters.tags.toLowerCase())
          ));

      // Workspace filter
      const workspaceMatch =
        filters.workspace === 'All' ||
        (filters.workspace === 'No workspace' && !backlog.workspaceId) ||
        (backlog.workspaceId &&
          workspaces.find((w) => w.id === backlog.workspaceId)?.name ===
            filters.workspace);

      return searchMatch && statusMatch && tagsMatch && workspaceMatch;
    });
  }, [backlogs, filters, workspaces]);

  const handleCreate = () => {
    setSelectedBacklog(null);
    setFormData({
      title: '',
      description: '',
      status: BacklogStatus.InMind,
      tags: [],
      workspaceId: undefined,
      sessionId: undefined
    });
    setShowForm(true);
  };

  const handleEdit = (backlog: Backlog) => {
    setSelectedBacklog(backlog);
    setFormData({
      title: backlog.title,
      description: backlog.description,
      status: backlog.status,
      tags: backlog.tags || [],
      workspaceId: backlog.workspaceId,
      sessionId: backlog.sessionId
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    try {
      if (selectedBacklog) {
        const updatedBacklog = await backlogsApi.update(
          selectedBacklog.id,
          formData
        );
        setBacklogs((prev) =>
          prev.map((b) => (b.id === selectedBacklog.id ? updatedBacklog : b))
        );
      } else {
        // Ensure tags is always an array
        const safeTags = Array.isArray(formData.tags) ? formData.tags : [];
        const createData = {
          title: formData.title,
          description: formData.description,
          status: BacklogStatus.InMind,
          tags: safeTags,
          workspaceId: formData.workspaceId,
          sessionId: formData.sessionId
        };
        const newBacklog = await backlogsApi.create(createData);
        setBacklogs((prev) => [...prev, newBacklog]);
      }
      setShowForm(false);
      setSelectedBacklog(null);
    } catch (error) {
      console.error('Failed to save backlog:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await backlogsApi.delete(id);
      setBacklogs((prev) => prev.filter((b) => b.id !== id));
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
      });
    } catch (error) {
      console.error('Failed to delete backlog:', error);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(
        Array.from(selectedBacklogs).map((id) => backlogsApi.delete(id))
      );
      setBacklogs((prev) => prev.filter((b) => !selectedBacklogs.has(b.id)));
      setSelectedBacklogs(new Set());
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
      });
    } catch (error) {
      console.error('Failed to delete backlogs:', error);
    }
  };

  const handleBulkAddTags = async () => {
    try {
      const updatePromises = Array.from(selectedBacklogs).map(async (id) => {
        const backlog = backlogs.find((b) => b.id === id);
        if (backlog) {
          const existingTags = backlog.tags || [];
          const newTags = [...new Set([...existingTags, ...bulkTagsToAdd])];
          const updatedBacklog = await backlogsApi.update(id, {
            title: backlog.title,
            description: backlog.description,
            status: backlog.status,
            tags: newTags,
            workspaceId: backlog.workspaceId,
            sessionId: backlog.sessionId
          });
          return updatedBacklog;
        }
        return null;
      });

      const results = await Promise.all(updatePromises);
      results.forEach((updatedBacklog) => {
        if (updatedBacklog) {
          setBacklogs((prev) =>
            prev.map((b) => (b.id === updatedBacklog.id ? updatedBacklog : b))
          );
        }
      });

      setSelectedBacklogs(new Set());
      setShowBulkTagsModal(false);
      setBulkTagsToAdd([]);
    } catch (error) {
      console.error('Failed to add tags to backlogs:', error);
    }
  };

  const handleBulkChangeStatus = async () => {
    try {
      const updatePromises = Array.from(selectedBacklogs).map(async (id) => {
        const backlog = backlogs.find((b) => b.id === id);
        if (backlog) {
          const updatedBacklog = await backlogsApi.update(id, {
            title: backlog.title,
            description: backlog.description,
            status: bulkStatusToSet,
            tags: backlog.tags || [],
            workspaceId: backlog.workspaceId,
            sessionId: backlog.sessionId
          });
          return updatedBacklog;
        }
        return null;
      });

      const results = await Promise.all(updatePromises);
      results.forEach((updatedBacklog) => {
        if (updatedBacklog) {
          setBacklogs((prev) =>
            prev.map((b) => (b.id === updatedBacklog.id ? updatedBacklog : b))
          );
        }
      });

      setSelectedBacklogs(new Set());
      setShowBulkStatusModal(false);
    } catch (error) {
      console.error('Failed to change status of backlogs:', error);
    }
  };

  const handleBulkChangeWorkspace = async () => {
    try {
      const updatePromises = Array.from(selectedBacklogs).map(async (id) => {
        const backlog = backlogs.find((b) => b.id === id);
        if (backlog) {
          const updatedBacklog = await backlogsApi.update(id, {
            title: backlog.title,
            description: backlog.description,
            status: backlog.status,
            tags: backlog.tags || [],
            workspaceId: bulkWorkspaceToSet,
            sessionId: backlog.sessionId
          });
          return updatedBacklog;
        }
        return null;
      });

      const results = await Promise.all(updatePromises);
      results.forEach((updatedBacklog) => {
        if (updatedBacklog) {
          setBacklogs((prev) =>
            prev.map((b) => (b.id === updatedBacklog.id ? updatedBacklog : b))
          );
        }
      });

      setSelectedBacklogs(new Set());
      setShowBulkWorkspaceModal(false);
    } catch (error) {
      console.error('Failed to change workspace of backlogs:', error);
    }
  };

  const toggleBacklogSelection = (id: number) => {
    setSelectedBacklogs((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const selectAllBacklogs = () => {
    setSelectedBacklogs(new Set(filteredBacklogs.map((b) => b.id)));
  };

  const clearSelection = () => {
    setSelectedBacklogs(new Set());
  };

  const handleStartSession = (backlog: Backlog) => {
    setSelectedBacklogForSession(backlog);
    setShowStartSessionModal(true);
  };

  const handleCreateSession = async (data: {
    workspaceId: number;
    starterGitBranch: string;
    agentId: number;
    backlogId: number;
    initialMessage: string;
  }) => {
    try {
      // Get backlog title for session name
      const backlog = backlogs.find(b => b.id === data.backlogId);
      const sessionName = backlog ? backlog.title : null;
      
      // Create session with backlog title as session name
      const newSession = await sessionsApi.create({
        workspaceId: data.workspaceId,
        starterGitBranch: data.starterGitBranch,
        agentId: data.agentId,
        name: sessionName
      });

      // Add session to global store
      addSession(newSession);

      // Update backlog with session ID
      const updatedBacklog = await backlogsApi.update(data.backlogId, {
        sessionId: newSession.id
      });

      // Update local state
      setBacklogs((prev) =>
        prev.map((b) => (b.id === data.backlogId ? updatedBacklog : b))
      );

      // Send initial message
      await messagesApi.send(newSession.id, {
        content: data.initialMessage
      });

      // Close modal and navigate to session
      setShowStartSessionModal(false);
      setSelectedBacklogForSession(null);
      navigate(`/session/${newSession.id}`);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleOpenSession = (sessionId: number) => {
    navigate(`/session/${sessionId}`);
  };

  return {
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
  };
}

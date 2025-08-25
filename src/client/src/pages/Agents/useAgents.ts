import { useState, useEffect } from 'react';
import { Agent, CreateAgent, UpdateAgent, MCP } from '@/types';
import { agentsApi, mcpsApi } from '@/api';

interface AgentFormData {
  name: string;
  roleName: string;
  model: string;
  systemPrompt: string;
  mcpIds: number[];
  mcps: string[];
}

interface FormErrors {
  name?: string;
  model?: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [mcps, setMcps] = useState<MCP[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AgentFormData>({
    name: '',
    roleName: '',
    model: '',
    systemPrompt: '',
    mcpIds: [],
    mcps: []
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    loadAgents();
    loadMcps();
  }, []);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const agentsData = await agentsApi.getAll();
      setAgents(agentsData);
    } catch (error) {
      console.error('Failed to load agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMcps = async () => {
    try {
      const mcpsData = await mcpsApi.getAll();
      setMcps(mcpsData);
    } catch (error) {
      console.error('Failed to load MCPs:', error);
    }
  };

  const handleCreate = () => {
    setSelectedAgent(null);
    setFormData({
      name: '',
      roleName: '',
      model: '',
      systemPrompt: '',
      mcpIds: [],
      mcps: []
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (agent: Agent) => {
    setSelectedAgent(agent);
    setFormData({
      name: agent.name,
      roleName: agent.roleName,
      model: agent.model,
      systemPrompt: agent.systemPrompt,
      mcpIds: agent.mcpIds,
      mcps: agent.mcps?.map((mcp) => mcp.name) ?? []
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleSave = async () => {
    setFormErrors({});

    const errors: FormErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.model.trim()) {
      errors.model = 'Please select a model for this agent';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      if (selectedAgent) {
        const updateData: UpdateAgent = {
          name: formData.name,
          roleName: formData.roleName,
          model: formData.model,
          systemPrompt: formData.systemPrompt,
          mcpIds: formData.mcpIds
        };
        const updatedAgent = await agentsApi.update(
          selectedAgent.id,
          updateData
        );
        setAgents((prev) =>
          prev?.map((a) => (a.id === selectedAgent.id ? updatedAgent : a))
        );
      } else {
        const createData: CreateAgent = {
          name: formData.name,
          roleName: formData.roleName,
          model: formData.model,
          systemPrompt: formData.systemPrompt,
          mcpIds: formData.mcpIds
        };
        const newAgent = await agentsApi.create(createData);
        setAgents((prev) => [...prev, newAgent]);
      }
      setShowForm(false);
      setSelectedAgent(null);
    } catch (error) {
      console.error('Failed to save agent:', error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await agentsApi.delete(id);
      setAgents((prev) => prev.filter((a) => a.id !== id));
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
      });
    } catch (error) {
      console.error('Failed to delete agent:', error);
    }
  };

  const handleDeleteConfirm = (agentId: number, agentName: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Agent',
      message: `Are you sure you want to delete "${agentName}"? This action cannot be undone.`,
      onConfirm: () => handleDelete(agentId)
    });
  };

  const handleModalClose = () => {
    setShowForm(false);
    setSelectedAgent(null);
  };

  return {
    agents,
    mcps,
    loading,
    selectedAgent,
    showForm,
    formData,
    formErrors,
    setFormData,
    setShowForm,
    setSelectedAgent,
    handleSave,
    handleDelete,
    handleDeleteConfirm,
    handleModalClose,
    handleEdit,
    handleCreate,
    confirmDialog,
    setConfirmDialog
  };
}

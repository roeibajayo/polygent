import { useState, useEffect } from 'react';
import { MCP, CreateMCP, UpdateMCP, MCPType } from '@/types';
import { mcpsApi } from '@/api';

interface MCPFormData {
  name: string;
  description: string;
  type: MCPType;
  path: string;
}

interface FieldErrors {
  name?: string;
  type?: string;
  path?: string;
}

interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
}

export function useMCPs() {
  const [mcps, setMCPs] = useState<MCP[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [selectedMCP, setSelectedMCP] = useState<MCP | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<MCPFormData>({
    name: '',
    description: '',
    type: MCPType.HttpStreaming,
    path: ''
  });
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    loadMCPs();
  }, []);

  const loadMCPs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await mcpsApi.getAll();
      setMCPs(data);
    } catch (error) {
      console.error('Failed to load MCPs:', error);
      setError('Failed to load MCPs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedMCP(null);
    setFormData({
      name: '',
      description: '',
      type: MCPType.HttpStreaming,
      path: ''
    });
    setFieldErrors({});
    setError(null);
    setShowForm(true);
  };

  const handleEdit = (mcp: MCP) => {
    setSelectedMCP(mcp);
    setFormData({
      name: mcp.name,
      description: mcp.description || '',
      type: mcp.type,
      path: mcp.path
    });
    setFieldErrors({});
    setError(null);
    setShowForm(true);
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }

    if (!formData.type) {
      errors.type = 'Type is required';
    }

    if (!formData.path.trim()) {
      errors.path = 'Path is required';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setError(null);
      setFieldErrors({});
      if (selectedMCP) {
        const updateData: UpdateMCP = {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          path: formData.path
        };
        const updatedMCP = await mcpsApi.update(selectedMCP.id, updateData);
        setMCPs((prev) =>
          prev.map((m) => (m.id === selectedMCP.id ? updatedMCP : m))
        );
      } else {
        const createData: CreateMCP = {
          name: formData.name,
          description: formData.description,
          type: formData.type,
          path: formData.path
        };
        const newMCP = await mcpsApi.create(createData);
        setMCPs((prev) => [...prev, newMCP]);
      }
      setShowForm(false);
      setSelectedMCP(null);
    } catch (error) {
      console.error('Failed to save MCP:', error);
      setError('Failed to save MCP. Please try again.');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setError(null);
      await mcpsApi.delete(id);
      setMCPs((prev) => prev.filter((m) => m.id !== id));
      setConfirmDialog({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => {}
      });
    } catch (error) {
      console.error('Failed to delete MCP:', error);
      setError('Failed to delete MCP. Please try again.');
    }
  };

  const handleFieldErrorClear = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => {
      const { [field]: _, ...rest } = prev;
      return rest;
    });
  };

  return {
    mcps,
    loading,
    error,
    setError,
    fieldErrors,
    handleFieldErrorClear,
    selectedMCP,
    showForm,
    formData,
    setFormData,
    setShowForm,
    setSelectedMCP,
    handleSave,
    handleDelete,
    handleEdit,
    handleCreate,
    confirmDialog,
    setConfirmDialog
  };
}

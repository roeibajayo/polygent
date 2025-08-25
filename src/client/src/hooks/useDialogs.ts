import { useState } from 'react';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AlertDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm?: () => void;
}

export function useConfirmDialog() {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showConfirm = (options: Omit<ConfirmDialogState, 'isOpen'>) => {
    setState({
      ...options,
      isOpen: true,
    });
  };

  const hideConfirm = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    state.onConfirm?.();
    hideConfirm();
  };

  const handleCancel = () => {
    state.onCancel?.();
    hideConfirm();
  };

  return {
    confirmDialog: state,
    showConfirm,
    hideConfirm,
    handleConfirm,
    handleCancel,
  };
}

export function useAlertDialog() {
  const [state, setState] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    message: '',
  });

  const showAlert = (options: Omit<AlertDialogState, 'isOpen'>) => {
    setState({
      ...options,
      isOpen: true,
    });
  };

  const hideAlert = () => {
    setState(prev => ({ ...prev, isOpen: false }));
  };

  const handleConfirm = () => {
    state.onConfirm?.();
    hideAlert();
  };

  return {
    alertDialog: state,
    showAlert,
    hideAlert,
    handleConfirm,
  };
}
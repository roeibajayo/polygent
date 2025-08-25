import { Button, Modal } from '@/components';
import { AlertCircle, AlertTriangle, Info } from 'lucide-react';

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
}

export default function AlertDialog({
  isOpen,
  title,
  message,
  confirmText = 'OK',
  variant = 'info',
  onConfirm
}: AlertDialogProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          icon: AlertCircle,
          iconClass: 'text-red-600 dark:text-red-400',
          iconBg: 'bg-red-100 dark:bg-red-900'
        };
      case 'warning':
        return {
          icon: AlertTriangle,
          iconClass: 'text-yellow-600 dark:text-yellow-400',
          iconBg: 'bg-yellow-100 dark:bg-yellow-900'
        };
      case 'info':
        return {
          icon: Info,
          iconClass: 'text-purple-600 dark:text-purple-400',
          iconBg: 'bg-purple-100 dark:bg-purple-900'
        };
    }
  };

  const { icon: Icon, iconClass, iconBg } = getVariantStyles();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onConfirm}
      title={title}
      icon={
        <div
          className={`flex-shrink-0 w-10 h-10 rounded-full ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconClass}`} />
        </div>
      }
      size="sm"
      contentClassName="p-6"
      footer={
        <div className="flex justify-end">
          <Button onClick={onConfirm}>{confirmText}</Button>
        </div>
      }>
      <p className="text-sm text-neutral-600 dark:text-neutral-300">{message}</p>
    </Modal>
  );
}
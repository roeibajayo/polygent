import { ReactNode } from 'react';
import { Button } from '@/components';
import { XIcon } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  contentClassName?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const sizeClasses = {
  sm: 'max-w-md',
  md: 'max-w-2xl',
  lg: 'max-w-4xl',
  xl: 'max-w-6xl',
  full: 'max-w-full mx-4'
};

export default function Modal({
  isOpen,
  onClose,
  title,
  icon,
  children,
  footer,
  className = '',
  contentClassName = '',
  size = 'lg'
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Modal Content */}
      <div
        className={`relative bg-white dark:bg-neutral-800 rounded-lg shadow-xl w-full ${sizeClasses[size]} max-h-[80vh] flex flex-col ${className}`}>
        {/* Header */}
        {(title || icon) && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
            <div className="flex items-center gap-3">
              {icon}
              {title && (
                <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                  {title}
                </h2>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <XIcon size={20} />
            </Button>
          </div>
        )}

        {/* Content */}
        <div className={`flex-1 overflow-y-auto ${contentClassName}`}>
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-neutral-200 dark:border-neutral-700">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

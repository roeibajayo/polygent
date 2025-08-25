import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md';
  className?: string;
}

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = ''
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center rounded-full';

  const variantClasses = {
    default: 'bg-neutral-100 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200',
    success:
      'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200',
    warning:
      'bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200',
    error: 'bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200'
  };

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-0.5 text-sm'
  };

  const classes =
    `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`.trim();

  return <span className={classes}>{children}</span>;
}

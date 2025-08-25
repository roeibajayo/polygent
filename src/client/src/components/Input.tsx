import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({
  label,
  error,
  className = '',
  ...props
}: InputProps) {
  const baseClasses =
    'block w-full rounded-md border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 shadow-sm focus:border-purple-500 sm:text-sm';
  const errorClasses = error
    ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
    : '';
  const classes = `${baseClasses} ${errorClasses} ${className}`.trim();

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
      )}
      <input className={classes} {...props} />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

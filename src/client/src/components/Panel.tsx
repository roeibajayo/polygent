import { useState, useRef } from 'react';

interface PanelOption {
  value: string;
  label: string;
}

interface PanelProps {
  options: PanelOption[];
  title: string;
  onSelect: (option: PanelOption) => void;
  className?: string;
}

export default function Panel({
  options,
  title,
  onSelect,
  className = ''
}: PanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={`relative ${className}`}
      ref={panelRef}
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}>
      <button
        type="button"
        className="relative w-full rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 py-2 px-3 text-left shadow-sm hover:bg-neutral-50 dark:hover:bg-neutral-700 focus:border-purple-500 focus:ring-1 sm:text-sm text-neutral-900 dark:text-neutral-100">
        <span className="block truncate">{title}</span>
      </button>

      {isOpen && (
        <div className="absolute z-20 w-48 rounded-md bg-white dark:bg-neutral-800 py-2 shadow-lg ring-1 ring-black dark:ring-neutral-600 ring-opacity-5 border border-neutral-200 dark:border-neutral-700">
          <div className="px-3 py-2 border-b border-neutral-200 dark:border-neutral-700">
            <h3 className="text-sm text-neutral-900 dark:text-neutral-100">
              {title} Actions
            </h3>
          </div>
          <div className="py-1">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className="w-full text-left px-3 py-2 text-sm text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-700 hover:text-neutral-900 dark:hover:text-neutral-100">
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

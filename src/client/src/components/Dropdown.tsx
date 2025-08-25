import { useState, useRef, useEffect } from 'react';

interface DropdownOption {
  value: string;
  label: string;
}

interface DropdownProps {
  options: DropdownOption[];
  value?: string;
  placeholder?: string;
  onSelect: (option: DropdownOption) => void;
  className?: string;
  dropdownWidth?: string;
  alignRight?: boolean;
  openUpward?: boolean;
}

export default function Dropdown({
  options,
  value,
  placeholder = 'Select an option',
  onSelect,
  className = '',
  dropdownWidth,
  alignRight = false,
  openUpward = false
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((option) => option.value === value);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative w-full cursor-default rounded-md border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 py-2 pl-3 pr-10 text-left shadow-sm focus:border-purple-500 focus:ring-1 sm:text-sm text-neutral-900 dark:text-neutral-100">
        <span className="block truncate">
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
          <svg
            className="h-5 w-5 text-neutral-400 dark:text-neutral-500"
            viewBox="0 0 20 20"
            fill="currentColor">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </span>
      </button>

      {isOpen && (
        <div
          className={`absolute z-10 ${openUpward ? 'bottom-full mb-1' : 'mt-1'} max-h-60 overflow-auto rounded-md bg-white dark:bg-neutral-800 py-1 text-base shadow-lg ring-1 ring-black dark:ring-neutral-600 ring-opacity-5 sm:text-sm ${dropdownWidth || 'w-full'} ${alignRight ? 'right-0' : ''}`}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onSelect(option);
                setIsOpen(false);
              }}
              className={`relative w-full cursor-default select-none py-2 pl-3 pr-9 text-left hover:bg-purple-900 hover:text-white`}>
              <span className="block truncate">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

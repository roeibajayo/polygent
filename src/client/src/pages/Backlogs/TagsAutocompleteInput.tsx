import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';

interface TagsAutocompleteInputProps {
  selectedTags: string[];
  availableTags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
}

export default function TagsAutocompleteInput({
  selectedTags,
  availableTags,
  onChange,
  placeholder = 'Type to add tags...'
}: TagsAutocompleteInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (inputValue.trim()) {
      const unselectedTags = availableTags.filter(
        (tag) =>
          !selectedTags.includes(tag) &&
          tag.toLowerCase().includes(inputValue.toLowerCase())
      );
      setFilteredSuggestions(unselectedTags);
      setShowSuggestions(unselectedTags.length > 0);
    } else {
      setShowSuggestions(false);
      setFilteredSuggestions([]);
    }
    setActiveSuggestion(-1);
  }, [inputValue, availableTags, selectedTags]);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      const newTags = [...selectedTags, trimmedTag];
      onChange(newTags);
    }
    setInputValue('');
    setShowSuggestions(false);
    setActiveSuggestion(-1);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (activeSuggestion >= 0 && filteredSuggestions[activeSuggestion]) {
        addTag(filteredSuggestions[activeSuggestion]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestion((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    } else if (
      e.key === 'Backspace' &&
      !inputValue &&
      selectedTags.length > 0
    ) {
      removeTag(selectedTags[selectedTags.length - 1]);
    } else if (e.key === ',' || e.key === 'Tab') {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    }
  };

  const handleClickOutside = (e: MouseEvent) => {
    if (
      inputRef.current &&
      !inputRef.current.contains(e.target as Node) &&
      suggestionsRef.current &&
      !suggestionsRef.current.contains(e.target as Node)
    ) {
      setShowSuggestions(false);
      setActiveSuggestion(-1);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 p-2 border border-neutral-300 dark:border-neutral-600 rounded-md bg-white dark:bg-neutral-700 min-h-[42px] focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent">
        {selectedTags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-sm rounded">
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="ml-1 text-purple-600 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-100">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={selectedTags.length === 0 ? placeholder : ''}
          className="flex-1 outline-none bg-transparent text-neutral-900 dark:text-neutral-100 min-w-[120px]"
        />
      </div>

      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute top-full left-0 right-0 z-10 mt-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-md shadow-lg max-h-40 overflow-y-auto">
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-600 ${
                index === activeSuggestion
                  ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                  : 'text-neutral-900 dark:text-neutral-100'
              }`}>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

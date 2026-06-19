'use client';

import { useState, useMemo } from 'react';

interface SearchInputProps {
  /** Placeholder text for the search input */
  placeholder?: string;
  /** Callback fired when the search term changes, receives filtered results */
  onSearch: (term: string) => void;
  /** Debounce delay in ms (default: 200) */
  debounceMs?: number;
}

/**
 * A search input that calls `onSearch` as the user types.
 * For use in client components that wrap server-fetched data.
 */
export default function SearchInput({
  placeholder = 'Search...',
  onSearch,
  debounceMs = 200,
}: SearchInputProps) {
  const [value, setValue] = useState('');

  // Debounced search
  useMemo(() => {
    const timer = setTimeout(() => {
      onSearch(value);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [value, debounceMs, onSearch]);

  return (
    <div className="relative flex-1 max-w-xs">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">
        <span className="material-symbols-outlined text-[18px]">search</span>
      </span>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-10 pr-4 py-2 text-body-md focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
          aria-label="Clear search"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}
    </div>
  );
}

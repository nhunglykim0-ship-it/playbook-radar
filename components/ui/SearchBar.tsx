'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  initialValue?: string;
  placeholder?: string;
}

export default function SearchBar({ 
  onSearch, 
  initialValue = '', 
  placeholder = '搜索玩法、教程、工具...' 
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);
  const [isFocused, setIsFocused] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);

    // 防抖搜索
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      onSearch(newValue);
    }, 300);
  };

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  return (
    <div className={`relative flex items-center bg-white dark:bg-dark-100 rounded-xl border transition-all ${
      isFocused 
        ? 'border-primary-400 ring-2 ring-primary-100 dark:ring-primary-900/30' 
        : 'border-gray-200 dark:border-gray-700'
    }`}>
      <span className="pl-4 text-gray-400 text-lg">🔍</span>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-transparent border-none outline-none text-gray-800 dark:text-gray-200 placeholder-gray-400"
      />
      {value && (
        <button
          onClick={handleClear}
          className="mr-3 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}
    </div>
  );
}

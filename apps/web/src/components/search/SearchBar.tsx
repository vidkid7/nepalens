"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect, useRef, FormEvent } from "react";

interface SearchBarProps {
  compact?: boolean;
  defaultValue?: string;
  autoFocus?: boolean;
}

export default function SearchBar({ compact, defaultValue = "", autoFocus }: SearchBarProps) {
  const [query, setQuery] = useState(defaultValue);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      const trimmed = query.trim();
      if (trimmed) {
        setShowSuggestions(false);
        router.push(`/search/${encodeURIComponent(trimmed)}`);
        inputRef.current?.blur();
      }
    },
    [query, router]
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      setQuery(suggestion);
      setShowSuggestions(false);
      router.push(`/search/${encodeURIComponent(suggestion)}`);
    },
    [router]
  );

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/internal/search/autocomplete?q=${encodeURIComponent(query.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        }
      } catch {
        setSuggestions([]);
      }
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard navigation for suggestions
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showSuggestions || suggestions.length === 0) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, -1));
      } else if (e.key === "Enter" && selectedIndex >= 0) {
        e.preventDefault();
        handleSuggestionClick(suggestions[selectedIndex]);
      } else if (e.key === "Escape") {
        setShowSuggestions(false);
      }
    },
    [showSuggestions, suggestions, selectedIndex, handleSuggestionClick]
  );

  if (compact) {
    return (
      <div ref={wrapperRef} className="relative w-full">
        <form onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            onKeyDown={handleKeyDown}
            placeholder="Search for free photos & videos"
            className="w-full h-10 pl-10 pr-4 bg-surface-100 rounded-lg text-caption text-surface-900 placeholder-surface-400 focus:outline-none focus:ring-2 focus:ring-brand/30 focus:bg-white transition-all"
            aria-label="Search"
            role="combobox"
            aria-expanded={showSuggestions && suggestions.length > 0}
            autoComplete="off"
          />
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </form>
        {showSuggestions && suggestions.length > 0 && (
          <SuggestionsList
            suggestions={suggestions}
            selectedIndex={selectedIndex}
            onSelect={handleSuggestionClick}
          />
        )}
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="relative w-full max-w-3xl">
      <form onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search for free photos and videos"
          autoFocus={autoFocus}
          className="w-full h-14 sm:h-16 pl-6 pr-16 bg-white rounded-2xl text-body sm:text-subtitle text-surface-900 placeholder-surface-400 shadow-2xl focus:outline-none focus:ring-4 focus:ring-white/30 transition-all"
          aria-label="Search"
          role="combobox"
          aria-expanded={showSuggestions && suggestions.length > 0}
          autoComplete="off"
        />
        <button
          type="submit"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-3 bg-brand rounded-xl text-white hover:bg-brand-600 active:bg-brand-700 transition-colors"
          aria-label="Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </form>
      {showSuggestions && suggestions.length > 0 && (
        <SuggestionsList
          suggestions={suggestions}
          selectedIndex={selectedIndex}
          onSelect={handleSuggestionClick}
        />
      )}
    </div>
  );
}

function SuggestionsList({
  suggestions,
  selectedIndex,
  onSelect,
}: {
  suggestions: string[];
  selectedIndex: number;
  onSelect: (s: string) => void;
}) {
  return (
    <ul
      role="listbox"
      className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-overlay border border-surface-100 py-1.5 z-dropdown max-h-[300px] overflow-y-auto animate-fade-in-down"
    >
      {suggestions.map((s, i) => (
        <li
          key={s}
          role="option"
          aria-selected={i === selectedIndex}
          className={`px-4 py-2.5 text-caption cursor-pointer flex items-center gap-2.5 transition-colors ${
            i === selectedIndex ? "bg-surface-50 text-surface-900" : "text-surface-600 hover:bg-surface-50"
          }`}
          onClick={() => onSelect(s)}
        >
          <svg className="w-3.5 h-3.5 text-surface-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          {s}
        </li>
      ))}
    </ul>
  );
}

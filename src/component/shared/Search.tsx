'use client';

import { api } from '@/lib';
import { useState, useEffect, useRef } from 'react';

interface SearchResult {
  id: string;
  username: string;
  display_name: string;
}

export default function UserSearch({
  onSelectUser,
}: {
  onSelectUser: (user: SearchResult) => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debounced search
  useEffect(() => {
    if (query.length < 1) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        // ✅ GET /users/search?q={query}
        const data = await api.users.search(query);
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Search failed:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Input */}
      <div className="relative">
        <svg
          className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search users..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-800 focus:border-slate-600 rounded-xl text-xs text-white font-mono placeholder:text-slate-700 outline-none transition-all"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 border border-emerald-500 border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      {/* Results dropdown */}
      {results.length > 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden">
          {results.map(user => (
            <button
              key={user.id}
              onClick={() => {
                onSelectUser(user);
                setQuery('');
                setResults([]);
              }}
              className="w-full text-left px-4 py-3 hover:bg-slate-800 flex flex-col gap-0.5 transition-colors border-b border-slate-800/60 last:border-none"
            >
              <span className="font-bold text-white text-xs">{user.display_name}</span>
              <span className="text-[10px] text-slate-500 font-mono">@{user.username}</span>
            </button>
          ))}
        </div>
      )}

      {/* Empty state */}
      {query.length >= 1 && !isSearching && results.length === 0 && (
        <div className="absolute z-50 mt-1.5 w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3">
          <p className="text-xs text-slate-600 font-mono">No users found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
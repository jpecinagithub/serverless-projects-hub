import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

/**
 * Debounced search input (300 ms). Fires onChange only after the user pauses,
 * so the directory feels instant without hammering the API.
 */
export function SearchBar({ value, onChange, placeholder = 'Search projects...' }) {
  const [local, setLocal] = useState(value || '');

  useEffect(() => setLocal(value || ''), [value]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (local !== value) onChange(local);
    }, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [local]);

  return (
    <div className="relative w-full">
      <Search
        size={18}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <input
        type="search"
        role="searchbox"
        aria-label="Search projects"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="h-12 w-full rounded-2xl border border-zinc-300 bg-white pl-11 pr-11 text-[15px] text-zinc-900 placeholder:text-zinc-400 shadow-sm transition-colors focus:border-zinc-950"
      />
      {local && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => setLocal('')}
          className="absolute right-3 top-1/2 grid size-7 -translate-y-1/2 place-items-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}

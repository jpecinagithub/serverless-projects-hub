import { ArrowDownWideNarrow } from 'lucide-react';

const OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'rating', label: 'Highest Rated' },
  { value: 'popular', label: 'Most Rated' },
];

export function SortControls({ value, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden items-center gap-1.5 text-zinc-500 sm:flex">
        <ArrowDownWideNarrow size={16} />
        Sort by
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Sort projects"
        className="h-12 cursor-pointer rounded-2xl border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-900 shadow-sm transition-colors focus:border-zinc-950"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

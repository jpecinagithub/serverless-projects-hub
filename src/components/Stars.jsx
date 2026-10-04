import { Star } from 'lucide-react';

/**
 * Read-only star visualization. Shows a fractional fill (e.g. 4.3) using two
 * overlaid rows of stars. Purely visual — aria-hidden with a text fallback.
 */
export function Stars({ value = 0, size = 16, className = '' }) {
  const pct = Math.max(0, Math.min(100, (Number(value) / 5) * 100));
  const row = (filled) => (
    <div className="flex gap-0.5" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={filled ? 0 : 1.5}
          className={filled ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'}
        />
      ))}
    </div>
  );
  return (
    <span className={`relative inline-flex ${className}`} role="img" aria-label={`Rated ${value} out of 5 stars`}>
      {row(false)}
      <span
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${pct}%` }}
        aria-hidden="true"
      >
        {row(true)}
      </span>
    </span>
  );
}

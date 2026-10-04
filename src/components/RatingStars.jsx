import { useCallback, useRef, useState } from 'react';
import { Star } from 'lucide-react';

/**
 * Interactive 1–5 star rating control.
 * - Hover highlights the intended rating with a smooth scale animation.
 * - Fully keyboard accessible: Tab to focus, arrows/Home/End to choose, Enter/Space to confirm.
 * - Screen readers get a proper radiogroup.
 */
export function RatingStars({
  value = 0,
  onRate,
  disabled = false,
  size = 34,
  id = 'rating-stars',
}) {
  const [hovered, setHovered] = useState(0);
  const buttonsRef = useRef([]);
  const shown = hovered || value;

  const choose = useCallback(
    (n) => {
      if (disabled) return;
      onRate?.(n);
    },
    [disabled, onRate]
  );

  const onKeyDown = (e, n) => {
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = Math.min(5, n + 1);
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = Math.max(1, n - 1);
    else if (e.key === 'Home') next = 1;
    else if (e.key === 'End') next = 5;
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      choose(n);
      return;
    } else return;
    e.preventDefault();
    buttonsRef.current[next - 1]?.focus();
    setHovered(next);
  };

  return (
    <div
      role="radiogroup"
      aria-label="Rate this project from 1 to 5 stars"
      aria-disabled={disabled}
      id={id}
      className="flex items-center gap-1.5"
      onMouseLeave={() => setHovered(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const active = n <= shown;
        return (
          <button
            key={n}
            ref={(el) => (buttonsRef.current[n - 1] = el)}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} star${n === 1 ? '' : 's'}`}
            disabled={disabled}
            onClick={() => choose(n)}
            onMouseEnter={() => !disabled && setHovered(n)}
            onFocus={() => !disabled && setHovered(n)}
            onBlur={() => setHovered(0)}
            onKeyDown={(e) => onKeyDown(e, n)}
            className={[
              'rounded-md p-1 transition-all duration-150 ease-out',
              'hover:scale-125 focus-visible:scale-125 active:scale-110',
              disabled ? 'cursor-default opacity-60' : 'cursor-pointer',
            ].join(' ')}
          >
            <Star
              size={size}
              strokeWidth={1.5}
              className={[
                'transition-colors duration-150',
                active ? 'fill-amber-400 text-amber-400 drop-shadow-sm' : 'fill-zinc-100 text-zinc-300',
              ].join(' ')}
            />
          </button>
        );
      })}
      <span className="ml-2 min-w-16 text-sm font-medium text-zinc-500" aria-live="polite">
        {shown > 0 ? `${shown} / 5` : 'Tap a star'}
      </span>
    </div>
  );
}

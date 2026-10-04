export function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatRating(avg) {
  const n = Number(avg) || 0;
  return (Math.round(n * 10) / 10).toFixed(1);
}

export function ratingsLabel(count) {
  const n = Number(count) || 0;
  return `${n} ${n === 1 ? 'rating' : 'ratings'}`;
}

export function truncate(s, max) {
  const str = String(s || '');
  return str.length > max ? `${str.slice(0, max - 1).trimEnd()}…` : str;
}

export function formatBytes(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

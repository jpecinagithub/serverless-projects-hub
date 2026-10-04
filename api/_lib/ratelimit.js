/**
 * Best-effort, per-instance rate limiting.
 *
 * IMPORTANT: serverless functions do not share memory between instances, so
 * this bucket only throttles bursts hitting the same warm instance. It is a
 * cheap first line of defense against naive abuse (e.g. rating spam loops).
 * For strict distributed limiting, put Upstash Redis in front of these routes.
 */
const buckets = new Map();

function sweep(now) {
  if (buckets.size < 2000) return;
  for (const [key, bucket] of buckets) {
    if (now > bucket.reset) buckets.delete(key);
  }
}

export function rateLimit(key, { limit = 60, windowMs = 60_000 } = {}) {
  const now = Date.now();
  sweep(now);
  let bucket = buckets.get(key);
  if (!bucket || now > bucket.reset) {
    bucket = { count: 0, reset: now + windowMs };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterMs: bucket.count <= limit ? 0 : bucket.reset - now,
  };
}

export function clientIp(req) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '');
  const first = forwarded.split(',')[0].trim();
  return first || req.socket?.remoteAddress || 'unknown';
}

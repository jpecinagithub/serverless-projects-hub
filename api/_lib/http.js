/**
 * Shared HTTP helpers for Vercel Serverless Functions.
 * Plain Node (req, res) — no framework, works on every invocation
 * (never assume state survives between requests).
 */

export function json(res, status, payload) {
  const body = JSON.stringify(payload);
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Content-Length', Buffer.byteLength(body));
  // Never cache mutable API responses at the edge by default.
  res.setHeader('Cache-Control', 'no-store');
  res.end(body);
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  return json(res, 405, { error: `Method not allowed. Use: ${allowed.join(', ')}` });
}

export async function readJson(req, maxBytes = 64 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > maxBytes) {
      const err = new Error('Payload too large');
      err.status = 413;
      throw err;
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const err = new Error('Invalid JSON body');
    err.status = 400;
    throw err;
  }
}

/** Wrap a handler with a top-level error boundary producing clean messages. */
export function withErrorHandling(handler) {
  return async (req, res) => {
    try {
      await handler(req, res);
    } catch (err) {
      const status = err.status && Number.isInteger(err.status) ? err.status : 500;
      if (status === 500) console.error('[api] Unhandled error:', err);
      // Never leak raw database/driver errors to clients.
      const message =
        status === 500
          ? 'Something went wrong on our side. Please try again.'
          : err.message || 'Request failed.';
      json(res, status, { error: message });
    }
  };
}

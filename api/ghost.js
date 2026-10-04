/**
 * GET /api/ghost?token=<ghost-token>
 *
 * Redeems a ghost link: when the token matches, an admin session cookie is
 * set (same as a normal admin login). A wrong or missing token answers 404,
 * indistinguishable from a page that does not exist — the link stays hidden.
 */
import { json, methodNotAllowed, withErrorHandling } from './_lib/http.js';
import { verifyGhostToken, setAdminCookie } from './_lib/auth.js';
import { rateLimit, clientIp } from './_lib/ratelimit.js';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const rl = rateLimit(`ghost:${clientIp(req)}`, { limit: 20, windowMs: 60_000 });
  if (!rl.allowed) {
    return json(res, 429, { error: 'Too many attempts. Please wait a minute.' });
  }

  const url = new URL(req.url || '/', 'http://localhost');
  if (!verifyGhostToken(url.searchParams.get('token'))) {
    // Small delay + 404 so the endpoint does not reveal itself to scanners.
    await new Promise((r) => setTimeout(r, 300));
    return json(res, 404, { error: 'Not found.' });
  }

  setAdminCookie(res);
  json(res, 200, { ok: true });
}

export default withErrorHandling(handler);

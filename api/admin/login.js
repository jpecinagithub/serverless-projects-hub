/**
 * POST /api/admin/login   { secret }
 * Sets an httpOnly admin cookie when the secret matches ADMIN_SECRET.
 */
import { json, methodNotAllowed, readJson, withErrorHandling } from '../_lib/http.js';
import { adminConfigured, verifyAdminSecret, setAdminCookie } from '../_lib/auth.js';
import { rateLimit, clientIp } from '../_lib/ratelimit.js';

async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const rl = rateLimit(`admin-login:${clientIp(req)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return json(res, 429, { error: 'Too many attempts. Please wait a minute.' });
  }

  if (!adminConfigured()) {
    return json(res, 503, {
      error: 'Admin access is not configured. Set the ADMIN_SECRET environment variable.',
    });
  }

  const body = await readJson(req);
  if (!verifyAdminSecret(body?.secret)) {
    // Small constant-ish delay to blunt brute force.
    await new Promise((r) => setTimeout(r, 400));
    return json(res, 401, { error: 'Incorrect admin secret.' });
  }

  setAdminCookie(res);
  json(res, 200, { ok: true });
}

export default withErrorHandling(handler);

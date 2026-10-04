/**
 * POST /api/admin/logout — clears the admin cookie.
 */
import { json, methodNotAllowed, withErrorHandling } from '../_lib/http.js';
import { clearAdminCookie } from '../_lib/auth.js';

async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);
  clearAdminCookie(res);
  json(res, 200, { ok: true });
}

export default withErrorHandling(handler);

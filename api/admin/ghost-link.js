/**
 * GET /api/admin/ghost-link — returns the owner's private ghost-link URL.
 * Admin only. The link is shown in the admin dashboard so it can be
 * bookmarked; it is never linked anywhere in the public UI.
 */
import { json, methodNotAllowed, withErrorHandling } from '../_lib/http.js';
import { requireAdmin, ghostToken } from '../_lib/auth.js';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!requireAdmin(req, res, json)) return;

  const host =
    req.headers?.['x-forwarded-host'] || req.headers?.host || 'serverless-projects-hub.vercel.app';
  const proto = req.headers?.['x-forwarded-proto'] || 'https';
  json(res, 200, { url: `${proto}://${host}/g/${ghostToken()}` });
}

export default withErrorHandling(handler);

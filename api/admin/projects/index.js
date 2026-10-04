/**
 * GET /api/admin/projects — every project (any status) with aggregates,
 * newest first. Admin only. Contact emails stay server-side.
 */
import { query, toPublicProject, PROJECTS_WITH_RATINGS } from '../../_lib/db.js';
import { json, methodNotAllowed, withErrorHandling } from '../../_lib/http.js';
import { requireAdmin } from '../../_lib/auth.js';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!requireAdmin(req, res, json)) return;

  const result = await query(
    `${PROJECTS_WITH_RATINGS}
     GROUP BY p.id
     ORDER BY p.created_at DESC
     LIMIT 500`
  );

  json(res, 200, { projects: result.rows.map(toPublicProject) });
}

export default withErrorHandling(handler);

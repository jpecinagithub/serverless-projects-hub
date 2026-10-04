/**
 * GET /api/projects/:id — full public project info with rating aggregates.
 * Only published projects are visible; anything else is a 404.
 */
import { query, toPublicProject, PROJECTS_WITH_RATINGS } from '../_lib/db.js';
import { json, methodNotAllowed, withErrorHandling } from '../_lib/http.js';
import { isUuid } from '../_lib/validation.js';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  const id = req.query?.id;
  if (!isUuid(id)) {
    return json(res, 404, { error: 'Project not found.' });
  }

  const result = await query(
    `${PROJECTS_WITH_RATINGS}
     WHERE p.id = $1 AND p.status = 'published'
     GROUP BY p.id`,
    [id]
  );

  if (result.rows.length === 0) {
    return json(res, 404, { error: 'Project not found.' });
  }

  json(res, 200, { project: toPublicProject(result.rows[0]) });
}

export default withErrorHandling(handler);

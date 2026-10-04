/**
 * POST /api/projects/:id/rating   { visitorId, rating }
 *
 * One rating per (project_id, visitor_id) — enforced by a UNIQUE constraint.
 * Uses an UPSERT so visitors can update their previous rating instead of
 * creating duplicate votes. Averages are always recomputed from the table.
 */
import { query, PROJECTS_WITH_RATINGS } from '../../_lib/db.js';
import { json, methodNotAllowed, readJson, withErrorHandling } from '../../_lib/http.js';
import { ratingSchema, firstIssueMessage, isUuid } from '../../_lib/validation.js';
import { rateLimit, clientIp } from '../../_lib/ratelimit.js';

async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const id = req.query?.id;
  if (!isUuid(id)) {
    return json(res, 404, { error: 'Project not found.' });
  }

  const rl = rateLimit(`rating:${clientIp(req)}`, { limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return json(res, 429, {
      error: "You're rating too fast. Please wait a moment and try again.",
    });
  }

  const body = await readJson(req);
  const parsed = ratingSchema.safeParse(body);
  if (!parsed.success) {
    return json(res, 400, { error: firstIssueMessage(parsed.error) });
  }
  const { visitorId, rating } = parsed.data;

  // The project must exist and be published.
  const projectRes = await query(
    `SELECT id FROM projects WHERE id = $1 AND status = 'published'`,
    [id]
  );
  if (projectRes.rows.length === 0) {
    return json(res, 404, { error: 'Project not found.' });
  }

  await query(
    `INSERT INTO ratings (project_id, visitor_id, rating)
     VALUES ($1, $2, $3)
     ON CONFLICT (project_id, visitor_id)
     DO UPDATE SET rating = EXCLUDED.rating, updated_at = NOW()`,
    [id, visitorId, rating]
  );

  const agg = await query(
    `${PROJECTS_WITH_RATINGS}
     WHERE p.id = $1
     GROUP BY p.id`,
    [id]
  );
  const row = agg.rows[0];

  json(res, 200, {
    message: 'Thank you for your rating!',
    yourRating: rating,
    averageRating: Number(row.average_rating),
    ratingCount: Number(row.rating_count),
  });
}

export default withErrorHandling(handler);

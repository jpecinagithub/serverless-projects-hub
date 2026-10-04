/**
 * GET /api/admin/stats — dashboard counters (admin only).
 */
import { query } from '../_lib/db.js';
import { json, methodNotAllowed, withErrorHandling } from '../_lib/http.js';
import { requireAdmin } from '../_lib/auth.js';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);
  if (!requireAdmin(req, res, json)) return;

  const [projects, ratings, avg, week] = await Promise.all([
    query(`SELECT COUNT(*)::int AS c FROM projects`),
    query(`SELECT COUNT(*)::int AS c FROM ratings`),
    query(`SELECT COALESCE(AVG(rating), 0)::float AS avg FROM ratings`),
    query(
      `SELECT COUNT(*)::int AS c FROM projects WHERE created_at >= NOW() - INTERVAL '7 days'`
    ),
  ]);

  json(res, 200, {
    totalProjects: projects.rows[0].c,
    totalRatings: ratings.rows[0].c,
    averageRating: avg.rows[0].avg,
    newThisWeek: week.rows[0].c,
  });
}

export default withErrorHandling(handler);

/**
 * GET  /api/projects?page=1&limit=12&sort=newest|rating|popular&search=...&min_ratings=5
 * POST /api/projects   { title, url, description, author_name, author_bio?, contact_email?, image_url? }
 */
import { query, toPublicProject, PROJECTS_WITH_RATINGS } from '../_lib/db.js';
import { json, methodNotAllowed, readJson, withErrorHandling } from '../_lib/http.js';
import {
  projectSchema,
  normalizeUrl,
  firstIssueMessage,
} from '../_lib/validation.js';
import { rateLimit, clientIp } from '../_lib/ratelimit.js';

// Whitelisted sort expressions — the only dynamic SQL identifiers allowed.
const SORTS = {
  newest: 'p.created_at DESC',
  rating: 'average_rating DESC, rating_count DESC, p.created_at DESC',
  popular: 'rating_count DESC, average_rating DESC, p.created_at DESC',
};

function escapeLike(s) {
  return s.replace(/[\\%_]/g, (m) => `\\${m}`);
}

async function listProjects(req, res) {
  const q = req.query || {};
  const page = Math.max(1, parseInt(q.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(q.limit, 10) || 12));
  const sortKey = SORTS[q.sort] ? q.sort : 'newest';
  const search = String(q.search || '').trim().slice(0, 100);
  const minRatings = Math.max(0, parseInt(q.min_ratings, 10) || 0);
  const offset = (page - 1) * limit;

  const params = [];
  const conditions = [`p.status = 'published'`];
  if (search) {
    params.push(`%${escapeLike(search)}%`);
    const ph = `$${params.length}`;
    conditions.push(
      `(p.title ILIKE ${ph} ESCAPE '\\' OR p.description ILIKE ${ph} ESCAPE '\\' OR p.author_name ILIKE ${ph} ESCAPE '\\')`
    );
  }

  params.push(limit, offset);
  const limitPh = `$${params.length - 1}`;
  const offsetPh = `$${params.length}`;

  const listText = `
    ${PROJECTS_WITH_RATINGS}
    WHERE ${conditions.join(' AND ')}
    GROUP BY p.id
    ${minRatings > 0 ? `HAVING COUNT(r.id) >= ${minRatings}` : ''}
    ORDER BY ${SORTS[sortKey]}
    LIMIT ${limitPh} OFFSET ${offsetPh}
  `;
  const listRes = await query(listText, params);

  // Total for pagination (same filters; aggregates unnecessary here).
  const countParams = [];
  const countConditions = [`status = 'published'`];
  if (search) {
    countParams.push(`%${escapeLike(search)}%`);
    countConditions.push(
      `(title ILIKE $1 ESCAPE '\\' OR description ILIKE $1 ESCAPE '\\' OR author_name ILIKE $1 ESCAPE '\\')`
    );
  }
  let total;
  if (minRatings > 0) {
    // Exact total with a rating-count filter needs the aggregate; the only
    // consumer (featured row) reads page 1, so counting the page is enough.
    total = listRes.rows.length;
  } else {
    const countRes = await query(
      `SELECT COUNT(*)::int AS total FROM projects WHERE ${countConditions.join(' AND ')}`,
      countParams
    );
    total = countRes.rows[0].total;
  }

  json(res, 200, {
    projects: listRes.rows.map(toPublicProject),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  });
}

async function createProject(req, res) {
  const rl = rateLimit(`create:${clientIp(req)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return json(res, 429, {
      error: 'Too many submissions. Please wait a minute and try again.',
    });
  }

  const body = await readJson(req);
  const parsed = projectSchema.safeParse(body);
  if (!parsed.success) {
    return json(res, 400, { error: firstIssueMessage(parsed.error) });
  }

  const normalized = normalizeUrl(parsed.data.url);
  if (!normalized) {
    return json(res, 400, {
      error: 'This URL is not valid. Use a valid http(s) address.',
    });
  }

  const d = parsed.data;
  const inserted = await query(
    `INSERT INTO projects
       (title, url, description, author_name, author_bio, contact_email, image_url, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'published')
     RETURNING *`,
    [d.title, normalized, d.description, d.author_name, d.author_bio, d.contact_email, d.image_url]
  );

  json(res, 201, {
    project: toPublicProject({
      ...inserted.rows[0],
      average_rating: 0,
      rating_count: 0,
    }),
    message: 'Your project has been published!',
  });
}

async function handler(req, res) {
  if (req.method === 'GET') return listProjects(req, res);
  if (req.method === 'POST') return createProject(req, res);
  return methodNotAllowed(res, ['GET', 'POST']);
}

export default withErrorHandling(handler);

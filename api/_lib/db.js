/**
 * Database access. Uses @vercel/postgres, which is designed for serverless:
 * every call goes through Neon's pooled connection — no persistent client,
 * no in-memory state, safe across cold starts and concurrent instances.
 *
 * Queries are built as parameterized text ($1, $2, …) via the `query()`
 * helper. Dynamic identifiers (ORDER BY, search filters) come from strict
 * whitelists — never from raw user input.
 */
import { createPool } from '@vercel/postgres';

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (!connectionString) {
  // Fails fast and loudly in logs; clients still get a clean 500 via
  // withErrorHandling.
  console.error(
    '[api] Missing POSTGRES_URL / DATABASE_URL. Provision Neon Postgres and set the variable.'
  );
}

const pool = connectionString ? createPool({ connectionString }) : null;

/** Run a parameterized query. Values are never interpolated into the text. */
export async function query(text, params = []) {
  if (!pool) {
    const err = new Error('Database is not configured.');
    err.status = 500;
    throw err;
  }
  return pool.query(text, params);
}

/**
 * Convenience tagged template: sql`SELECT * FROM projects WHERE id = ${id}`
 * compiles to parameterized text. For fully dynamic queries, prefer building
 * the text manually and calling query().
 */
export function sql(strings, ...values) {
  let text = '';
  const params = [];
  strings.forEach((part, i) => {
    text += part;
    if (i < values.length) {
      params.push(values[i]);
      text += `$${params.length}`;
    }
  });
  return query(text, params);
}

/** Shape a project row (with rating aggregates) for public API responses. */
export function toPublicProject(row) {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    authorName: row.author_name,
    authorBio: row.author_bio ?? null,
    // NOTE: contact_email is intentionally never exposed publicly.
    imageUrl: row.image_url ?? null,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    averageRating: row.average_rating != null ? Number(row.average_rating) : 0,
    ratingCount: row.rating_count != null ? Number(row.rating_count) : 0,
  };
}

/** Base SELECT fragment joining computed rating aggregates (never stored). */
export const PROJECTS_WITH_RATINGS = `
  SELECT
    p.*,
    COALESCE(AVG(r.rating), 0)::float AS average_rating,
    COUNT(r.id)::int AS rating_count
  FROM projects p
  LEFT JOIN ratings r ON r.project_id = p.id
`;

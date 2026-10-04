/**
 * GET /api/health — deployment sanity check (no secrets exposed).
 */
import { query } from './_lib/db.js';
import { json, methodNotAllowed, withErrorHandling } from './_lib/http.js';

async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  let db = false;
  try {
    await query('SELECT 1');
    db = true;
  } catch {
    db = false;
  }

  json(res, db ? 200 : 503, {
    ok: db,
    db,
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    time: new Date().toISOString(),
  });
}

export default withErrorHandling(handler);

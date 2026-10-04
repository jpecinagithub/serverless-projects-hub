/**
 * PATCH  /api/admin/projects/:id   { status: 'published'|'hidden'|'pending'|'blocked' }
 * DELETE /api/admin/projects/:id — removes ratings (cascade), the project row,
 *                                   and best-effort its Blob image.
 * Admin only.
 */
import { del } from '@vercel/blob';
import { query } from '../../_lib/db.js';
import { json, methodNotAllowed, readJson, withErrorHandling } from '../../_lib/http.js';
import { requireAdmin } from '../../_lib/auth.js';
import { statusSchema, firstIssueMessage, isUuid } from '../../_lib/validation.js';

async function updateStatus(req, res, id) {
  const body = await readJson(req);
  const parsed = statusSchema.safeParse(body?.status);
  if (!parsed.success) {
    return json(res, 400, { error: firstIssueMessage(parsed.error) });
  }

  const result = await query(
    `UPDATE projects SET status = $1 WHERE id = $2 RETURNING id, status`,
    [parsed.data, id]
  );
  if (result.rows.length === 0) {
    return json(res, 404, { error: 'Project not found.' });
  }
  json(res, 200, { id: result.rows[0].id, status: result.rows[0].status });
}

async function deleteProject(req, res, id) {
  const existing = await query(`SELECT id, image_url FROM projects WHERE id = $1`, [id]);
  if (existing.rows.length === 0) {
    return json(res, 404, { error: 'Project not found.' });
  }

  // Ratings are removed by ON DELETE CASCADE — no orphans.
  await query(`DELETE FROM projects WHERE id = $1`, [id]);

  // Best-effort Blob cleanup so we don't leave orphaned images.
  const imageUrl = existing.rows[0].image_url;
  if (imageUrl && imageUrl.includes('blob.vercel-storage.com')) {
    try {
      await del(imageUrl);
    } catch (err) {
      console.error('[api/admin] Blob delete failed (non-fatal):', err?.message);
    }
  }

  json(res, 200, { ok: true, id });
}

async function handler(req, res) {
  if (!requireAdmin(req, res, json)) return;

  const id = req.query?.id;
  if (!isUuid(id)) {
    return json(res, 404, { error: 'Project not found.' });
  }

  if (req.method === 'PATCH') return updateStatus(req, res, id);
  if (req.method === 'DELETE') return deleteProject(req, res, id);
  return methodNotAllowed(res, ['PATCH', 'DELETE']);
}

export default withErrorHandling(handler);

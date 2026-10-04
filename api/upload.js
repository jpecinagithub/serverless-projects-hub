/**
 * POST /api/upload — multipart form with a single `image` file field.
 *
 * Pipeline: size check (≤ 2 MB) → magic-byte type sniffing (never trust the
 * extension) → sharp resize to fit inside 800×500 → WebP (quality 78) →
 * Vercel Blob at projects/{uuid}.webp → returns the public URL.
 *
 * Only the resulting URL is stored in Postgres; raw bytes never touch the DB.
 */
import formidable from 'formidable';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { put } from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { json, methodNotAllowed, withErrorHandling } from './_lib/http.js';
import { rateLimit, clientIp } from './_lib/ratelimit.js';

const MAX_BYTES = 2 * 1024 * 1024; // 2 MB
const MAX_WIDTH = 800;
const MAX_HEIGHT = 500;
const WEBP_QUALITY = 78;

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const ALLOWED_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp']);

function extOf(filename) {
  const m = /\.([a-z0-9]+)$/i.exec(String(filename || ''));
  return m ? `.${m[1].toLowerCase()}` : '';
}

async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  const rl = rateLimit(`upload:${clientIp(req)}`, { limit: 10, windowMs: 60_000 });
  if (!rl.allowed) {
    return json(res, 429, {
      error: 'Too many uploads. Please wait a minute and try again.',
    });
  }

  const form = formidable({
    maxFileSize: MAX_BYTES,
    maxFiles: 1,
    maxFields: 0,
    keepExtensions: false,
  });

  let files;
  try {
    [, files] = await form.parse(req);
  } catch (err) {
    const tooBig =
      err?.httpCode === 413 ||
      err?.code === 'LIMIT_FILE_SIZE' ||
      /exceeded|maxFileSize/i.test(String(err?.message || ''));
    if (tooBig) {
      return json(res, 413, { error: 'The image must be smaller than 2 MB.' });
    }
    return json(res, 400, {
      error: 'We could not read the uploaded image. Please try again.',
    });
  }

  const uploaded = Array.isArray(files.image) ? files.image[0] : files.image;
  if (!uploaded || !uploaded.filepath) {
    return json(res, 400, { error: 'No image was uploaded.' });
  }

  const declaredMime = String(uploaded.mimetype || '').toLowerCase();
  const extension = extOf(uploaded.originalFilename);

  // Never trust the extension alone: sniff the actual magic bytes.
  let detected = null;
  try {
    const { readFile } = await import('node:fs/promises');
    const head = (await readFile(uploaded.filepath)).subarray(0, 4100);
    detected = await fileTypeFromBuffer(head);
  } catch {
    detected = null;
  }

  const realMime = detected?.mime || null;
  if (
    !realMime ||
    !ALLOWED_MIME.has(realMime) ||
    !ALLOWED_EXT.has(extension) ||
    !ALLOWED_MIME.has(declaredMime)
  ) {
    return json(res, 400, {
      error: 'Only JPG, PNG and WebP images are allowed.',
    });
  }

  // Resize to fit inside 800×500 (never upscale), convert to WebP.
  let optimized;
  let meta;
  try {
    const pipeline = sharp(uploaded.filepath, { failOnError: true }).rotate();
    meta = await pipeline.metadata();
    optimized = await pipeline
      .resize({
        width: MAX_WIDTH,
        height: MAX_HEIGHT,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: WEBP_QUALITY })
      .toBuffer();
  } catch {
    return json(res, 400, {
      error: 'This file is not a valid image. Please try another one.',
    });
  }

  // Random storage name — never preserve user-supplied filenames.
  const key = `projects/${randomUUID()}.webp`;
  let blob;
  try {
    blob = await put(key, optimized, {
      access: 'public',
      contentType: 'image/webp',
    });
  } catch (err) {
    console.error('[api/upload] Blob put failed:', err?.message);
    return json(res, 500, {
      error: "We couldn't upload your image. Please try again.",
    });
  }

  const finalMeta = await sharp(optimized).metadata().catch(() => ({}));
  json(res, 201, {
    url: blob.url,
    width: finalMeta.width ?? null,
    height: finalMeta.height ?? null,
    bytes: optimized.length,
    originalBytes: uploaded.size,
    originalDimensions:
      meta?.width && meta?.height ? { width: meta.width, height: meta.height } : null,
  });
}

export default withErrorHandling(handler);

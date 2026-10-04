/**
 * Lightweight admin authentication.
 *
 * The admin area is protected by a server-side secret (ADMIN_SECRET).
 * On successful login the API sets an httpOnly HMAC cookie; every admin
 * endpoint re-verifies it. No user accounts, no sessions stored anywhere —
 * verification is stateless and therefore serverless-safe.
 */
import crypto from 'node:crypto';

const COOKIE_NAME = 'sh_admin';
const TOKEN_LABEL = 'serverless-hub-admin';
const GHOST_LABEL = 'serverless-hub-ghost-link';

function getSecret() {
  return process.env.ADMIN_SECRET || '';
}

export function adminConfigured() {
  return getSecret().length >= 16;
}

function expectedToken() {
  return crypto
    .createHmac('sha256', getSecret())
    .update(TOKEN_LABEL)
    .digest('hex');
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const name = part.slice(0, idx).trim();
    const value = decodeURIComponent(part.slice(idx + 1).trim());
    if (name) out[name] = value;
  }
  return out;
}

export function verifyAdminSecret(candidate) {
  if (!adminConfigured()) return false;
  const a = Buffer.from(String(candidate ?? ''));
  const b = Buffer.from(getSecret());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/**
 * Ghost-link token: a capability URL for the site owner. Derived from
 * ADMIN_SECRET with its own label, so it is unguessable without the secret
 * and rotates automatically when the secret changes. The link is never
 * rendered anywhere in the UI — only shown inside the admin dashboard.
 */
export function ghostToken() {
  if (!adminConfigured()) return '';
  return crypto
    .createHmac('sha256', getSecret())
    .update(GHOST_LABEL)
    .digest('hex')
    .slice(0, 32);
}

export function verifyGhostToken(candidate) {
  const expected = ghostToken();
  if (!expected) return false;
  const a = Buffer.from(String(candidate ?? ''));
  const b = Buffer.from(expected);
  if (a.length === 0 || a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function isAdmin(req) {
  if (!adminConfigured()) return false;
  const cookies = parseCookies(req.headers?.cookie);
  const token = cookies[COOKIE_NAME];
  if (!token) return false;
  const a = Buffer.from(token);
  const b = Buffer.from(expectedToken());
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function cookieHeader(value, maxAge) {
  const secure = process.env.VERCEL === '1' ? '; Secure' : '';
  return (
    `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; SameSite=Lax${secure}` +
    (typeof maxAge === 'number' ? `; Max-Age=${maxAge}` : '')
  );
}

export function setAdminCookie(res) {
  res.setHeader('Set-Cookie', cookieHeader(expectedToken(), 7 * 24 * 60 * 60));
}

export function clearAdminCookie(res) {
  res.setHeader('Set-Cookie', cookieHeader('', 0));
}

/** Guard for admin handlers — sends 401/503 when unauthorized. */
export function requireAdmin(req, res, json) {
  if (!adminConfigured()) {
    json(res, 503, {
      error: 'Admin access is not configured. Set the ADMIN_SECRET environment variable.',
    });
    return false;
  }
  if (!isAdmin(req)) {
    json(res, 401, { error: 'Unauthorized. Please sign in as admin.' });
    return false;
  }
  return true;
}

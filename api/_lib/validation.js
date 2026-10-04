/**
 * Server-side validation. The frontend validates too, but the API never
 * trusts it — every field is re-validated here with Zod.
 */
import { z } from 'zod';

const BLOCKED_PROTOCOLS = new Set(['javascript:', 'data:', 'file:', 'ftp:']);

/**
 * Normalize a user-supplied project URL.
 * - Trims whitespace; prepends https:// when no scheme is present.
 * - Allows ONLY http: and https: (blocks javascript:, data:, file:, ftp:, …).
 * - Strips embedded credentials.
 * Returns the normalized URL string, or null when invalid.
 */
export function normalizeUrl(input) {
  let raw = String(input ?? '').trim();
  if (!raw || raw.length > 2048) return null;

  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(raw)) {
    raw = `https://${raw}`;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    return null;
  }

  const protocol = parsed.protocol.toLowerCase();
  if (protocol !== 'http:' && protocol !== 'https:') return null;
  if (BLOCKED_PROTOCOLS.has(protocol)) return null;
  if (!parsed.hostname || parsed.hostname === 'localhost') {
    // Reject empty hosts; keep localhost out of the public directory.
    if (!parsed.hostname) return null;
  }

  // Never store credentials inside the URL.
  parsed.username = '';
  parsed.password = '';
  return parsed.toString();
}

const emptyToNull = (v) => {
  const s = String(v ?? '').trim();
  return s === '' ? null : s;
};

export const projectSchema = z.object({
  title: z
    .string({ error: 'Project title is required.' })
    .trim()
    .min(1, 'Project title is required.')
    .max(100, 'Project title must be 100 characters or fewer.'),
  url: z
    .string({ error: 'Project URL is required.' })
    .trim()
    .min(1, 'Project URL is required.')
    .max(2048, 'Project URL is too long.'),
  description: z
    .string({ error: 'Description is required.' })
    .trim()
    .min(1, 'Description is required.')
    .max(500, 'Description must be 500 characters or fewer.'),
  author_name: z
    .string({ error: 'Author name is required.' })
    .trim()
    .min(1, 'Author name or nickname is required.')
    .max(80, 'Author name must be 80 characters or fewer.'),
  author_bio: z
    .string()
    .trim()
    .max(500, 'About the author must be 500 characters or fewer.')
    .optional()
    .nullable()
    .transform(emptyToNull),
  contact_email: z
    .string()
    .trim()
    .max(255, 'Email is too long.')
    .optional()
    .nullable()
    .transform((v) => {
      const s = String(v ?? '').trim();
      if (s === '') return null;
      return s;
    })
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v), {
      message: 'Contact email is not valid.',
    }),
  image_url: z
    .string()
    .trim()
    .max(2048)
    .optional()
    .nullable()
    .transform(emptyToNull)
    .refine(
      (v) => {
        if (v === null) return true;
        try {
          const u = new URL(v);
          return u.protocol === 'http:' || u.protocol === 'https:';
        } catch {
          return false;
        }
      },
      { message: 'Image URL is not valid.' }
    ),
});

export const ratingSchema = z.object({
  visitorId: z
    .string({ error: 'Visitor identifier is required.' })
    .trim()
    .min(8, 'Visitor identifier is invalid.')
    .max(100, 'Visitor identifier is invalid.')
    .regex(/^[A-Za-z0-9_-]+$/, 'Visitor identifier is invalid.'),
  rating: z
    .number({ error: 'Rating is required.' })
    .int('Rating must be a whole number.')
    .min(1, 'Rating must be at least 1 star.')
    .max(5, 'Rating cannot exceed 5 stars.'),
});

export const statusSchema = z.enum(['published', 'hidden', 'pending', 'blocked']);

/** Convert a ZodError into a single friendly message. */
export function firstIssueMessage(error) {
  const issue = error.issues?.[0];
  return issue?.message || 'Some fields are invalid. Please check the form.';
}

export function isUuid(value) {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

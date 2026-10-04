/**
 * Anonymous visitor identifier for rating abuse protection.
 * Random, stored in localStorage, sent with every rating so the backend can
 * enforce UNIQUE(project_id, visitor_id). No personal data involved.
 */
const KEY = 'sh_visitor_id';

export function getVisitorId() {
  try {
    let id = window.localStorage.getItem(KEY);
    if (!id || !/^[A-Za-z0-9_-]{8,100}$/.test(id)) {
      id =
        (window.crypto?.randomUUID?.() || `v-${Date.now()}-${Math.random().toString(36).slice(2)}`)
          .replace(/[^A-Za-z0-9_-]/g, '')
          .slice(0, 36) || `v${Date.now()}`;
      window.localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    // localStorage unavailable (private mode, etc.) — fall back to a
    // session-only id. The backend still dedupes per id.
    return `session-${Math.random().toString(36).slice(2)}`;
  }
}

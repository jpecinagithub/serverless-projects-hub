/**
 * API client. In production (Vercel) every call hits the serverless functions
 * under /api. In local dev without VITE_USE_REAL_API=1, calls are served by
 * the in-memory mock so `npm run dev` works with zero infrastructure.
 */
import { mockApi } from './mockApi.js';

export const USE_MOCK =
  import.meta.env.DEV && import.meta.env.VITE_USE_REAL_API !== '1';

async function request(path, { method = 'GET', body, formData } = {}) {
  const res = await fetch(path, {
    method,
    headers: formData ? undefined : { 'Content-Type': 'application/json' },
    body: formData || (body !== undefined ? JSON.stringify(body) : undefined),
    credentials: 'same-origin',
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  if (!res.ok) {
    const err = new Error(
      (data && data.error) || `Request failed (${res.status}). Please try again.`
    );
    err.status = res.status;
    throw err;
  }
  return data;
}

function qs(params) {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export const api = USE_MOCK
  ? mockApi
  : {
      listProjects: ({ page = 1, limit = 12, sort = 'newest', search = '', minRatings = 0 } = {}) =>
        request(`/api/projects${qs({ page, limit, sort, search, min_ratings: minRatings || undefined })}`),

      getProject: (id) => request(`/api/projects/${encodeURIComponent(id)}`),

      createProject: (data) =>
        request('/api/projects', { method: 'POST', body: data }),

      rateProject: (id, { visitorId, rating }) =>
        request(`/api/projects/${encodeURIComponent(id)}/rating`, {
          method: 'POST',
          body: { visitorId, rating },
        }),

      uploadImage: async (file) => {
        const fd = new FormData();
        fd.append('image', file);
        return request('/api/upload', { method: 'POST', formData: fd });
      },

      adminLogin: (secret) =>
        request('/api/admin/login', { method: 'POST', body: { secret } }),

      adminLogout: () => request('/api/admin/logout', { method: 'POST' }),

      adminStats: () => request('/api/admin/stats'),

      adminListProjects: () => request('/api/admin/projects'),

      adminUpdateStatus: (id, status) =>
        request(`/api/admin/projects/${encodeURIComponent(id)}`, {
          method: 'PATCH',
          body: { status },
        }),

      adminDeleteProject: (id) =>
        request(`/api/admin/projects/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    };

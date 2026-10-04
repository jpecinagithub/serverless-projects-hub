/**
 * DEV-ONLY mock API.
 *
 * Used when running `npm run dev` without VITE_USE_REAL_API=1, so the whole
 * product flow (submit → list → detail → rate → persist) is testable with
 * zero infrastructure. Data persists in localStorage across reloads.
 *
 * This module is never used in production builds served by Vercel — api.js
 * only imports it when import.meta.env.DEV is true.
 */

const LS_PROJECTS = 'sh_mock_projects_v1';
const LS_RATINGS = 'sh_mock_ratings_v1';

const SEED = [
  {
    title: 'InvoiceAI',
    url: 'https://invoiceai-demo.vercel.app',
    description:
      'AI-powered invoice analyzer running on a serverless architecture. Drop a PDF invoice and get structured line items, totals and tax breakdowns in seconds.',
    authorName: 'Jon',
    authorBio: 'Finance professional experimenting with AI and serverless applications.',
    avg: 4.6, votes: 28,
  },
  {
    title: 'Serverless PDF Writer',
    url: 'https://pdf-writer-demo.vercel.app',
    description:
      'A lightweight PDF editing tool running entirely on serverless functions. Merge, split, compress and annotate PDFs without installing anything.',
    authorName: 'Mara K.',
    authorBio: 'Frontend developer obsessed with document tooling.',
    avg: 4.3, votes: 22,
  },
  {
    title: 'CutLab — Browser Video Editor',
    url: 'https://cutlab-demo.vercel.app',
    description:
      'Trim, caption and export short videos directly in the browser. Renders run on ephemeral serverless workers; nothing is ever uploaded permanently.',
    authorName: 'Devon',
    authorBio: null,
    avg: 4.8, votes: 16,
  },
  {
    title: 'LedgerLens Finance Dashboard',
    url: 'https://ledgerlens-demo.vercel.app',
    description:
      'Personal finance dashboard with bank-grade charts, budget alerts and a monthly close checklist — all computed on demand by serverless APIs.',
    authorName: 'Priya S.',
    authorBio: 'Ex-accountant turned indie hacker.',
    avg: 3.9, votes: 12,
  },
  {
    title: 'Axiom AI Learning Portal',
    url: 'https://axiom-learn-demo.vercel.app',
    description:
      'Bite-size AI lessons with interactive quizzes and a progress map. Static frontend, serverless quiz engine, zero servers to maintain.',
    authorName: 'Tomás R.',
    authorBio: 'Teacher building free AI literacy resources.',
    avg: 4.5, votes: 9,
  },
  {
    title: 'JobRadar Aggregator',
    url: 'https://jobradar-demo.vercel.app',
    description:
      'Meta job-search indexer that polls public career boards and ranks matches with an explainable score. Scheduled entirely with serverless cron.',
    authorName: 'Aisha B.',
    authorBio: null,
    avg: 4.1, votes: 7,
  },
  {
    title: 'Nimbus Weather Dashboard',
    url: 'https://nimbus-weather-demo.vercel.app',
    description:
      'Hyper-local weather with radar maps and 7-day probabilistic forecasts, cached at the edge and refreshed by serverless scheduled jobs.',
    authorName: 'Jon',
    authorBio: 'Finance professional experimenting with AI and serverless applications.',
    avg: 4.7, votes: 5,
  },
  {
    title: 'FolioForge Portfolio Generator',
    url: 'https://folioforge-demo.vercel.app',
    description:
      'Answer six questions and get a polished developer portfolio site generated for you — deployed to the edge in under a minute.',
    authorName: 'Lena W.',
    authorBio: 'Design engineer who loves boring technology.',
    avg: 3.6, votes: 3,
  },
];

function uid() {
  return `mock-${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
}

function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

function seedIfEmpty() {
  let projects = load(LS_PROJECTS, null);
  let ratings = load(LS_RATINGS, null);
  if (!projects || !ratings) {
    projects = [];
    ratings = [];
    const now = Date.now();
    SEED.forEach((s, i) => {
      const id = uid() + i;
      projects.push({
        id,
        title: s.title,
        url: s.url,
        description: s.description,
        authorName: s.authorName,
        authorBio: s.authorBio,
        imageUrl: null,
        status: 'published',
        createdAt: new Date(now - (SEED.length - i) * 86400000 * 2).toISOString(),
        updatedAt: new Date(now - (SEED.length - i) * 86400000 * 2).toISOString(),
      });
      // Spread votes around the target average deterministically.
      for (let v = 0; v < s.votes; v++) {
        const jitter = (((v * 37 + i * 11) % 5) - 2) * 0.5;
        const rating = Math.min(5, Math.max(1, Math.round(s.avg + jitter)));
        ratings.push({
          id: uid() + v,
          project_id: id,
          visitor_id: `seed-visitor-${(i * 7 + v) % 40}`,
          rating,
        });
      }
    });
    save(LS_PROJECTS, projects);
    save(LS_RATINGS, ratings);
  }
  return { projects, ratings };
}

function withAggregates(project, ratings) {
  const mine = ratings.filter((r) => r.project_id === project.id);
  const count = mine.length;
  const avg = count ? mine.reduce((a, r) => a + r.rating, 0) / count : 0;
  return { ...project, averageRating: avg, ratingCount: count };
}

const delay = (ms = 180) => new Promise((r) => setTimeout(r, ms));

export const mockApi = {
  async listProjects({ page = 1, limit = 12, sort = 'newest', search = '', minRatings = 0 } = {}) {
    await delay();
    const { projects, ratings } = seedIfEmpty();
    let list = projects
      .filter((p) => p.status === 'published')
      .map((p) => withAggregates(p, ratings));

    const q = String(search || '').trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        `${p.title} ${p.description} ${p.authorName}`.toLowerCase().includes(q)
      );
    }
    if (minRatings > 0) list = list.filter((p) => p.ratingCount >= minRatings);

    const by = {
      newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      rating: (a, b) => b.averageRating - a.averageRating || b.ratingCount - a.ratingCount,
      popular: (a, b) => b.ratingCount - a.ratingCount || b.averageRating - a.averageRating,
    }[sort] || ((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    list.sort(by);

    const total = list.length;
    const start = (page - 1) * limit;
    return {
      projects: list.slice(start, start + limit),
      pagination: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  },

  async getProject(id) {
    await delay();
    const { projects, ratings } = seedIfEmpty();
    const p = projects.find((x) => x.id === id && x.status === 'published');
    if (!p) {
      const err = new Error('Project not found.');
      err.status = 404;
      throw err;
    }
    return { project: withAggregates(p, ratings) };
  },

  async createProject(data) {
    await delay(350);
    const { projects, ratings } = seedIfEmpty();
    const now = new Date().toISOString();
    const project = {
      id: uid(),
      title: data.title,
      url: data.url,
      description: data.description,
      authorName: data.author_name,
      authorBio: data.author_bio || null,
      imageUrl: data.image_url || null,
      status: 'published',
      createdAt: now,
      updatedAt: now,
    };
    projects.unshift(project);
    save(LS_PROJECTS, projects);
    return {
      project: withAggregates(project, ratings),
      message: 'Your project has been published!',
    };
  },

  async rateProject(id, { visitorId, rating }) {
    await delay();
    const { projects, ratings } = seedIfEmpty();
    const p = projects.find((x) => x.id === id && x.status === 'published');
    if (!p) {
      const err = new Error('Project not found.');
      err.status = 404;
      throw err;
    }
    const existing = ratings.find((r) => r.project_id === id && r.visitor_id === visitorId);
    if (existing) existing.rating = rating;
    else ratings.push({ id: uid(), project_id: id, visitor_id: visitorId, rating });
    save(LS_RATINGS, ratings);
    const agg = withAggregates(p, ratings);
    return {
      message: 'Thank you for your rating!',
      yourRating: rating,
      averageRating: agg.averageRating,
      ratingCount: agg.ratingCount,
    };
  },

  async uploadImage(/* file */) {
    await delay(600);
    // Dev mock: no real storage — the form still previews the chosen file
    // locally, and the project falls back to the default placeholder.
    return {
      url: '/default-project.svg',
      width: 800,
      height: 500,
      bytes: 42000,
      originalBytes: 0,
      originalDimensions: null,
    };
  },

  // --- Admin (mock: a fixed demo secret) -------------------------------------
  async adminLogin(secret) {
    await delay();
    if (secret !== 'demo-secret') {
      const err = new Error('Incorrect admin secret.');
      err.status = 401;
      throw err;
    }
    window.localStorage.setItem('sh_mock_admin', '1');
    return { ok: true };
  },

  async adminLogout() {
    window.localStorage.removeItem('sh_mock_admin');
    return { ok: true };
  },

  adminAuthed() {
    return window.localStorage.getItem('sh_mock_admin') === '1';
  },

  async adminStats() {
    await delay();
    if (!this.adminAuthed()) throw Object.assign(new Error('Unauthorized.'), { status: 401 });
    const { projects, ratings } = seedIfEmpty();
    const week = Date.now() - 7 * 86400000;
    return {
      totalProjects: projects.length,
      totalRatings: ratings.length,
      averageRating: ratings.length
        ? ratings.reduce((a, r) => a + r.rating, 0) / ratings.length
        : 0,
      newThisWeek: projects.filter((p) => new Date(p.createdAt).getTime() >= week).length,
    };
  },

  async adminListProjects() {
    await delay();
    if (!this.adminAuthed()) throw Object.assign(new Error('Unauthorized.'), { status: 401 });
    const { projects, ratings } = seedIfEmpty();
    return {
      projects: [...projects]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map((p) => withAggregates(p, ratings)),
    };
  },

  async adminUpdateStatus(id, status) {
    await delay();
    if (!this.adminAuthed()) throw Object.assign(new Error('Unauthorized.'), { status: 401 });
    const { projects } = seedIfEmpty();
    const p = projects.find((x) => x.id === id);
    if (!p) throw Object.assign(new Error('Project not found.'), { status: 404 });
    p.status = status;
    save(LS_PROJECTS, projects);
    return { id, status };
  },

  async adminDeleteProject(id) {
    await delay();
    if (!this.adminAuthed()) throw Object.assign(new Error('Unauthorized.'), { status: 401 });
    let { projects, ratings } = seedIfEmpty();
    projects = projects.filter((x) => x.id !== id);
    ratings = ratings.filter((r) => r.project_id !== id);
    save(LS_PROJECTS, projects);
    save(LS_RATINGS, ratings);
    return { ok: true, id };
  },
};

export function resetMockData() {
  window.localStorage.removeItem(LS_PROJECTS);
  window.localStorage.removeItem(LS_RATINGS);
}

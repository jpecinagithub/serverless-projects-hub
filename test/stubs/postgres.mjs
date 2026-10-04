/**
 * Stub for @vercel/postgres.
 * Records every query (text + params) and returns canned rows so handler
 * logic — validation, SQL construction, upserts, response shaping — can be
 * tested without a database.
 */
export const calls = [];

function cannedRow(params, overrides = {}) {
  return {
    id: '11111111-2222-3333-4444-555555555555',
    title: params[0],
    url: params[1],
    description: params[2],
    author_name: params[3],
    author_bio: params[4],
    contact_email: params[5],
    image_url: params[6],
    status: 'published',
    created_at: '2026-10-04T10:00:00.000Z',
    updated_at: '2026-10-04T10:00:00.000Z',
    average_rating: 4.5,
    rating_count: 12,
    ...overrides,
  };
}

async function fakeQuery(text, params = []) {
  calls.push({ text: text.replace(/\s+/g, ' ').trim(), params: [...params] });
  const t = text;

  if (t.includes('INSERT INTO projects')) {
    return { rows: [cannedRow(params, { average_rating: undefined, rating_count: undefined })], rowCount: 1 };
  }
  if (t.includes('INSERT INTO ratings')) {
    return { rows: [], rowCount: 1 };
  }
  if (t.includes('SELECT 1')) {
    return { rows: [{ '?column?': 1 }], rowCount: 1 };
  }
  if (t.includes('COUNT(*)::int AS total')) {
    return { rows: [{ total: 3 }], rowCount: 1 };
  }
  if (t.includes('COALESCE(AVG(rating), 0)::float AS avg')) {
    return { rows: [{ avg: 4.25 }], rowCount: 1 };
  }
  if (t.includes("created_at >= NOW() - INTERVAL '7 days'")) {
    return { rows: [{ c: 2 }], rowCount: 1 };
  }
  if (t.includes('SELECT COUNT(*)::int AS c FROM projects')) {
    return { rows: [{ c: 5 }], rowCount: 1 };
  }
  if (t.includes('SELECT COUNT(*)::int AS c FROM ratings')) {
    return { rows: [{ c: 42 }], rowCount: 1 };
  }
  if (t.includes('SELECT id FROM projects WHERE id =')) {
    return { rows: [{ id: params[0] }], rowCount: 1 };
  }
  if (t.includes('SELECT id, image_url FROM projects WHERE id =')) {
    return {
      rows: [{ id: params[0], image_url: 'https://abc123.public.blob.vercel-storage.com/projects/x.webp' }],
      rowCount: 1,
    };
  }
  if (t.includes('UPDATE projects SET status =')) {
    return { rows: [{ id: params[1], status: params[0] }], rowCount: 1 };
  }
  if (t.includes('DELETE FROM projects WHERE id =')) {
    return { rows: [], rowCount: 1 };
  }
  if (t.includes('FROM projects p') || t.includes('FROM projects\n')) {
    // List / detail queries with rating aggregates.
    if (t.includes('WHERE p.id = $1')) {
      return { rows: [cannedRow([])], rowCount: 1 };
    }
    return { rows: [cannedRow([]), cannedRow([])], rowCount: 2 };
  }
  throw new Error(`stub: unhandled query: ${t.slice(0, 120)}`);
}

export function createPool() {
  return { query: fakeQuery };
}

export function resetCalls() {
  calls.length = 0;
}

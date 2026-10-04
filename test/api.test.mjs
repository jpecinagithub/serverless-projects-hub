/**
 * API integration tests — handlers run for real, @vercel/postgres and
 * @vercel/blob are stubbed via the module loader (see test/hooks.mjs).
 *
 * Run: npm run test:api
 */
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.ADMIN_SECRET = 'test-admin-secret-12345';

const { default: createHandler } = await import('../api/projects/index.js');
const { default: detailHandler } = await import('../api/projects/[id].js');
const { default: ratingHandler } = await import('../api/projects/[id]/rating.js');
const { default: uploadHandler } = await import('../api/upload.js');
const { default: loginHandler } = await import('../api/admin/login.js');
const { default: statsHandler } = await import('../api/admin/stats.js');
const { default: adminListHandler } = await import('../api/admin/projects/index.js');
const { default: adminItemHandler } = await import('../api/admin/projects/[id].js');
const { default: healthHandler } = await import('../api/health.js');
const pgStub = await import('./stubs/postgres.mjs');
const blobStub = await import('./stubs/blob.mjs');
const sharp = (await import('sharp')).default;

import { Readable } from 'node:stream';
import crypto from 'node:crypto';

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const results = [];
function test(name, fn) {
  return Promise.resolve()
    .then(fn)
    .then(() => results.push({ name, ok: true }))
    .catch((err) => results.push({ name, ok: false, error: err.message }));
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg || 'assertion failed');
}

function makeReq({ method = 'GET', query = {}, headers = {}, body = null }) {
  const buf =
    body == null ? Buffer.alloc(0) : Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  const req = Readable.from(buf.length ? [buf] : []);
  req.method = method;
  req.query = query;
  const lower = Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v])
  );
  // Real clients always send a length with uploads; formidable needs it.
  if (buf.length && !lower['content-length']) lower['content-length'] = String(buf.length);
  req.headers = lower;
  req.socket = { remoteAddress: '127.0.0.1' };
  return req;
}

function makeRes() {
  return {
    statusCode: 200,
    headers: {},
    body: '',
    finished: false,
    setHeader(k, v) {
      this.headers[k.toLowerCase()] = v;
    },
    end(b) {
      this.body = String(b ?? '');
      this.finished = true;
    },
  };
}

const body = (res) => JSON.parse(res.body);

function multipart(boundary, parts) {
  const chunks = [];
  for (const p of parts) {
    chunks.push(Buffer.from(`--${boundary}\r\n`));
    chunks.push(
      Buffer.from(
        `Content-Disposition: form-data; name="${p.name}"; filename="${p.filename}"\r\n` +
          `Content-Type: ${p.contentType}\r\n\r\n`
      )
    );
    chunks.push(p.data);
    chunks.push(Buffer.from('\r\n'));
  }
  chunks.push(Buffer.from(`--${boundary}--\r\n`));
  return Buffer.concat(chunks);
}

const VALID_ID = '11111111-2222-3333-4444-555555555555';

function adminCookie() {
  const token = crypto
    .createHmac('sha256', process.env.ADMIN_SECRET)
    .update('serverless-hub-admin')
    .digest('hex');
  return `sh_admin=${token}`;
}

// ---------------------------------------------------------------------------
// projects: create
// ---------------------------------------------------------------------------
await test('POST /api/projects — creates with normalized URL', async () => {
  pgStub.resetCalls();
  const req = makeReq({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'InvoiceAI',
      url: 'invoiceai-demo.vercel.app',
      description: 'AI invoice analyzer.',
      author_name: 'Jon',
      author_bio: '',
      contact_email: '',
      image_url: null,
    }),
  });
  const res = makeRes();
  await createHandler(req, res);
  assert(res.statusCode === 201, `expected 201, got ${res.statusCode}: ${res.body}`);
  const data = body(res);
  assert(data.project.title === 'InvoiceAI', 'title mismatch');
  assert(data.project.url === 'https://invoiceai-demo.vercel.app/', `url not normalized: ${data.project.url}`);
  assert(data.project.averageRating === 0 && data.project.ratingCount === 0, 'fresh aggregates');
  assert(!('contact_email' in data.project) && !('contactEmail' in data.project), 'email leaked');
  const insert = pgStub.calls.find((c) => c.text.includes('INSERT INTO projects'));
  assert(insert, 'no INSERT recorded');
  assert(!insert.text.includes('invoiceai'), 'raw value interpolated into SQL!');
});

await test('POST /api/projects — rejects javascript: URL', async () => {
  const req = makeReq({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'Evil', url: 'javascript:alert(1)', description: 'x', author_name: 'x',
    }),
  });
  const res = makeRes();
  await createHandler(req, res);
  assert(res.statusCode === 400, `expected 400, got ${res.statusCode}`);
  assert(/not valid/i.test(body(res).error), 'wrong message');
});

await test('POST /api/projects — rejects missing title', async () => {
  const req = makeReq({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com', description: 'x', author_name: 'x' }),
  });
  const res = makeRes();
  await createHandler(req, res);
  assert(res.statusCode === 400, `expected 400, got ${res.statusCode}`);
  assert(/title/i.test(body(res).error), `message: ${res.body}`);
});

await test('POST /api/projects — rejects invalid email only when supplied', async () => {
  const req = makeReq({
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'T', url: 'https://example.com', description: 'x',
      author_name: 'x', contact_email: 'not-an-email',
    }),
  });
  const res = makeRes();
  await createHandler(req, res);
  assert(res.statusCode === 400, `expected 400, got ${res.statusCode}`);
});

// ---------------------------------------------------------------------------
// projects: list
// ---------------------------------------------------------------------------
await test('GET /api/projects — defaults to newest sort', async () => {
  pgStub.resetCalls();
  const res = makeRes();
  await createHandler(makeReq({ method: 'GET', query: {} }), res);
  assert(res.statusCode === 200, `got ${res.statusCode}`);
  const data = body(res);
  assert(Array.isArray(data.projects), 'projects not array');
  assert(data.pagination.totalPages >= 1, 'pagination missing');
  const q = pgStub.calls.find((c) => c.text.includes('FROM projects p'));
  assert(q.text.includes('ORDER BY p.created_at DESC'), 'not newest sort');
  assert(q.text.includes("p.status = 'published'"), 'status filter missing');
});

await test('GET /api/projects — sort=rating uses aggregate order', async () => {
  pgStub.resetCalls();
  const res = makeRes();
  await createHandler(makeReq({ method: 'GET', query: { sort: 'rating' } }), res);
  assert(res.statusCode === 200, `got ${res.statusCode}`);
  const q = pgStub.calls.find((c) => c.text.includes('FROM projects p'));
  assert(q.text.includes('ORDER BY average_rating DESC'), 'not rating sort');
});

await test('GET /api/projects — search adds parameterized ILIKE', async () => {
  pgStub.resetCalls();
  const res = makeRes();
  await createHandler(makeReq({ method: 'GET', query: { search: 'pdf%' } }), res);
  assert(res.statusCode === 200, `got ${res.statusCode}`);
  const q = pgStub.calls.find((c) => c.text.includes('FROM projects p'));
  assert(q.text.includes('ILIKE'), 'no ILIKE in query');
  assert(!q.text.includes('pdf%'), 'raw search term interpolated!');
  assert(q.params.some((p) => String(p).includes('pdf\\%')), 'escaped param missing');
});

await test('GET /api/projects — rejects unknown method', async () => {
  const res = makeRes();
  await createHandler(makeReq({ method: 'DELETE' }), res);
  assert(res.statusCode === 405, `got ${res.statusCode}`);
});

// ---------------------------------------------------------------------------
// project detail
// ---------------------------------------------------------------------------
await test('GET /api/projects/:id — returns project', async () => {
  const res = makeRes();
  await detailHandler(makeReq({ method: 'GET', query: { id: VALID_ID } }), res);
  assert(res.statusCode === 200, `got ${res.statusCode}: ${res.body}`);
  const data = body(res);
  assert(data.project.id === VALID_ID, 'id mismatch');
  assert(typeof data.project.averageRating === 'number', 'avg not number');
});

await test('GET /api/projects/:id — invalid id is 404', async () => {
  const res = makeRes();
  await detailHandler(makeReq({ method: 'GET', query: { id: 'not-a-uuid' } }), res);
  assert(res.statusCode === 404, `got ${res.statusCode}`);
});

// ---------------------------------------------------------------------------
// ratings
// ---------------------------------------------------------------------------
await test('POST /api/projects/:id/rating — upserts and returns aggregates', async () => {
  pgStub.resetCalls();
  const res = makeRes();
  await ratingHandler(
    makeReq({
      method: 'POST',
      query: { id: VALID_ID },
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visitorId: 'visitor-abc-123', rating: 5 }),
    }),
    res
  );
  assert(res.statusCode === 200, `got ${res.statusCode}: ${res.body}`);
  const data = body(res);
  assert(data.yourRating === 5, 'yourRating mismatch');
  assert(typeof data.averageRating === 'number' && typeof data.ratingCount === 'number', 'aggregates missing');
  assert(/thank you/i.test(data.message), 'no thank-you message');
  const upsert = pgStub.calls.find((c) => c.text.includes('INSERT INTO ratings'));
  assert(upsert && upsert.text.includes('ON CONFLICT (project_id, visitor_id)'), 'not an upsert');
});

await test('POST /api/projects/:id/rating — rejects rating 6', async () => {
  const res = makeRes();
  await ratingHandler(
    makeReq({
      method: 'POST',
      query: { id: VALID_ID },
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visitorId: 'visitor-abc-123', rating: 6 }),
    }),
    res
  );
  assert(res.statusCode === 400, `got ${res.statusCode}`);
});

await test('POST /api/projects/:id/rating — rejects short visitor id', async () => {
  const res = makeRes();
  await ratingHandler(
    makeReq({
      method: 'POST',
      query: { id: VALID_ID },
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visitorId: 'x', rating: 4 }),
    }),
    res
  );
  assert(res.statusCode === 400, `got ${res.statusCode}`);
});

// ---------------------------------------------------------------------------
// upload
// ---------------------------------------------------------------------------
await test('POST /api/upload — resizes to WebP and stores in Blob', async () => {
  blobStub.resetBlob();
  const png = await sharp({
    create: { width: 1200, height: 900, channels: 3, background: { r: 30, g: 60, b: 120 } },
  })
    .png()
    .toBuffer();
  const boundary = '----testboundary123';
  const req = makeReq({
    method: 'POST',
    headers: {
      'content-type': `multipart/form-data; boundary=${boundary}`,
      'content-length': String(png.length + 500),
    },
    body: multipart(boundary, [
      { name: 'image', filename: 'photo.png', contentType: 'image/png', data: png },
    ]),
  });
  const res = makeRes();
  await uploadHandler(req, res);
  assert(res.statusCode === 201, `got ${res.statusCode}: ${res.body}`);
  const data = body(res);
  assert(/^https:\/\/stub123\.public\.blob\.vercel-storage\.com\/projects\/.+\.webp$/.test(data.url), `bad url: ${data.url}`);
  assert(data.width <= 800 && data.height <= 500, `not resized: ${data.width}x${data.height}`);
  const putCall = blobStub.puts[0];
  assert(putCall.options.contentType === 'image/webp', 'wrong content type');
  assert(!putCall.pathname.includes('photo'), 'user filename preserved!');
});

await test('POST /api/upload — rejects files over 2 MB', async () => {
  const big = Buffer.alloc(2.5 * 1024 * 1024, 7);
  const boundary = '----testboundary456';
  const req = makeReq({
    method: 'POST',
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    body: multipart(boundary, [
      { name: 'image', filename: 'big.png', contentType: 'image/png', data: big },
    ]),
  });
  const res = makeRes();
  await uploadHandler(req, res);
  assert(res.statusCode === 413, `got ${res.statusCode}: ${res.body}`);
  assert(/2 MB/.test(body(res).error), `message: ${res.body}`);
});

await test('POST /api/upload — rejects fake image (wrong magic bytes)', async () => {
  const boundary = '----testboundary789';
  const req = makeReq({
    method: 'POST',
    headers: { 'content-type': `multipart/form-data; boundary=${boundary}` },
    body: multipart(boundary, [
      {
        name: 'image', filename: 'evil.png', contentType: 'image/png',
        data: Buffer.from('this is not an image, just text'),
      },
    ]),
  });
  const res = makeRes();
  await uploadHandler(req, res);
  assert(res.statusCode === 400, `got ${res.statusCode}: ${res.body}`);
  assert(/JPG, PNG and WebP/.test(body(res).error), `message: ${res.body}`);
});

// ---------------------------------------------------------------------------
// admin
// ---------------------------------------------------------------------------
await test('POST /api/admin/login — wrong secret is 401', async () => {
  const res = makeRes();
  await loginHandler(
    makeReq({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: 'wrong' }),
    }),
    res
  );
  assert(res.statusCode === 401, `got ${res.statusCode}`);
});

await test('POST /api/admin/login — correct secret sets httpOnly cookie', async () => {
  const res = makeRes();
  await loginHandler(
    makeReq({
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ secret: 'test-admin-secret-12345' }),
    }),
    res
  );
  assert(res.statusCode === 200, `got ${res.statusCode}: ${res.body}`);
  const cookie = res.headers['set-cookie'] || '';
  assert(/HttpOnly/.test(cookie) && /SameSite=Lax/.test(cookie), `bad cookie: ${cookie}`);
});

await test('GET /api/admin/stats — 401 without cookie, 200 with', async () => {
  const anon = makeRes();
  await statsHandler(makeReq({ method: 'GET' }), anon);
  assert(anon.statusCode === 401, `anon got ${anon.statusCode}`);

  const authed = makeRes();
  await statsHandler(makeReq({ method: 'GET', headers: { cookie: adminCookie() } }), authed);
  assert(authed.statusCode === 200, `authed got ${authed.statusCode}: ${authed.body}`);
  const data = body(authed);
  assert(data.totalProjects === 5 && data.totalRatings === 42, 'stats mismatch');
});

await test('GET /api/admin/projects — lists with cookie', async () => {
  const res = makeRes();
  await adminListHandler(makeReq({ method: 'GET', headers: { cookie: adminCookie() } }), res);
  assert(res.statusCode === 200, `got ${res.statusCode}`);
  assert(Array.isArray(body(res).projects), 'no projects array');
});

await test('PATCH /api/admin/projects/:id — validates status enum', async () => {
  const bad = makeRes();
  await adminItemHandler(
    makeReq({
      method: 'PATCH',
      query: { id: VALID_ID },
      headers: { 'content-type': 'application/json', cookie: adminCookie() },
      body: JSON.stringify({ status: 'exploded' }),
    }),
    bad
  );
  assert(bad.statusCode === 400, `got ${bad.statusCode}`);

  const good = makeRes();
  await adminItemHandler(
    makeReq({
      method: 'PATCH',
      query: { id: VALID_ID },
      headers: { 'content-type': 'application/json', cookie: adminCookie() },
      body: JSON.stringify({ status: 'hidden' }),
    }),
    good
  );
  assert(good.statusCode === 200, `got ${good.statusCode}`);
  assert(body(good).status === 'hidden', 'status not updated');
});

await test('DELETE /api/admin/projects/:id — removes project + blob image', async () => {
  blobStub.resetBlob();
  const res = makeRes();
  await adminItemHandler(
    makeReq({ method: 'DELETE', query: { id: VALID_ID }, headers: { cookie: adminCookie() } }),
    res
  );
  assert(res.statusCode === 200, `got ${res.statusCode}: ${res.body}`);
  assert(blobStub.dels.length === 1, 'blob image not deleted');
});

await test('GET /api/health — reports db status', async () => {
  const res = makeRes();
  await healthHandler(makeReq({ method: 'GET' }), res);
  assert(res.statusCode === 200, `got ${res.statusCode}`);
  assert(body(res).db === true, 'db not ok');
});

// ---------------------------------------------------------------------------
// report
// ---------------------------------------------------------------------------
const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} API tests passed.`);
for (const f of failed) console.log(`  FAIL: ${f.name}\n        ${f.error}`);
process.exit(failed.length ? 1 : 0);

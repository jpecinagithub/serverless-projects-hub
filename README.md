# Serverless Projects Hub

A public community directory where developers share their serverless projects —
discover ideas, visit live projects, and rate favorites from 1 to 5 stars.

**Stack:** Vite + React 19 + Tailwind CSS 4 · Vercel Serverless Functions (`/api`)
· Neon PostgreSQL (persistent data) · Vercel Blob (optimized thumbnails).
No permanently-running server, no local files as storage — everything
serverless-safe.

---

## 1. Local installation

```bash
npm install
npm run dev
```

Open http://localhost:5173.

**Demo mode:** without any infrastructure configured, `npm run dev`
automatically serves built-in mock data (persisted in your browser's
localStorage), so the entire flow — submit → directory → detail → rate →
admin — works out of the box. A banner marks demo mode; it never ships to
production (the mock is tree-shaken out of production builds).

To hit real `/api` functions locally instead, set `VITE_USE_REAL_API=1` in
`.env.local` and run the functions with `vercel dev`.

---

## 2. Environment configuration

Copy the template and fill in real values (never commit secrets):

```bash
cp .env.example .env.local
```

| Variable | Where | Required | Notes |
|---|---|---|---|
| `DATABASE_URL` | server | yes | Neon pooled connection string (`...-pooler.neon.tech`). `POSTGRES_URL` also works. |
| `BLOB_READ_WRITE_TOKEN` | server | yes | Created automatically when you connect a Blob store in Vercel. |
| `ADMIN_SECRET` | server | for `/admin` | Min. 16 random chars. Unlocks the admin dashboard. |
| `VITE_USE_REAL_API` | local dev | no | `1` = bypass mock data and call real `/api` (needs `vercel dev`). |
| `VITE_GITHUB_URL` | client | no | Link behind the header's GitHub icon. |

> Variables starting with `VITE_` are embedded in the frontend bundle.
> `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN` and `ADMIN_SECRET` are **server-only**
> — only code under `/api` may read them.

---

## 3. Database setup (Neon Postgres via Vercel Marketplace)

1. In the Vercel dashboard, open your project → **Storage** → **Create** →
   **Neon Postgres** (via Marketplace) and connect it.
2. Vercel injects `POSTGRES_URL` (pooled) and `DATABASE_URL` automatically —
   no manual copying needed for production.
3. For local scripts (seed), create a `.env` file or export `DATABASE_URL`
   from the Neon dashboard (use the **pooled** connection string).

---

## 4. Blob storage (Vercel Blob)

1. In the Vercel dashboard, open your project → **Storage** → **Create** →
   **Blob** and connect the store.
2. Vercel injects `BLOB_READ_WRITE_TOKEN` automatically.
3. Uploaded thumbnails are stored at `projects/{uuid}.webp` and served from
   `https://<store>.public.blob.vercel-storage.com/...`.

---

## 5. Database migration

Run the schema once (and again after any future schema change):

```bash
# via psql (pooled URL from the Neon dashboard)
psql "$DATABASE_URL" -f database/schema.sql
```

Or paste `database/schema.sql` into the **Neon SQL Editor**.
It creates the `projects` and `ratings` tables, the unique
`(project_id, visitor_id)` constraint, all indexes, and `updated_at` triggers.
It is idempotent (`IF NOT EXISTS`).

### Seed data (development)

```bash
DATABASE_URL="postgres://..." npm run seed        # insert 8 example projects + ratings
DATABASE_URL="postgres://..." npm run seed:clear  # remove them (ratings cascade)
```

Seed rows carry `is_seed = true`, so they are trivially removable before
production. Never run the seed against the production database unless you
want the examples live.

---

## 6. Deployment (step by step)

1. **Push to GitHub**
   ```bash
   git init && git add -A && git commit -m "Serverless Projects Hub"
   git branch -M main && git remote add origin git@github.com:<you>/serverless-projects-hub.git
   git push -u origin main
   ```
2. **Import into Vercel** — vercel.com → Add New → Project → select the repo.
   Framework preset: **Vite**. Build command and output dir are auto-detected.
3. **Provision Neon Postgres** — project → Storage → Create → Neon Postgres.
4. **Configure Vercel Blob** — project → Storage → Create → Blob.
5. **Set environment variables** — project → Settings → Environment Variables:
   `ADMIN_SECRET` (long random string). `POSTGRES_URL`/`DATABASE_URL` and
   `BLOB_READ_WRITE_TOKEN` are injected automatically by steps 3–4.
6. **Run the migration** — `psql "$DATABASE_URL" -f database/schema.sql`
   (get the URL from Storage → Neon → connection string), or use the Neon
   SQL Editor.
7. **Deploy** — Vercel deploys on push. Verify with
   `https://<your-app>.vercel.app/api/health` → `{ "ok": true, "db": true, ... }`.

`vercel.json` already contains the SPA rewrite (`/((?!api/).*)` → `/index.html`)
so client-side routes (`/project/:id`, `/submit`, `/admin`) work on refresh.

---

## 7. API reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/projects?page=1&limit=12&sort=newest\|rating\|popular&search=...&min_ratings=5` | Paginated directory (published only). |
| `POST` | `/api/projects` | Submit a project (validated server-side). |
| `GET` | `/api/projects/:id` | Project detail + `averageRating`, `ratingCount`. |
| `POST` | `/api/projects/:id/rating` | `{ visitorId, rating }` — UPSERT per `(project_id, visitor_id)`. |
| `POST` | `/api/upload` | Multipart `image` → resized WebP in Blob, returns `{ url, ... }`. |
| `POST` | `/api/admin/login` | `{ secret }` → httpOnly admin cookie. |
| `POST` | `/api/admin/logout` | Clears the admin cookie. |
| `GET` | `/api/admin/stats` | Totals + average + new-this-week (admin). |
| `GET` | `/api/admin/projects` | All projects incl. hidden (admin). |
| `PATCH` | `/api/admin/projects/:id` | `{ status }` (admin). |
| `DELETE` | `/api/admin/projects/:id` | Deletes ratings, project, and Blob image (admin). |
| `GET` | `/api/health` | `{ ok, db, blob, time }` deployment check. |

Rating example response:

```json
{ "averageRating": 4.35, "ratingCount": 127 }
```

---

## 8. Architecture notes

- **Ratings are never computed in the frontend.** `averageRating`/`ratingCount`
  come from `AVG`/`COUNT` over the `ratings` table on every read.
- **Abuse protection:** the browser generates a random `visitorId`
  (localStorage); the DB enforces `UNIQUE(project_id, visitor_id)` and the
  endpoint UPSERTs, so a visitor can change their vote but not multiply it.
  Per-instance rate limiting adds a first line of defense (use Upstash Redis
  for strict distributed limiting).
- **Images:** ≤ 2 MB → magic-byte sniffing (`file-type`, never trust the
  extension) → `sharp` resize to fit inside 800×500 → WebP q78 → Vercel Blob
  at `projects/{uuid}.webp`. Only the public URL is stored in Postgres.
  No image → a single static `/default-project.svg` (never duplicated per
  project).
- **Admin:** stateless HMAC cookie (`ADMIN_SECRET`), no sessions — safe across
  serverless instances. Contact emails are stored but **never** exposed by any
  public endpoint.
- **Future-proofing:** `status` column supports a moderation queue;
  `is_seed` marks fixtures; commented-out `category`/`tags` placeholders in
  the schema show where taxonomy lands. The API layer is thin per-route
  handlers sharing `_lib/`, so adding comments, favorites, or auth is
  additive.

## 9. Tests

```bash
npm run test:api   # 23 handler tests (validation, SQL, upsert, upload pipeline, admin)
```

Handlers run for real; `@vercel/postgres` and `@vercel/blob` are stubbed at
the module loader. The frontend flow (submit → publish → rate → persist →
admin) is verified with headless-browser E2E in dev mock mode.

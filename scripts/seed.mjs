#!/usr/bin/env node
/**
 * Seed script for Serverless Projects Hub.
 *
 * Inserts ~8 realistic example projects (marked is_seed = true) plus a spread
 * of ratings so the directory, featured row, sorting and detail pages look
 * alive during development.
 *
 * Usage:
 *   DATABASE_URL="postgres://..." node scripts/seed.mjs          # insert
 *   DATABASE_URL="postgres://..." node scripts/seed.mjs --clear   # remove seed rows
 *
 * Seed rows are trivially removable before production: everything inserted
 * here carries is_seed = true, and --clear deletes exactly those rows
 * (ratings cascade).
 */
import { sql } from '@vercel/postgres';

const CLEAR = process.argv.includes('--clear');

const PROJECTS = [
  {
    title: 'InvoiceAI',
    url: 'https://invoiceai-demo.vercel.app',
    description:
      'AI-powered invoice analyzer running on a serverless architecture. Drop a PDF invoice and get structured line items, totals and tax breakdowns in seconds.',
    author_name: 'Jon',
    author_bio:
      'Finance professional experimenting with AI and serverless applications.',
    image_url: null,
  },
  {
    title: 'Serverless PDF Writer',
    url: 'https://pdf-writer-demo.vercel.app',
    description:
      'A lightweight PDF editing tool running entirely on serverless functions. Merge, split, compress and annotate PDFs without installing anything.',
    author_name: 'Mara K.',
    author_bio: 'Frontend developer obsessed with document tooling.',
    image_url: null,
  },
  {
    title: 'CutLab — Browser Video Editor',
    url: 'https://cutlab-demo.vercel.app',
    description:
      'Trim, caption and export short videos directly in the browser. Renders run on ephemeral serverless workers; nothing is ever uploaded permanently.',
    author_name: 'Devon',
    author_bio: null,
    image_url: null,
  },
  {
    title: 'LedgerLens Finance Dashboard',
    url: 'https://ledgerlens-demo.vercel.app',
    description:
      'Personal finance dashboard with bank-grade charts, budget alerts and a monthly close checklist — all computed on demand by serverless APIs.',
    author_name: 'Priya S.',
    author_bio: 'Ex-accountant turned indie hacker.',
    image_url: null,
  },
  {
    title: 'Axiom AI Learning Portal',
    url: 'https://axiom-learn-demo.vercel.app',
    description:
      'Bite-size AI lessons with interactive quizzes and a progress map. Static frontend, serverless quiz engine, zero servers to maintain.',
    author_name: 'Tomás R.',
    author_bio: 'Teacher building free AI literacy resources.',
    image_url: null,
  },
  {
    title: 'JobRadar Aggregator',
    url: 'https://jobradar-demo.vercel.app',
    description:
      'Meta job-search indexer that polls public career boards and ranks matches with an explainable score. Scheduled entirely with serverless cron.',
    author_name: 'Aisha B.',
    author_bio: null,
    image_url: null,
  },
  {
    title: 'Nimbus Weather Dashboard',
    url: 'https://nimbus-weather-demo.vercel.app',
    description:
      'Hyper-local weather with radar maps and 7-day probabilistic forecasts, cached at the edge and refreshed by serverless scheduled jobs.',
    author_name: 'Jon',
    author_bio:
      'Finance professional experimenting with AI and serverless applications.',
    image_url: null,
  },
  {
    title: 'FolioForge Portfolio Generator',
    url: 'https://folioforge-demo.vercel.app',
    description:
      'Answer six questions and get a polished developer portfolio site generated for you — deployed to the edge in under a minute.',
    author_name: 'Lena W.',
    author_bio: 'Design engineer who loves boring technology.',
    image_url: null,
  },
];

function randomVisitorIds(n) {
  return Array.from({ length: n }, (_, i) => `seed-visitor-${i + 1}`);
}

async function clear() {
  const res = await sql`DELETE FROM projects WHERE is_seed = true`;
  console.log(`Removed ${res.rowCount} seeded project(s) (ratings cascaded).`);
}

async function seed() {
  const existing = await sql`SELECT COUNT(*)::int AS c FROM projects WHERE is_seed = true`;
  if (existing.rows[0].c > 0) {
    console.log('Seed data already present — run with --clear first to reseed.');
    return;
  }

  const visitors = randomVisitorIds(40);
  const ratingPlan = [28, 22, 16, 12, 9, 7, 5, 3]; // ratings per project
  const avgPlan = [4.6, 4.3, 4.8, 3.9, 4.5, 4.1, 4.7, 3.6]; // target averages

  for (let i = 0; i < PROJECTS.length; i++) {
    const p = PROJECTS[i];
    const rows = await sql`
      INSERT INTO projects (title, url, description, author_name, author_bio, image_url, is_seed)
      VALUES (${p.title}, ${p.url}, ${p.description}, ${p.author_name}, ${p.author_bio}, ${p.image_url}, true)
      RETURNING id
    `;
    const projectId = rows.rows[0].id;

    // Spread ratings around the target average deterministically-ish.
    const target = avgPlan[i];
    const count = ratingPlan[i];
    for (let v = 0; v < count; v++) {
      const jitter = ((v * 37 + i * 11) % 5) - 2; // -2..2 deterministic
      const rating = Math.min(5, Math.max(1, Math.round(target + jitter * 0.5)));
      await sql`
        INSERT INTO ratings (project_id, visitor_id, rating)
        VALUES (${projectId}, ${visitors[(i * 7 + v) % visitors.length]}, ${rating})
        ON CONFLICT DO NOTHING
      `;
    }
    console.log(`Seeded "${p.title}" with ~${count} ratings.`);
  }
  console.log('Done. Remove any time with: node scripts/seed.mjs --clear');
}

try {
  if (CLEAR) await clear();
  else await seed();
} catch (err) {
  console.error('Seed failed:', err.message);
  process.exit(1);
} finally {
  // @vercel/postgres keeps a pool; let the process exit cleanly.
  process.exit(0);
}

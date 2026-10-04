/**
 * Node module customization hooks for API tests.
 * Redirects serverless-only modules to local stubs:
 *   @vercel/postgres -> test/stubs/postgres.mjs
 *   @vercel/blob     -> test/stubs/blob.mjs
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));

const REDIRECTS = {
  '@vercel/postgres': pathToFileURL(path.join(root, 'stubs', 'postgres.mjs')).href,
  '@vercel/blob': pathToFileURL(path.join(root, 'stubs', 'blob.mjs')).href,
};

export async function resolve(specifier, context, nextResolve) {
  if (REDIRECTS[specifier]) {
    return { url: REDIRECTS[specifier], shortCircuit: true };
  }
  return nextResolve(specifier, context);
}

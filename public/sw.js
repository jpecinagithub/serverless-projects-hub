/**
 * Serverless Projects Hub — service worker.
 *
 * Strategy:
 * - /api/*            → network only (API responses are never cached)
 * - navigations       → network first, fall back to cached app shell (offline)
 * - /assets/* (hashed)→ cache first (immutable by content hash)
 * - images            → cache first, then network (offline-friendly thumbnails)
 * - everything else   → network first, cache fallback
 *
 * Bump CACHE_VERSION to invalidate everything on breaking changes.
 */
const CACHE_VERSION = 'shp-v1';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const RUNTIME_CACHE = `${CACHE_VERSION}-runtime`;
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/default-project.svg', '/favicon.svg'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

function isApi(url) {
  return url.pathname.startsWith('/api/');
}

function isHashedAsset(url) {
  return url.pathname.startsWith('/assets/');
}

function isImage(request, url) {
  return (
    request.destination === 'image' ||
    /\.(png|jpe?g|webp|svg|gif|avif)$/i.test(url.pathname)
  );
}

async function networkFirst(request, cacheName, fallbackUrl) {
  const cache = await caches.open(cacheName);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    if (fallbackUrl) {
      const fallback = await cache.match(fallbackUrl);
      if (fallback) return fallback;
    }
    throw new Error('offline');
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) {
    cache.put(request, response.clone());
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Never cache API traffic.
  if (isApi(url)) return;

  // App navigation: network first, offline falls back to the app shell.
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, RUNTIME_CACHE, '/'));
    return;
  }

  // Hashed build assets are immutable → cache first.
  if (isHashedAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  // Thumbnails and icons: offline-friendly.
  if (isImage(request, url)) {
    event.respondWith(
      cacheFirst(request, RUNTIME_CACHE).catch(() => fetch(request))
    );
    return;
  }

  event.respondWith(networkFirst(request, RUNTIME_CACHE));
});

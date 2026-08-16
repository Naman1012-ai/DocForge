/**
 * DocFrame — Progressive Web App Service Worker
 * Version: 1.0.0
 * 
 * Provides safe offline caching for the application shell and static assets,
 * with Network-First navigation and strict bypass for API requests, private data,
 * and remote LLM communications.
 */

const CACHE_NAME = 'docframe-cache-v1';

const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/docframe-logo.png',
  '/favicon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/pwa-maskable-512x512.png',
  '/apple-touch-icon.png'
];

// Install: Pre-cache core application shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: Clean up old cache versions and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name.startsWith('docframe-cache-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: Strategy-based request handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Only handle GET requests; pass all POST/PUT/DELETE directly to network
  if (request.method !== 'GET') {
    return;
  }

  // 2. NEVER cache or intercept API endpoints, remote LLMs, or proxy routes
  if (
    url.pathname.startsWith('/api/') ||
    url.hostname.includes('openai.com') ||
    url.hostname.includes('anthropic.com') ||
    url.hostname.includes('googleapis.com') ||
    url.hostname.includes('groq.com') ||
    url.hostname.includes('deepseek.com') ||
    url.hostname.includes('openrouter.ai') ||
    url.port === '11434'
  ) {
    return;
  }

  // 3. Navigation requests: Network-First with Cache fallback for SPA
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match('/index.html').then((cachedIndex) => {
            return cachedIndex || caches.match('/');
          });
        })
    );
    return;
  }

  // 4. Static assets (JS, CSS, images, fonts): Stale-While-Revalidate / Cache-First
  if (
    url.pathname.startsWith('/assets/') ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.ttf') ||
    url.pathname.endsWith('.webmanifest')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch update in background for assets
          fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, networkResponse);
              });
            }
          }).catch(() => {/* Ignore background fetch failure */});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 5. Default fallback to network
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request);
    })
  );
});

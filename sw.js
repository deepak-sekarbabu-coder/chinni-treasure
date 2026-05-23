// ===== LUXE Service Worker v1.0 =====
const CACHE_NAME = 'luxe-cache-v1';

// Assets to pre-cache on install (the app shell)
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/order.html',
  '/confirmation.html',
  '/admin.html',
  '/login.html',
  '/css/style.css',
  '/js/main.js',
  '/manifest.json'
];

// Install: pre-cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    }).then(() => {
      self.clients.claim();
    })
  );
});

// Fetch: cache-first for static assets, network-first for everything else
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and browser extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http')) return;

  // For API-like requests (external images, CDN fonts, etc.), use network-first
  if (url.origin !== self.location.origin) {
    event.respondWith(networkFirstWithCacheFallback(request));
    return;
  }

  // For our own assets, use cache-first
  event.respondWith(cacheFirstWithNetworkFallback(request));
});

// Cache-first: serve from cache, fall back to network
async function cacheFirstWithNetworkFallback(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // If both cache and network fail, return a basic offline page for navigation
    if (request.mode === 'navigate') {
      const cache = await caches.open(CACHE_NAME);
      const offlinePage = await cache.match('/index.html');
      if (offlinePage) return offlinePage;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Network-first: try network first, fall back to cache
async function networkFirstWithCacheFallback(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse && networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) return cachedResponse;
    return new Response('Offline', { status: 503 });
  }
}

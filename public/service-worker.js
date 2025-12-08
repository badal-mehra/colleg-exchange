const APP_VERSION = 'v3.0.0'; // Bump this to force update
const CACHE_STATIC = `static-${APP_VERSION}`;
const CACHE_DYNAMIC = `dynamic-${APP_VERSION}`;
const MAX_DYNAMIC_ENTRIES = 50;

// Base64 placeholder for offline images
const OFFLINE_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNjY2MiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIj5PZmZsaW5lPC90ZXh0Pjwvc3ZnPg==';

// CLEAN Static Assets (No '/')
const STATIC_ASSETS = [
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/maskable-512.png'
];

// --- UTILS ---
const limitCacheSize = async (name, size) => {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > size) {
    await cache.delete(keys[0]);
    limitCacheSize(name, size);
  }
};

// --- LIFECYCLE ---
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_STATIC && key !== CACHE_DYNAMIC) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Listen for "Skip Waiting" message from UI
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- FETCH STRATEGY ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. SAFETY ZONE: Network Only
  // Exclude Supabase, Auth, and POST/PUT/DELETE
  if (
    request.method !== 'GET' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.includes('/auth')
  ) {
    return; 
  }

  // 2. NAVIGATION (HTML) - Network First + Index Freshening
  // Vital for Vite/SPA updates
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkRes) => {
          return caches.open(CACHE_STATIC).then((cache) => {
            // Update the cache with the new index.html (containing new JS hashes)
            cache.put('/index.html', networkRes.clone());
            return networkRes;
          });
        })
        .catch(() => {
          return caches.match('/offline.html');
        })
    );
    return;
  }

  // 3. STATIC ASSETS (Images, Fonts, Scripts) - Stale While Revalidate
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image'
  ) {
    event.respondWith(
      caches.match(request).then((cachedRes) => {
        const fetchPromise = fetch(request).then((networkRes) => {
          return caches.open(CACHE_DYNAMIC).then((cache) => {
            cache.put(request, networkRes.clone());
            limitCacheSize(CACHE_DYNAMIC, MAX_DYNAMIC_ENTRIES);
            return networkRes;
          });
        });
        return cachedRes || fetchPromise;
      }).catch(() => {
        if (request.destination === 'image') {
          return new Response(OFFLINE_IMAGE, { headers: { 'Content-Type': 'image/svg+xml' }});
        }
      })
    );
    return;
  }
});

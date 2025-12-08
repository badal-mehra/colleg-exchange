const APP_VERSION = 'v2.0.0'; // Bump this to trigger update flow
const CACHE_STATIC = `static-${APP_VERSION}`;
const CACHE_DYNAMIC = `dynamic-${APP_VERSION}`;
const MAX_DYNAMIC_ENTRIES = 50;

// Base64 placeholder for offline images (lightweight, no external fetch needed)
const OFFLINE_IMAGE = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiB2aWV3Qm94PSIwIDAgMTAwIDEwMCI+PHJlY3Qgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIGZpbGw9IiNjY2MiLz48dGV4dCB4PSI1MCIgeT0iNTAiIGRvbWluYW50LWJhc2VsaW5lPSJtaWRkbGUiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjMzMzIj5PZmZsaW5lPC90ZXh0Pjwvc3ZnPg==';

// Files strictly required for the App Shell
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/maskable-512.png' // Ensure you have this!
];

// --- UTILS ---
// Trim cache to prevent storage bloat
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
    caches.open(CACHE_STATIC).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  // Do NOT skipWaiting() automatically here. 
  // We wait for the user to click "Update" in the UI to prevent page breaking.
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

// --- MESSAGE LISTENER (Triggered by UI) ---
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// --- FETCH STRATEGIES ---
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. SAFETY ZONE: Never cache Supabase, Auth, or API mutations
  if (
    request.method !== 'GET' || 
    url.hostname.includes('supabase.co') || 
    url.pathname.includes('/auth') || 
    url.pathname.includes('/api')
  ) {
    return; // Network only
  }

  // 2. STATIC ASSETS (Images, Fonts, Scripts)
  // Use StaleWhileRevalidate: Serve fast from cache, update in background
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
        // Fallback for images
        if (request.destination === 'image') {
          return new Response(OFFLINE_IMAGE, { headers: { 'Content-Type': 'image/svg+xml' }}); 
        }
      })
    );
    return;
  }

  // 3. NAVIGATION (HTML) - Network First (Crucial for Vite Updates)
  // We must hit network to see if index.html has new hashed JS filenames
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match('/offline.html');
      })
    );
    return;
  }
});


const CACHE_NAME = 'rfe-foam-pro-v11-desktop';
const OFFLINE_PAGE = '/offline.html';
const URLS_TO_CACHE = [
  './index.html',
  './manifest.json',
  './',
  OFFLINE_PAGE
];

// Install Event: Cache critical app shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(URLS_TO_CACHE)
          .catch((err) => {
            console.warn('[Service Worker] Some resources failed to cache:', err);
            // Continue anyway - the app might still work
            return Promise.resolve();
          });
      })
      .then(() => {
        console.log('[Service Worker] Skip waiting');
        return self.skipWaiting();
      })
      .catch((err) => {
        console.error('[Service Worker] Install failed:', err);
      })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[Service Worker] Claiming clients');
        return self.clients.claim();
      })
      .catch((err) => {
        console.error('[Service Worker] Activation failed:', err);
      })
  );
});

// Fetch Event: Stale-While-Revalidate Strategy with improved error handling
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // 1. Handle Navigation (HTML) - Network First for freshness, Fallback to Cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch((err) => {
          console.log('[Service Worker] Network request failed, serving from cache:', err);
          return caches.match(event.request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // If no cache, return offline page
              return caches.match('./index.html');
            });
        })
    );
    return;
  }

  // 2. Handle API calls (Google Script) - Network Only (Don't cache dynamic data)
  if (event.request.url.includes('script.google.com') || 
      event.request.url.includes('googleapis.com')) {
    event.respondWith(
      fetch(event.request)
        .catch((err) => {
          console.log('[Service Worker] API request failed:', err);
          return new Response(JSON.stringify({ 
            error: 'Network error', 
            offline: true 
          }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }

  // 3. Handle Assets (JS, CSS, Images) - Stale-While-Revalidate
  // Serve from cache immediately, then update cache from network in background
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            // Check if valid response
            if (networkResponse && networkResponse.status === 200) {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              }).catch((err) => {
                console.warn('[Service Worker] Cache update failed:', err);
              });
            }
            return networkResponse;
          })
          .catch((err) => {
            console.log('[Service Worker] Fetch failed, using cache:', err);
            // Network failed, nothing to do (we already returned cache if available)
            return cachedResponse || new Response('Offline', { status: 503 });
          });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
  );
});

// Background Sync for failed requests
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync triggered:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(
      // Notify clients that sync is happening
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SYNC_EVENT',
            message: 'Background sync in progress'
          });
        });
      })
    );
  }
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[Service Worker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLIENTS_CLAIM') {
    self.clients.claim();
  }
});

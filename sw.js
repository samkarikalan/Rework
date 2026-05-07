/* =============================================
   CLUB Scheduler -- Service Worker
   Caches app shell for offline use
   ============================================= */

const CACHE_NAME = 'club-scheduler-v144';

const ASSETS = [
  './index.html',
  './ui.css',
  './rounds.css',
  './main.js',
  './HomeScreen.js',
  './home.js',
  './settings.js',
  './players.js',
  './rounds.js',
  './games.js',
  './summary.js',
  './dashboard.js',
  './viewer.js',
  './report.js',
  './profile.js',
  './auth.js',
  './authUI.js',
  './subscription.js',
  './supabase.js',
  './importPlayers.js',
  './engjap.js',
  './ExportCSS.js',
  './build.js',
  './app.js',
  './github.js',
  './help.js',
  './snapshot.js',
  './manifest.json',
  './male.png',
  './female.png',
  './win-cup.png',
  './lock.png',
  './unlock.png',
  './icon-192.png',
  './icon-512.png',
  './help_en.json',
  './help_jp.json',
  './help_kr.json',
  './help_zh.json',
  './help_vi.json'
];

/* ── Install: cache all assets (safe -- one failure won't block install) ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.all(
        ASSETS.map(function(url) {
          return cache.add(url).catch(function(e) {
            console.warn('SW: failed to cache', url, e);
          });
        })
      );
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

/* ── Activate: clean up old caches ── */
self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(key) { return key !== CACHE_NAME; })
            .map(function(key) { return caches.delete(key); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

/* ── Fetch: network first, cache as offline fallback ── */
self.addEventListener('fetch', function(event) {
  // Always go to network for API calls
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('workers.dev')) return;
  if (event.request.url.includes('/db/')) return;
  if (event.request.url.includes('/auth/')) return;
  if (event.request.url.includes('/sub/')) return;
  if (event.request.url.includes('/generate-round')) return;

  event.respondWith(
    fetch(event.request).then(function(response) {
      // Got fresh response — update cache and return it
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      // Offline — serve from cache
      return caches.match(event.request).then(function(cached) {
        return cached || caches.match('./index.html');
      });
    })
  );
});

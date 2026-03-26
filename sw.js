/* =============================================
   CLUB Scheduler — Service Worker
   Relative paths — works from any host location
   ============================================= */

const CACHE_NAME = 'club-scheduler-v19';

// Base path derived from sw.js location — works wherever it's hosted
const BASE = self.location.pathname.replace('sw.js', '');

const ASSETS = [
  'KariBRRApp.html',
  'manifest.json',
  'BRRStyle1.css',
  'BRRStyle2.css',
  'BRRStyle3.css',
  'Export.css',
  'HomeStyle.css',
  'HomeStyle-new.css',
  'main.js',
  'HomeScreen.js',
  'auth.js',
  'authUI.js',
  'home.js',
  'settings.js',
  'players.js',
  'rounds.js',
  'games.js',
  'summary.js',
  'dashboard.js',
  'viewer.js',
  'profile.js',
  'supabase.js',
  'importPlayers.js',
  'competitive_algorithm.js',
  'engjap.js',
  'ExportCSS.js',
  'help.js',
  'male.png',
  'female.png',
  'win-cup.png',
  'lock.png',
  'unlock.png',
  'power.png',
  'cs.PNG',
  'timer.mp3',
  'help_en.json',
  'help_jp.json',
  'help_kr.json',
  'help_zh.json',
  'help_vi.json'
].map(f => BASE + f);

/* ── Install: cache all assets ── */
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(ASSETS);
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

/* ── Fetch: serve from cache, fall back to network ── */
self.addEventListener('fetch', function(event) {
  // Skip Supabase API calls — always go to network
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    caches.match(event.request).then(function(cached) {
      if (cached) return cached;
      return fetch(event.request).then(function(response) {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(function(cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      });
    }).catch(function() {
      // Offline fallback
      if (event.request.destination === 'document') {
        return caches.match(BASE + 'KariBRRApp.html');
      }
    })
  );
});

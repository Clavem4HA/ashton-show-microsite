const CACHE = 'ashton-show-v12';

const PRECACHE = [
  '/',
  '/reference',
  '/articles',
  '/game',
  '/partners',
  '/article-show-2025',
  '/article-bond-comparison-2026',
  '/article-florida-2026',
  '/css/tokens.css',
  '/css/main.css',
  '/js/app.js',
  '/js/reference.js',
  '/js/game.js',
  '/js/contact-modal.js',
  '/data/states.json',
  '/data/articles.json',
  '/data/trivia.json',
  '/manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // Only handle same-origin and data file requests
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        // Cache successful same-origin responses
        if (response.ok && url.origin === self.location.origin) {
          const clone = response.clone();
          caches.open(CACHE).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

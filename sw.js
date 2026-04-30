// Bumped to v25 to force browsers to update to this new version
const CACHE_NAME = 'oxbridge-translator-v25'; 

// Include ALL core files for the multi-page app
const ASSETS = [
  '/',
  '/translator.html',
  '/dictionary.html',
  '/translation-history.html',
  '/translation-quiz.html',
  '/styles.css',
  '/script.js',
  '/firebase-auth.js',
  '/manifest.json',
  '/ox-head-008.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  // SAFETY CHECK: Only cache your own website's files. 
  // Let Firebase and Google Translate API calls pass through untouched.
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Network-First strategy: Try to get fresh files from the internet, 
  // if offline, fall back to the cached files.
  event.respondWith(
    fetch(event.request).catch(() =>
      caches.match(event.request)
    )
  );
});
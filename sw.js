const CACHE_NAME = 'vanquisher-v1';
const RUNTIME_CACHE = 'vanquisher-runtime-v1';
const PRECACHE_URLS = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => Promise.all(PRECACHE_URLS.map(url => cache.add(url).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME && k !== RUNTIME_CACHE).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET') return;
  const skipHosts = ['firebase','googleapis','gstatic','railway','open-meteo','aladhan','catbox','youtube','ytimg','itunes','fonts'];
  if (skipHosts.some(h => url.hostname.includes(h))) return;
  if (url.pathname === '/' || url.pathname.endsWith('.html') || url.pathname.endsWith('.json')) {
    event.respondWith(fetch(event.request).then(r => { const c = r.clone(); caches.open(CACHE_NAME).then(cache => cache.put(event.request, c)); return r; }).catch(() => caches.match(event.request).then(c => c || caches.match('/index.html'))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(r => { const c = r.clone(); caches.open(RUNTIME_CACHE).then(cache => cache.put(event.request, c)); return r; })));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

// ───── SERVICE WORKER ─────────────────────────────────────────────────────
// Relative paths keep GitHub Pages subdirectory deployments working.
const CACHE = 'cert-tracker-assets-v2.1.0';
const ASSETS = [
  './', './index.html', './styles.css', './certs.js', './app.js', './stability.js',
  './manifest.json', './icon.svg', './header-art.jpg', './icon-192.png', './icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

async function networkFirst(request, fallback) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request);
    if (response && response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    return (await cache.match(request)) || (fallback ? cache.match(fallback) : Response.error());
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response && response.ok) cache.put(request, response.clone());
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(request, './index.html'));
    return;
  }

  const destination = request.destination;
  if (destination === 'script' || destination === 'style') {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(cacheFirst(request));
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'NOTIFY') {
    const { title, body, tag } = event.data;
    const iconUrl = new URL('./icon.svg', self.registration.scope).href;
    event.waitUntil(self.registration.showNotification(title, {
      body, tag, icon: iconUrl, badge: iconUrl, requireInteraction: false
    }));
  }
});

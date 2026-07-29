// ───── SERVICE WORKER ─────────────────────────────────────────────────────
// Uses relative paths so it works on GitHub Pages subdirectory deployment.
const CACHE = 'cert-tracker-v337';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './certs.js',
  './app.js',
  './manifest.json',
  './icon.svg',
  './header-art.jpg',
  './icon-192.png',
  './icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

self.addEventListener('message', e => {
  if (e.data && e.data.type === 'NOTIFY') {
    const { title, body, tag } = e.data;
    // Use relative path resolved against SW scope so icons work on any deployment path
    const iconUrl = new URL('./icon.svg', self.registration.scope).href;
    self.registration.showNotification(title, {
      body,
      tag,
      icon: iconUrl,
      badge: iconUrl,
      requireInteraction: false,
    });
  }
});

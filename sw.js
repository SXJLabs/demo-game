const V = 'corridor-v1';
const CORE = ['./', './index.html', './game.js', './manifest.json',
  './icons/icon-192.png', './icons/icon-512.png', './icons/maskable-512.png', './icons/favicon.png',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(res => {
    const copy = res.clone(); caches.open(V).then(c => c.put(e.request, copy)); return res;
  }).catch(() => caches.match('./index.html'))));
});

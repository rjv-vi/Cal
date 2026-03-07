// ═══════════════════════════════════════════════════
// CALSNAP SERVICE WORKER — АВТООБНОВЛЕНИЕ
//
// ⚠️  ВАЖНО: Когда делаешь обновление приложения —
//     меняй цифру в CACHE_VERSION ниже (v1 → v2 → v3...)
//     Это единственное что нужно сделать для обновления у всех!
// ═══════════════════════════════════════════════════

const CACHE_VERSION = 'v3'; // ← МЕНЯЙ ЗДЕСЬ при каждом обновлении
const CACHE = `calsnap-${CACHE_VERSION}`;

const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.allSettled(ASSETS.map(url => c.add(url).catch(() => {})))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith('calsnap-') && k !== CACHE).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = e.request.url;

  if (url.includes('generativelanguage.googleapis.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('{"error":"offline"}', {headers:{'Content-Type':'application/json'}})));
    return;
  }

  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com')) {
    e.respondWith(fetch(e.request).then(res => { const clone=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,clone)); return res; }).catch(() => caches.match(e.request)));
    return;
  }

  if (url.endsWith('/') || url.includes('index.html') || e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).then(res => { const clone=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,clone)); return res; }).catch(() => caches.match('./index.html')));
    return;
  }

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok && e.request.method==='GET') { const clone=res.clone(); caches.open(CACHE).then(c=>c.put(e.request,clone)); }
        return res;
      }).catch(() => caches.match('./index.html'));
    })
  );
});

self.addEventListener('message', e => { if (e.data==='skipWaiting') self.skipWaiting(); });


// Zinapoya service worker: makes the site installable, opens offline, and shows daily reminders.
// A new CACHE name clears every older offline copy (old logo icons included).
const CACHE = 'zinapoya-v3';

// Download the whole site once (app files + exam pictures, listed by the build in precache.json),
// so practice works offline. Files of older versions are removed afterwards.
async function precache() {
  const cache = await caches.open(CACHE);
  let files = [];
  let version = '';
  try {
    const res = await fetch('/precache.json', { cache: 'no-store' });
    ({ files = [], version = '' } = await res.json());
  } catch {
    return; // offline: keep the copy we have
  }
  // Same version as last time: everything is already downloaded.
  const stamp = await cache.match('/__precache-version');
  if (stamp && (await stamp.text()) === version && files.length) return;
  const wanted = ['/', '/manifest.webmanifest', ...files.filter((f) => f !== '/index.html')];
  // One by one, so a single missing file never breaks the whole install.
  await Promise.all(
    wanted.map((url) =>
      fetch(url, { cache: 'no-cache' })
        .then((res) => (res.ok ? cache.put(url, res) : null))
        .catch(() => null),
    ),
  );
  await cache.put('/__precache-version', new Response(version));
  const keep = new Set([...wanted, '/__precache-version'].map((u) => new URL(u, self.location.origin).href));
  for (const req of await cache.keys()) if (!keep.has(req.url)) await cache.delete(req);
}

self.addEventListener('install', (event) => {
  event.waitUntil(precache());
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// The app asks for a refresh of the offline copy after each new version.
self.addEventListener('message', (event) => {
  if (event.data === 'precache') event.waitUntil(precache());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase, fonts, AI: always live

  // Pages: try the network first so students always get the newest version
  // (but don't wait more than 1.5 s on a weak connection: open the saved copy at once instead).
  if (req.mode === 'navigate') {
    event.respondWith(
      Promise.race([fetch(req), new Promise((_, reject) => setTimeout(() => reject(new Error('slow')), 1500))])
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy));
          return res;
        })
        .catch(async () => (await caches.match('/')) || fetch(req)),
    );
    return;
  }

  // Built files have a unique name per version, so the cached copy is always right.
  if (url.pathname.startsWith('/assets/') || url.pathname.startsWith('/icons/') || url.pathname.startsWith('/images/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(req, copy));
            }
            return res;
          }),
      ),
    );
  }
});

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data?.text() };
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'Zinapoya', {
      body: data.body || 'Time for your speaking practice!',
      icon: '/icons/v2/icon-192.png',
      badge: '/icons/v2/icon-192.png',
      tag: 'daily-reminder',
      data: { url: data.url || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((wins) => {
      const open = wins.find((w) => new URL(w.url).origin === self.location.origin);
      if (open) {
        open.navigate(target);
        return open.focus();
      }
      return self.clients.openWindow(target);
    }),
  );
});

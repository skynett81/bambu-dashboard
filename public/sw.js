const CACHE_NAME = 'bambu-dash-v19';
const PRECACHE = [
  '/',
  '/css/main.css',
  '/css/components.css',
  '/css/responsive.css',
  '/js/theme.js',
  '/js/i18n.js',
  '/js/state.js',
  '/js/app.js',
  '/js/interactions.js',
  '/js/components/queue-panel.js',
  '/js/components/queue-wrapper.js',
  '/js/components/scheduler-panel.js',
  '/js/components/filament-ring.js',
  '/js/components/countdown-timer.js',
  '/js/components/active-filament.js',
  '/js/components/ams-panel.js',
  '/assets/favicon.svg'
];

// Offline fallback page
const OFFLINE_HTML = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bambu Dashboard — Offline</title>
<style>
  body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0e27;color:#c8d6e5;font-family:system-ui,sans-serif}
  .offline{text-align:center;padding:2rem}
  .offline h1{font-size:1.5rem;color:#00d4ff;margin-bottom:1rem}
  .offline p{opacity:0.7;margin-bottom:1.5rem}
  .offline button{background:#00d4ff;color:#0a0e27;border:none;padding:0.6rem 1.5rem;border-radius:6px;cursor:pointer;font-weight:600}
</style></head><body>
<div class="offline">
  <h1>Bambu Dashboard</h1>
  <p>You are currently offline. Some features may be unavailable.</p>
  <button onclick="location.reload()">Retry</button>
</div>
</body></html>`;

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET, API, WebSocket, and docs requests (Docusaurus has own routing)
  if (e.request.method !== 'GET' || url.pathname.startsWith('/api/') || url.pathname.startsWith('/docs/') || url.protocol === 'ws:' || url.protocol === 'wss:') {
    return;
  }

  // Network-first for HTML (always fresh), cache-first for assets
  if (e.request.headers.get('accept')?.includes('text/html')) {
    e.respondWith(
      fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(e.request).then(cached => cached || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html' } })))
    );
  } else {
    // Stale-while-revalidate for assets
    e.respondWith(
      caches.match(e.request).then(cached => {
        const fetchPromise = fetch(e.request).then(res => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
          }
          return res;
        }).catch(() => cached);

        return cached || fetchPromise;
      })
    );
  }
});

// ---- Push Notifications ----

self.addEventListener('push', (e) => {
  if (!e.data) return;

  let payload;
  try {
    payload = e.data.json();
  } catch {
    payload = { title: 'Bambu Dashboard', body: e.data.text() };
  }

  const title = payload.title || 'Bambu Dashboard';
  const options = {
    body: payload.body || payload.message || '',
    icon: '/assets/icon-192.png',
    badge: '/assets/favicon.svg',
    tag: payload.tag || payload.event || 'general',
    data: { url: payload.url || '/', event: payload.event },
    vibrate: [200, 100, 200],
    actions: []
  };

  // Add action buttons based on event type
  if (payload.event === 'print_finished' || payload.event === 'print_failed') {
    options.actions.push({ action: 'view', title: 'View Details' });
  }
  if (payload.event === 'queue_item_completed') {
    options.actions.push({ action: 'queue', title: 'View Queue' });
  }

  e.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();

  const url = e.notification.data?.url || '/';
  let targetUrl = url;

  if (e.action === 'view') targetUrl = '/#history';
  if (e.action === 'queue') targetUrl = '/#queue';

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus existing window if available
      for (const client of windowClients) {
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          client.focus();
          client.navigate(targetUrl);
          return;
        }
      }
      // Open new window
      return clients.openWindow(targetUrl);
    })
  );
});

// ---- Background Sync ----

self.addEventListener('sync', (e) => {
  if (e.tag === 'sync-queue') {
    e.waitUntil(
      fetch('/api/queue/dispatch', { method: 'POST' }).catch(() => {})
    );
  }
});

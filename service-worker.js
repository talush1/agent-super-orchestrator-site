/* eslint-disable no-undef */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
workbox.setConfig({ debug: false });
workbox.core.setCacheNameDetails({ prefix: 'aso' });

const PRECACHE = [
  { url: 'index.html',        revision: 'v3' },
  { url: 'index-en.html',     revision: 'v1' },
  { url: 'manifest.json',     revision: 'v2' },
  { url: 'icon-192.png',      revision: 'v1' },
  { url: 'icon-512.png',      revision: 'v1' },
  { url: 'offline.html',      revision: 'v1' }
];
workbox.precaching.precacheAndRoute(PRECACHE);

const navigationHandler = new workbox.strategies.NetworkFirst({
  cacheName: 'aso-html',
  networkTimeoutSeconds: 4,
  plugins: [
    new workbox.expiration.ExpirationPlugin({ maxEntries: 50, purgeOnQuotaError: true }),
  ],
});
workbox.routing.registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      return await navigationHandler.handle({ event });
    } catch (e) {
      return caches.match('offline.html');
    }
  }
);

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'style' || request.destination === 'script',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'aso-assets',
    plugins: [
      new workbox.expiration.ExpirationPlugin({ maxEntries: 80, maxAgeSeconds: 7 * 24 * 60 * 60 })
    ]
  })
);

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'aso-images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 80,
        maxAgeSeconds: 30 * 24 * 60 * 60,
        purgeOnQuotaError: true
      })
    ]
  })
);

const bgQueue = new workbox.backgroundSync.BackgroundSyncPlugin('aso-post-queue', {
  maxRetentionTime: 24 * 60
});
workbox.routing.registerRoute(
  ({ request, url }) => request.method === 'POST' && /\/api\//.test(url.pathname),
  new workbox.strategies.NetworkOnly({ plugins: [bgQueue] }),
  'POST'
);

workbox.routing.registerRoute(
  ({ request, url }) => request.method === 'GET' && request.destination === '' && /\/api\//.test(url.pathname),
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'aso-api',
    plugins: [new workbox.expiration.ExpirationPlugin({ maxEntries: 60, maxAgeSeconds: 5 * 60 })]
  })
);

self.addEventListener('push', event => {
  try {
    const data = event.data ? event.data.json() : {};
    const title = data.title || 'Agent Super Orchestrator';
    const body = data.body || 'New update';
    const icon = data.icon || 'icon-192.png';
    const badge = data.badge || 'icon-192.png';
    const actions = data.actions || [];
    event.waitUntil(self.registration.showNotification(title, { body, icon, badge, actions }));
  } catch (e) {
    event.waitUntil(self.registration.showNotification('Agent Super Orchestrator', {
      body: event.data ? event.data.text() : 'Notification',
      icon: 'icon-192.png'
    }));
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = (event.notification && event.notification.data && event.notification.data.url) || './';
  event.waitUntil(clients.openWindow(target));
});
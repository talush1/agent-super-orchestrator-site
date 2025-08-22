/* service-worker.js (advanced) */
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');
workbox.setConfig({ debug:false });
workbox.core.setCacheNameDetails({ prefix:'aso' });

const PRECACHE=[
  {url:'index.html',revision:'v6'},
  {url:'index-en.html',revision:'v4'},
  {url:'manifest.json',revision:'v7'},
  {url:'styles.css',revision:'v1'},
  {url:'api.js',revision:'v1'},
  {url:'icon-192.png',revision:'v1'},
  {url:'icon-512-any.png',revision:'v1'},
  {url:'icon-512-maskable.png',revision:'v1'},
  {url:'offline.html',revision:'v1'}
];
workbox.precaching.precacheAndRoute(PRECACHE);

const navigationHandler = new workbox.strategies.NetworkFirst({
  cacheName:'aso-html', networkTimeoutSeconds:4,
  plugins:[new workbox.expiration.ExpirationPlugin({maxEntries:50,purgeOnQuotaError:true})]
});
workbox.routing.registerRoute(({request})=>request.mode==='navigate', async ({event})=>{
  try { return await navigationHandler.handle({event}); }
  catch(e){ return caches.match('offline.html'); }
});

workbox.routing.registerRoute(
  ({request})=>request.destination==='style'||request.destination==='script',
  new workbox.strategies.StaleWhileRevalidate({ cacheName:'aso-assets',
    plugins:[ new workbox.expiration.ExpirationPlugin({maxEntries:80,maxAgeSeconds:604800}) ]
  })
);
workbox.routing.registerRoute(
  ({request})=>request.destination==='image',
  new workbox.strategies.CacheFirst({ cacheName:'aso-images',
    plugins:[ new workbox.expiration.ExpirationPlugin({maxEntries:80,maxAgeSeconds:2592000,purgeOnQuotaError:true}) ]
  })
);

const bgQueue = new workbox.backgroundSync.BackgroundSyncPlugin('aso-post-queue',{maxRetentionTime:1440});
workbox.routing.registerRoute(
  ({request,url})=>request.method==='POST' && /\/api\//.test(url.pathname),
  new workbox.strategies.NetworkOnly({plugins:[bgQueue]}),'POST'
);
workbox.routing.registerRoute(
  ({request,url})=>request.method==='GET' && request.destination==='' && /\/api\//.test(url.pathname),
  new workbox.strategies.StaleWhileRevalidate({ cacheName:'aso-api',
    plugins:[ new workbox.expiration.ExpirationPlugin({maxEntries:60,maxAgeSeconds:300}) ]
  })
);

self.addEventListener('periodicsync',event=>{
  if(event.tag==='aso-refresh'){
    event.waitUntil((async()=>{
      try{
        await caches.open('aso-html').then(c=>c.addAll(['index.html','index-en.html']));
        await caches.open('aso-assets').then(c=>c.add('manifest.json'));
      }catch(e){}
    })());
  }
});

self.addEventListener('push',event=>{
  try{
    const data = event.data? event.data.json():{};
    const title = data.title || 'Agent Super Orchestrator';
    const body  = data.body || 'New update';
    const icon  = data.icon || 'icon-192.png';
    const badge = data.badge|| 'icon-192.png';
    const actions = data.actions || [];
    event.waitUntil(self.registration.showNotification(title,{ body, icon, badge, actions }));
  }catch(e){
    event.waitUntil(self.registration.showNotification('Agent Super Orchestrator',{ body: event.data? event.data.text():'Notification', icon:'icon-192.png' }));
  }
});
self.addEventListener('notificationclick', (event)=>{
  event.notification.close();
  const target = (event.notification && event.notification.data && event.notification.data.url) || './';
  event.waitUntil(clients.openWindow(target));
});

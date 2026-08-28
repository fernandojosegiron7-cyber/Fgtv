const CACHE='fg-ultra-v2';
const ASSETS=['./','index.html','app.css','app.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/icon-512-maskable.png','admin.html','admin.css','admin.js'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('fetch',e=>{ if(e.request.method!=='GET') return; e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||caches.match('./'))));});

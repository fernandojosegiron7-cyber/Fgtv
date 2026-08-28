const CACHE="fg-reference-v1";
const ASSETS=["./","index.html","app.css","app.js","admin.html","admin.css","admin.js","manifest.webmanifest","assets/icon-192.png","assets/icon-512.png","assets/icon-512-maskable.png","assets/logo-demo.png","assets/hero-demo.jpg"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{if(e.request.method!=="GET")return;e.respondWith(fetch(e.request).catch(()=>caches.match(e.request).then(r=>r||caches.match("./"))));});
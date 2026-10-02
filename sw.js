const CACHE="lsl-v5";
const ASSETS=["./","./index.html","./styles.css","./app.js","./manifest.json","./assets/icon.svg","./data/sample.json","./assets/mathlive/mathlive.min.js","./assets/mathlive/mathlive-fonts.css"];
self.addEventListener("install",e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener("activate",e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith("lsl-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener("fetch",e=>{
 if(e.request.method!=="GET")return;
 const url=new URL(e.request.url);
 // Firebase CDN remains network-first. If unavailable, the application itself continues
 // from the local cache and falls back to IndexedDB/offline mode.
 if(url.origin!==self.location.origin)return;
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{
   if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put(e.request,copy))}
   return res;
 }).catch(()=>e.request.mode==="navigate"?caches.match("./index.html"):Response.error())));
});

// Panel La Bomba: solo guarda la cascara de la app para abrir rapido. Los datos (Supabase) nunca se guardan.
const V='panel-v1';
const CASCARA=['./','index.html','manifest.webmanifest','icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CASCARA)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;           // Supabase y CDN: directo a la red
  if(r.mode==='navigate'){e.respondWith(fetch(r).then(x=>{const cp=x.clone();caches.open(V).then(c=>c.put('index.html',cp));return x;}).catch(()=>caches.match('index.html')));return;}
  e.respondWith(caches.match(r).then(h=>h||fetch(r)));
});

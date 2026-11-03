// Panel La Bomba: solo guarda la cascara de la app para abrir rapido. Los datos (Supabase) nunca se guardan.
const V='panel-v2';
const CASCARA=['./','index.html','manifest.webmanifest','icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CASCARA)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;           // Supabase y CDN: directo a la red
  if(r.mode==='navigate'){e.respondWith(fetch(r).then(x=>{const cp=x.clone();caches.open(V).then(c=>c.put('index.html',cp));return x;}).catch(()=>caches.match('index.html')));return;}
  e.respondWith(caches.match(r).then(h=>h||fetch(r)));
});
// Avisos push (Hacienda rechazo): el servidor manda titulo y cuerpo sin montos ni datos del cliente.
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{};}catch(x){d={cuerpo:e.data?e.data.text():''};}
  const titulo=d.titulo||'Panel La Bomba';
  e.waitUntil(self.registration.showNotification(titulo,{body:d.cuerpo||'Hay un aviso nuevo en el panel.',icon:'icon-192.png',badge:'icon-192.png',tag:d.tag||'panel',renotify:true,data:{url:d.url||'./'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const destino=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{
    for(const c of l){if(c.url.startsWith(self.registration.scope)&&'focus' in c)return c.focus();}
    return self.clients.openWindow(destino);
  }));
});

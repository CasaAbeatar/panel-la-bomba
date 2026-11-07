// Panel La Bomba: solo guarda la cascara de la app para abrir rapido. Los datos (Supabase) nunca se guardan.
const V='panel-v9';
const CASCARA=['./','index.html','panel.js','precios.js','atender.js','vendor/supabase-js-2.45.4.umd.js','manifest.webmanifest','icon-192.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CASCARA)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==location.origin)return;           // Supabase y CDN: directo a la red
  // Solo la pagina principal (y solo si respondio bien) reemplaza la copia guardada: una pagina de error o otra ruta no puede pisarla.
  if(r.mode==='navigate'){e.respondWith(fetch(r).then(x=>{if(x.ok&&x.type==='basic'&&(u.pathname==='/'||u.pathname.endsWith('/index.html'))){const cp=x.clone();caches.open(V).then(c=>c.put('index.html',cp));}return x;}).catch(()=>caches.match('index.html')));return;}
  // Los archivos de la interfaz (panel.js, precios.js, supabase-js) van primero por la red para ver los cambios; la copia solo sirve sin internet.
  e.respondWith(fetch(r).then(x=>{if(x.ok&&x.type==='basic'&&CASCARA.some(n=>u.pathname.endsWith('/'+n.replace('./','')))){const cp=x.clone();caches.open(V).then(c=>c.put(r,cp));}return x;}).catch(()=>caches.match(r)));
});
// Avisos push (Hacienda rechazo): el servidor manda titulo y cuerpo sin montos ni datos del cliente.
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{};}catch(x){d={cuerpo:e.data?e.data.text():''};}
  const titulo=d.titulo||'Panel La Bomba';
  e.waitUntil(self.registration.showNotification(titulo,{body:d.cuerpo||'Hay un aviso nuevo en el panel.',icon:'icon-192.png',badge:'icon-192.png',tag:d.tag||'panel',renotify:true,data:{url:d.url||'./'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  let destino=new URL('./',self.registration.scope).href;
  try{const d=new URL((e.notification.data&&e.notification.data.url)||'./',self.registration.scope);if(d.origin===self.location.origin)destino=d.href;}catch(x){}   // solo destinos dentro del propio panel
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(l=>{
    for(const c of l){if(c.url.startsWith(self.registration.scope)&&'focus' in c)return c.focus();}
    return self.clients.openWindow(destino);
  }));
});

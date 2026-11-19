/* ---- Salud > Computadoras: ficha del equipo y sitios visitados. SOLO CONSULTA (solo administradores: las tablas exigen es_panel()).
   Datos: public.equipos_navegacion_detalle (cada visita: hora, dirección completa, título, búsqueda), public.equipos_navegacion (resumen por día y sitio)
   y public.equipos_ficha (inventario de la computadora). Es un equipo de la empresa; lo que se ve es lo que el kit registró. Hora de Costa Rica. */
const equiposVista=(()=>{
const DIAS_OPC=[['1','Hoy'],['2','Hoy y ayer'],['7','Últimos 7 días'],['30','Últimos 30 días']];
const MAXF=1500;
let EQ=[],NMQ={},filtro={est:'todas',dias:'1',fuera:false,q:''},DET=[],RES=[],FIC=[],err=null,ocup=false,leido=null,trunc=false,verTodo=false;
const diaCR=t=>new Date(t).toLocaleDateString('en-CA',{timeZone:'America/Costa_Rica'});
const horaCR=t=>new Date(t).toLocaleTimeString('es-CR',{timeZone:'America/Costa_Rica',hour:'2-digit',minute:'2-digit',hour12:false});
const etiquetaDia=(d,hoy)=>d===hoy?'Hoy':d===addd(hoy,-1)?'Ayer':dl(d);
const nombre=e=>NMQ[e]||e;
function unir(){return `<option value="todas"${filtro.est==='todas'?' selected':''}>Todas las computadoras</option>`+EQ.map(e=>`<option value="${esc(e.estacion)}"${filtro.est===e.estacion?' selected':''}>${esc(e.nombre)}</option>`).join('');}
async function traer(forzar){
  if(ocup)return;if(!forzar&&leido&&Date.now()-leido<45000)return;ocup=true;
  try{
    const hoy=HOYCR(),desde=new Date(Date.now()-31*86400000).toISOString();
    const ids=EQ.map(e=>e.estacion);
    const [d,r,f]=await Promise.all([
      sb.from('equipos_navegacion_detalle').select('estacion,visto_en,url,titulo,sitio,busqueda,permitido').gte('visto_en',desde).order('visto_en',{ascending:false}).limit(MAXF),
      sb.from('equipos_navegacion').select('estacion,dia,sitio,veces,ultima,permitido').gte('dia',addd(hoy,-30)).order('ultima',{ascending:false}).limit(1500),
      sb.from('equipos_ficha').select('estacion,ficha,version_kit,actualizado_en,cambiado_en')]);
    if(d.error)throw d.error;if(r.error)throw r.error;if(f.error)throw f.error;
    const ok=x=>!ids.length||ids.includes(x.estacion);
    DET=(d.data||[]).filter(ok);trunc=(d.data||[]).length>=MAXF;RES=(r.data||[]).filter(ok);FIC=(f.data||[]).filter(ok);err=null;leido=Date.now();
  }catch(e){err=/no autorizado|jwt|permission/i.test(String(e&&e.message))?'Tu sesión venció. Vuelve a entrar al panel.':'No se pudo cargar la navegación y la ficha de las computadoras. Se reintenta sola cada minuto.';}
  ocup=false;pintar();
}
function enVentana(visto){const hoy=HOYCR(),n=Number(filtro.dias);return diaCR(visto)>=addd(hoy,-(n-1));}
function filas(){
  const q=filtro.q.trim().toLowerCase();
  return DET.filter(x=>(filtro.est==='todas'||x.estacion===filtro.est)&&enVentana(x.visto_en)&&(!filtro.fuera||x.permitido===false)&&(!q||[x.url,x.titulo,x.sitio,x.busqueda].some(v=>String(v||'').toLowerCase().includes(q))));
}
function bloqueNavegacion(){
  const hoy=HOYCR(),F=filas();
  const fuera=F.filter(x=>x.permitido===false),busq=F.filter(x=>x.busqueda);
  const sitios={};F.forEach(x=>{const k=x.sitio||'(sin sitio)';const s=sitios[k]||(sitios[k]={sitio:k,n:0,perm:x.permitido!==false,ult:x.visto_en});s.n++;if(x.permitido===false)s.perm=false;if(x.visto_en>s.ult)s.ult=x.visto_en;});
  const top=Object.values(sitios).sort((a,b)=>(a.perm-b.perm)||b.n-a.n).slice(0,12);
  const resumen=`<div class="eq-res"><span><b>${F.length}</b> visitas</span><span><b>${Object.keys(sitios).length}</b> sitios distintos</span><span class="${fuera.length?'eq-mal':''}"><b>${fuera.length}</b> fuera de la lista</span><span><b>${busq.length}</b> búsquedas</span></div>`;
  const tabSitios=top.length?`<table class="tb stk eq-tb"><thead><tr><th>Sitio</th><th>Visitas</th><th>Última</th><th>Lista de sitios</th></tr></thead><tbody>${top.map(s=>`<tr><td data-l="Sitio">${esc(s.sitio)}</td><td data-l="Visitas">${s.n}</td><td data-l="Última">${esc(etiquetaDia(diaCR(s.ult),hoy))}, ${horaCR(s.ult)}</td><td data-l="Lista de sitios">${s.perm?'<span class="tag par">Dentro de la lista</span>':'<span class="tag lo">Fuera de la lista</span>'}</td></tr>`).join('')}</tbody></table>`:'';
  // detalle: del más reciente al más antiguo, agrupado por día (hoy primero)
  const lim=verTodo?F.length:300,vis=F.slice(0,lim);let h='',dia='';
  vis.forEach(x=>{const d=diaCR(x.visto_en);if(d!==dia){dia=d;h+=`<div class="eq-dia">${esc(etiquetaDia(d,hoy))} <span>${esc(dia)}</span></div>`;}
    h+=`<div class="eq-f${x.permitido===false?' eq-fuera':''}" role="row"><span class="eq-h">${horaCR(x.visto_en)}</span><span class="eq-e">${esc(nombre(x.estacion))}</span><span class="eq-t">${x.permitido===false?'<span class="tag lo">Fuera de la lista</span>':'<span class="tag par">En la lista</span>'}</span><span class="eq-u"><b>${esc(x.sitio||'')}</b>${x.busqueda?`<span class="eq-b">Buscó: «${esc(x.busqueda)}»</span>`:''}${x.titulo?`<span class="eq-ti">${esc(x.titulo)}</span>`:''}<code>${esc(x.url||'')}</code></span></div>`;});
  if(!F.length)h=`<p class="note">${DET.length?'No hay visitas con estos filtros.':'Todavía no ha llegado ninguna visita. El kit v3.4 las envía cada 30 minutos desde cada computadora de caja.'}</p>`;
  if(F.length>lim)h+=`<button type="button" class="eq-mas" id="eq-mas">Mostrar las ${F.length-lim} anteriores</button>`;
  const ctl=`<div class="eq-ctl"><label>Computadora<select id="eq-est">${unir()}</select></label><label>Período<select id="eq-dias">${DIAS_OPC.map(([v,t])=>`<option value="${v}"${filtro.dias===v?' selected':''}>${t}</option>`).join('')}</select></label><label>Buscar<input id="eq-q" type="search" value="${esc(filtro.q)}" placeholder="sitio, dirección o texto" autocomplete="off"></label><label class="eq-ck"><input id="eq-fuera" type="checkbox"${filtro.fuera?' checked':''}> Solo fuera de la lista</label></div>`;
  return `<div class="g" data-c="sistema"><div class="blk"><h2>Sitios visitados en las computadoras de caja</h2>${ctl}${resumen}${tabSitios}<div class="eq-lis" role="table" aria-label="Visitas, de la más reciente a la más antigua">${h}</div><p class="note">De la visita más reciente a la más antigua, hora de Costa Rica. Se guarda la dirección completa, el título de la página y lo que se buscó, y se conserva 90 días. «Fuera de la lista» es un sitio que no está entre los de la empresa (dmalabomba.com, polloslabomba.com, sodalabomba.com, Supabase, Hacienda, escritorio remoto y Google).${trunc?' Se muestran las '+MAXF+' visitas más recientes.':''}</p></div></div>`;
}
const R=(k,v)=>v==null||v===''?'':`<div><dt>${esc(k)}</dt><dd>${esc(typeof v==='object'?JSON.stringify(v):String(v))}</dd></div>`;
const L=a=>Array.isArray(a)?a:[];
const SI=v=>v===true?'Sí':v===false?'No':v;
function plano(o,pref){if(!o||typeof o!=='object')return '';return Object.keys(o).map(k=>{const v=o[k];if(v==null||v==='')return '';if(Array.isArray(v))return v.length?`<div class="eq-l"><dt>${esc(k.replace(/_/g,' '))}</dt><dd>${v.map(x=>typeof x==='object'?esc(Object.keys(x||{}).map(c=>c+': '+SI(x[c])).join(' · ')):esc(String(x))).join('<br>')}</dd></div>`:'';
  if(typeof v==='object')return `<div class="eq-l"><dt>${esc(k.replace(/_/g,' '))}</dt><dd>${esc(Object.keys(v).map(c=>c+': '+SI(v[c])).join(' · '))}</dd></div>`;
  return `<div class="eq-l"><dt>${esc(k.replace(/_/g,' '))}</dt><dd>${esc(String(SI(v)))}</dd></div>`;}).join('');}
function tarjeta(x){
  const f=x.ficha||{},s=f.sistema||{},h=f.hardware||{},sg=f.seguridad||{},rd=f.red||{},ev=f.eventos||{},vv=f.variables||{};
  const vol=L(f.volumenes).map(v=>`${v.unidad||''} ${v.libre_gb!=null?v.libre_gb+' GB libres de '+v.gb+' GB':''}`).join(' · ');
  const wifi=rd.wifi&&rd.wifi.red?rd.wifi.red+(rd.wifi.senal_pct?' ('+rd.wifi.senal_pct+' %)':''):(L(rd.adaptadores)[0]?L(rd.adaptadores)[0].nombre:'');
  const alertas=[];
  if(sg.reinicio_pendiente===true)alertas.push('Reinicio pendiente');
  if(sg.defender_activo===false||sg.proteccion_tiempo_real===false)alertas.push('Antivirus apagado');
  if(Number(ev.apagados_inesperados_7d)>0)alertas.push(ev.apagados_inesperados_7d+' apagados inesperados en 7 días');
  if(L(f.dispositivos_con_problema).length)alertas.push(L(f.dispositivos_con_problema).length+' dispositivos con problema');
  const vis=[['Modelo',[h.fabricante,h.modelo].filter(Boolean).join(' ')],['Windows',[s.windows,s.version].filter(Boolean).join(' ')],['Procesador',h.procesador],['Memoria',h.ram_gb!=null?h.ram_gb+' GB':''],['Discos',vol],['Red',wifi],['Antivirus',sg.defender_activo==null?'':SI(sg.defender_activo)+(sg.firmas_edad_dias!=null?' · firmas de hace '+sg.firmas_edad_dias+' días':'')],['Encendida desde',s.ultimo_arranque?sHora(s.ultimo_arranque):''],['Errores del sistema (24 h)',ev.errores_sistema_24h],['Ficha enviada',x.actualizado_en?sHace(x.actualizado_en):''],['Última vez que cambió',x.cambiado_en?sHace(x.cambiado_en):''],['Versión del kit',x.version_kit]];
  const sec=[['Sistema',f.sistema],['Hardware',f.hardware],['Discos físicos',f.discos_fisicos],['Volúmenes',f.volumenes],['Pantallas',f.pantallas_windows],['Monitores',f.monitores],['Pantalla táctil',f.tacto],['Impresoras',f.impresoras],['Cola de impresión',f.cola_impresion],['Dispositivos USB',f.usb_conectados],['Dispositivos con problema',f.dispositivos_con_problema],['Red',f.red],['Seguridad',f.seguridad],['Software',f.software],['Eventos',f.eventos],['Encendidos y fallos',f.encendidos_y_fallos],['Servicios',f.servicios],['Arranque de Windows',f.arranque_de_windows],['Tareas programadas ajenas a Microsoft',f.tareas_programadas_no_microsoft],['Energía',f.energia],['Kit',f.kit],['Estado al momento de la ficha',vv]];
  return `<div class="eq-card"><div class="eq-ct"><b>${esc(nombre(x.estacion))}</b>${alertas.map(a=>`<span class="tag lo">${esc(a)}</span>`).join('')}</div><dl class="eq-dl">${vis.map(([k,v])=>R(k,v)).join('')}</dl><details><summary>Ver toda la ficha</summary>${sec.map(([t,v])=>{const c=Array.isArray(v)?v.map((o,i)=>`<div class="eq-sub">${plano(typeof o==='object'?o:{valor:o})}</div>`).join(''):plano(v);return c?`<h3>${esc(t)}</h3><dl class="eq-dl eq-full">${c}</dl>`:'';}).join('')}</details></div>`;
}
function bloqueFichas(){
  const lista=EQ.map(e=>FIC.find(x=>x.estacion===e.estacion)||{estacion:e.estacion,ficha:null}).filter(x=>filtro.est==='todas'||x.estacion===filtro.est);
  const cuerpo=lista.map(x=>x.ficha?tarjeta(x):`<div class="eq-card"><div class="eq-ct"><b>${esc(nombre(x.estacion))}</b><span class="tag par">Sin ficha todavía</span></div><p class="note">Esta computadora aún no ha enviado su ficha. La envía el kit v3.4 al arrancar y cada 6 horas.</p></div>`).join('');
  return `<div class="g" data-c="sistema"><div class="blk"><h2>Ficha de cada computadora de caja</h2>${cuerpo||'<p class="note">No hay computadoras de caja registradas.</p>'}<p class="note">Inventario de solo lectura que envía el kit: equipo, Windows, discos, pantallas, impresoras, red, seguridad, software y errores recientes.</p></div></div>`;
}
function pintar(){
  const box=document.getElementById('sal-equipos');if(!box)return;
  const activo=document.activeElement&&document.activeElement.id;
  const aviso=err?`<p class="note" role="status" style="color:var(--bad)">${esc(err)}</p>`:'';
  box.innerHTML=aviso+bloqueNavegacion()+bloqueFichas();
  const enl=(id,fn,ev)=>{const e=document.getElementById(id);if(e)e.addEventListener(ev||'change',fn);};
  enl('eq-est',e=>{filtro.est=e.target.value;verTodo=false;pintar();});enl('eq-dias',e=>{filtro.dias=e.target.value;verTodo=false;pintar();});
  enl('eq-fuera',e=>{filtro.fuera=e.target.checked;verTodo=false;pintar();});
  enl('eq-q',e=>{filtro.q=e.target.value;verTodo=false;pintar();},'input');
  enl('eq-mas',()=>{verTodo=true;pintar();},'click');
  if(activo&&/^eq-/.test(activo)){const a=document.getElementById(activo);if(a&&a.focus){a.focus();if(activo==='eq-q'){const n=a.value.length;try{a.setSelectionRange(n,n);}catch(_){}}}}
}
function ver(eqs,nm,forzar){
  if(eqs){EQ=eqs;}if(nm){NMQ={};EQ.forEach(e=>NMQ[e.estacion]=e.nombre);}
  if(!document.getElementById('sal-equipos'))return;
  if(!EQ.length){pintar();return;}
  traer(forzar);
}
return {ver,pintar};
})();

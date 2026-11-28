/* ---- Salud: subpestañas Resumen, Sistemas, Computadoras, Facturación y Alertas (19 nov 2026). SOLO CONSULTA.
   Datos: lo que ya entrega panel_salud, panel_punto_de_caida y panel_atender_lista (todas con es_panel()), más panel_alertas_historial
   cuando la base de datos la tenga (historial de todas las alertas y por qué canal salió cada una). Sin esa función, la pestaña Alertas
   muestra lo que el panel ya lee y lo dice. Hora de Costa Rica. Todo texto externo se escapa con esc(). */
const saludVista=(()=>{
const SUBS=[['resumen','Resumen'],['sistemas','Sistemas'],['computadoras','Computadoras'],['facturacion','Facturación'],['alertas','Alertas']];
const NEG={soda:'Soda La Bomba',pollos:'Pollos La Bomba y Papea',grupo:''};
const LINK_FACT='https://facturacion.dmalabomba.com/';
const CANAL={correo:'Por correo',resumen:'Resumen diario',panel:'Solo panel'};
const DIAS_OPC=[['1','Hoy'],['2','Hoy y ayer'],['7','Últimos 7 días'],['30','Últimos 30 días']];
let SUB='resumen',C=null,F={tipo:'todos',estado:'todas',dias:'1',canal:'todos',max:120};
let HIST,HIST_T=0,HIST_NO=0,HIST_OCUP=false;   // HIST: undefined sin cargar, null no disponible, array con filas
const diaCR=t=>new Date(t).toLocaleDateString('en-CA',{timeZone:'America/Costa_Rica'});
const horaCR=t=>new Date(t).toLocaleTimeString('es-CR',{timeZone:'America/Costa_Rica',hour:'2-digit',minute:'2-digit',hour12:false});
const etDia=(d,hoy)=>d===hoy?'Hoy':d===addd(hoy,-1)?'Ayer':dl(d);
const plural=(n,a,b)=>n===1?'1 '+a:n+' '+b;
const verFact=h=>LINK_FACT+(h&&/^[#a-z0-9\/_-]*$/i.test(h)?h:'');

/* ---- lo que requiere atención, por área ---- */
function pendientes(c){
  const L=[],d=c.d,AH=c.AH,NM=c.NM;
  const add=(area,nivel,t,det,x)=>L.push(Object.assign({area,nivel,t,det:det||''},x||{}));
  if(d.vigilancia_detenida)add('sistemas','urgente','La vigilancia automática no se ha ejecutado','Última revisión '+sHace(d.ultima_revision)+'. Lo que se ve puede estar desactualizado.');
  Object.keys(AH).forEach(k=>{
    if(!c.visibles(k))return;const a=AH[k];if(a.estado!=='caido'&&a.estado!=='aviso')return;
    add(k.startsWith('equipo:')?'computadoras':'sistemas',a.estado==='caido'?'urgente':'revisar',(NM[k]||k)+(a.estado==='caido'?': sin respuesta':': con avisos'),a.detalle);
  });
  const bz=(typeof BZ!=='undefined'&&BZ)?BZ[EMP]:null;
  if(bz&&bz.estado==='error')add('sistemas','revisar','No se pudo revisar los buzones','La revisión se repite sola.');
  else if(bz&&bz.estado==='falta'){const f=Number(bz.faltan||0);add('sistemas','revisar',f===1?'Falta 1 factura en el control de buzones':'Faltan '+f+' facturas en el control de buzones','');}
  (c.viv||[]).forEach(v=>{
    const n=Number(v.n||0),emp=NEG[v.empresa]||'';
    const det=(emp?emp+' · ':'')+plural(n,'caso','casos');
    add(String(v.clave).startsWith('respaldo')?'sistemas':'facturacion',v.urgente?'urgente':'revisar',v.etiqueta,det,{n,emp});
  });
  const o={urgente:0,revisar:1};L.sort((a,b)=>o[a.nivel]-o[b.nivel]);
  return L;
}
const estDe=l=>l.some(i=>i.nivel==='urgente')?'caido':l.length?'aviso':'ok';
const fraseDe=l=>{const u=l.filter(i=>i.nivel==='urgente').length,r=l.length-u;
  if(!l.length)return 'Todo bien';
  return [u?(u===1?'1 urgente':u+' urgentes'):'',r?(r===1?'1 por revisar':r+' por revisar'):''].filter(Boolean).join(' y ');};
const fila=it=>`<div class="ss-i"><i class="e-${it.nivel==='urgente'?'caido':'aviso'}"></i><div><b>${esc(it.t)}</b>${it.det?`<span>${esc(it.det)}</span>`:''}</div><em class="${it.nivel==='urgente'?'ss-urg':'ss-rev'}">${it.nivel==='urgente'?'Urgente':'Por revisar'}</em></div>`;

/* ---- hechos de hoy (incidentes y eventos; con el historial, todas las alertas) ---- */
function hechos(c){
  const out=[];
  (c.d.incidentes||[]).filter(i=>c.visibles(i.componente)).forEach(i=>out.push({ts:i.detectado_en,t:'Se detectó un problema en '+(c.NM[i.componente]||i.componente),tipoK:'servicio',tipoN:'Servicios y sistemas',estado:i.resuelto_en?'atendida':'abierta',urg:true,canal:null}));
  (c.d.eventos||[]).filter(v=>c.visibles('equipo:'+v.estacion)).forEach(v=>out.push({ts:v.creado_en,t:(SALUD_EV[v.tipo]||v.tipo)+' · '+(c.NM['equipo:'+v.estacion]||v.estacion)+(v.detalle?' · '+v.detalle:''),tipoK:'equipo',tipoN:'Computadoras de caja',estado:'aviso',urg:false,canal:null}));
  return out;
}
function filasHist(c){
  return (HIST||[]).filter(a=>!a.es_prueba&&(EMP==='grupo'||!a.empresa||(EMP==='pollos'&&/Pollos/i.test(a.empresa))||(EMP==='soda'&&/Soda/i.test(a.empresa)))).map(a=>({ts:a.creada_en,t:a.titulo,tipoK:a.tipo,tipoN:a.nombre_tipo||String(a.tipo).replace(/_/g,' '),estado:a.estado,urg:a.severidad==='urgente',canal:a.canal||(a.correo_estado?'correo':'panel'),conf:a.correo_estado==='sin_confirmar'}));
}
const todasFilas=c=>HIST?filasHist(c):hechos(c);

/* ---- RESUMEN ---- */
function bloqueArea(area,titulo,items,vacio){
  return `<div class="blk" data-c="sistema"><h2>${titulo}</h2><div class="ss-h"><i class="e-${estDe(items)}"></i><b>${fraseDe(items)}</b>${items.length?`<button type="button" class="ss-go" data-ss="${area}">Ver en ${titulo}</button>`:''}</div>${items.length?items.map(fila).join(''):`<p class="note">${vacio}</p>`}</div>`;
}
function htmlResumen(c){
  const L=c.pend,hoy=HOYCR(),est=estDe(L);
  const u=L.filter(i=>i.nivel==='urgente').length;
  const tit=!L.length?'Todo bien':u?(u===1?'Hay 1 asunto urgente':'Hay '+u+' asuntos urgentes')+(L.length>u?' y '+(L.length-u===1?'1 por revisar':(L.length-u)+' por revisar'):''):(L.length===1?'Hay 1 asunto por revisar':'Hay '+L.length+' asuntos por revisar');
  let h=`<div class="dayl">Hoy · <b>${esc(sHora(c.d.hora))}</b></div><div class="sb"><i class="e-${est}"></i><b>${esc(tit)}</b><span>${L.length?'Lo que requiere atención está abajo, por área.':'Nada requiere atención ahora. Última revisión '+esc(sHace(c.d.ultima_revision))+'.'}</span></div>`;
  h+=bloqueArea('sistemas','Sistemas',L.filter(i=>i.area==='sistemas'),'Los servicios, las tareas automáticas, las copias y los respaldos están bien.');
  h+=bloqueArea('computadoras','Computadoras',L.filter(i=>i.area==='computadoras'),'Las computadoras de caja están reportando con normalidad.');
  h+=bloqueArea('facturacion','Facturación',L.filter(i=>i.area==='facturacion'),c.av?'Sin alertas de Hacienda, recepción ni inventario abiertas.':'No se pudo leer la bandeja de facturación ahora.');
  const hoyF=todasFilas(c).filter(f=>diaCR(f.ts)===hoy).sort((a,b)=>new Date(b.ts)-new Date(a.ts));
  h+=`<div class="blk" data-c="sistema"><h2>Lo que pasó hoy</h2>`;
  if(HIST){
    const n=hoyF.length,cc=k=>hoyF.filter(f=>f.canal===k).length;
    h+=`<div class="eq-res"><span><b>${n}</b>${n===1?'alerta':'alertas'}</span><span><b>${cc('correo')}</b>por correo</span><span><b>${cc('resumen')}</b>en el resumen diario</span><span><b>${cc('panel')}</b>solo en el panel</span></div>`;
  }
  h+=hoyF.length?hoyF.slice(0,8).map(f=>`<div class="ss-e"><span class="ss-h2">${esc(horaCR(f.ts))}</span><span>${esc(f.t)}</span></div>`).join(''):'<p class="note">Hoy no ha pasado nada que dejara aviso.</p>';
  h+=(hoyF.length>8?`<p class="note">Hay ${hoyF.length-8} más hoy.</p>`:'')+`<div class="ss-btns"><button type="button" class="ss-go" data-ss="alertas">Ver todas las alertas</button></div></div>`;
  return h;
}

/* ---- FACTURACIÓN ---- */
function htmlFacturacion(c){
  const L=c.pend.filter(i=>i.area==='facturacion'),est=estDe(L);
  let h=`<div class="dayl">Hoy · <b>${esc(sHora(c.d.hora))}</b></div><div class="sb"><i class="e-${est}"></i><b>${L.length?esc(fraseDe(L)):'Todo bien con Hacienda y la facturación'}</b><span>${c.av?'Alertas de Hacienda, recepción de facturas e inventario.':'No se pudo leer la bandeja ahora.'}</span></div>`;
  if(!c.av)h+=`<p class="note" role="status">No se pudieron leer las alertas de facturación. Se reintenta sola cada minuto.</p>`;
  h+=`<div class="blk" data-c="sistema"><h2>Por atender en facturación</h2>`+(L.length?`<div class="ss-th"><span></span><span>Qué pasa</span><span class="ss-r">Casos</span><span>Estado</span></div>`+L.map(i=>{return `<div class="ss-f"><i class="e-${i.nivel==='urgente'?'caido':'aviso'}"></i><div><b>${esc(i.t)}</b>${i.emp?`<span>${esc(i.emp)}</span>`:''}</div><span class="ss-r ss-n">${i.n!=null?esc(String(i.n)):'—'}</span><em class="${i.nivel==='urgente'?'ss-urg':'ss-rev'}">${i.nivel==='urgente'?'Urgente':'Por revisar'}</em></div>`;}).join(''):'<p class="note">No hay nada abierto. Cuando llegue un rechazo de Hacienda, un plazo por vencer o una factura de proveedor con diferencias, aparece aquí.</p>');
  h+=`<div class="ss-btns"><a class="ss-go" href="${esc(verFact('#admin/alertas-hacienda'))}" target="_blank" rel="noopener">Atender en el facturador</a></div><p class="note">Atender un caso exige anotar qué se hizo, y eso se hace en la bandeja del facturador. Desde el panel solo se consulta.</p></div>`;
  h+=c.hFac||'';
  return h;
}

/* ---- COMPUTADORAS ---- */
function htmlComputadoras(c){
  const L=c.pend.filter(i=>i.area==='computadoras'),est=estDe(L);
  const sd=Object.keys(c.AH).filter(k=>k.startsWith('equipo:')&&c.visibles(k)&&c.AH[k].estado==='sin_datos');
  let h=`<div class="dayl">Hoy · <b>${esc(sHora(c.d.hora))}</b></div><div class="sb"><i class="e-${est}"></i><b>${L.length?esc(fraseDe(L)):'Las computadoras de caja reportan con normalidad'}</b><span>${sd.length?esc(plural(sd.length,'computadora todavía sin kit instalado','computadoras todavía sin kit instalado'))+'.':'Última revisión '+esc(sHace(c.d.ultima_revision))+'.'}</span></div>`;
  return h+(typeof controlVista!=='undefined'?controlVista.todo():'')+c.hEq;
}

/* ---- ALERTAS ---- */
function htmlAlertas(c){
  const hoy=HOYCR();let rows=todasFilas(c);
  const tipos=[...new Map(rows.map(r=>[r.tipoK,r.tipoN])).entries()].sort((a,b)=>a[1].localeCompare(b[1],'es'));
  const n=Number(F.dias),desde=addd(hoy,-(n-1));
  rows=rows.filter(r=>diaCR(r.ts)>=desde&&(F.tipo==='todos'||r.tipoK===F.tipo)&&(F.estado==='todas'||(F.estado==='abiertas'?(r.estado==='abierta'||r.estado==='aviso'):(r.estado==='atendida'||r.estado==='cerrada')))&&(F.canal==='todos'||r.canal===F.canal)).sort((a,b)=>new Date(b.ts)-new Date(a.ts));
  const abiertasAhora=(F.estado!=='atendidas'&&F.tipo==='todos'&&F.canal==='todos'&&!HIST)?c.pend.filter(i=>i.area==='facturacion'||(i.area==='sistemas'&&/respaldo/i.test(i.t))):[];
  const op=(v,t,s)=>`<option value="${esc(v)}"${s===v?' selected':''}>${esc(t)}</option>`;
  let h=`<div class="dayl">Hoy · <b>${esc(sHora(c.d.hora))}</b></div>`;
  h+=`<div class="eq-ctl" id="al-ctl"><label>Período<select data-f="dias">${DIAS_OPC.map(([v,t])=>op(v,t,F.dias)).join('')}</select></label>`
    +`<label>Tipo de alerta<select data-f="tipo">${op('todos','Todos los tipos',F.tipo)}${tipos.map(([k,t])=>op(k,t,F.tipo)).join('')}</select></label>`
    +`<label>Estado<select data-f="estado">${op('todas','Todas',F.estado)}${op('abiertas','Abiertas',F.estado)}${op('atendidas','Atendidas',F.estado)}</select></label>`
    +`<label>Por dónde salió<select data-f="canal"${HIST?'':' disabled'}>${op('todos','Todos los canales',F.canal)}${op('correo','Por correo',F.canal)}${op('resumen','Resumen diario',F.canal)}${op('panel','Solo panel',F.canal)}</select></label></div>`;
  if(HIST){const cc=k=>rows.filter(r=>r.canal===k).length;h+=`<div class="eq-res"><span><b>${rows.length}</b>${rows.length===1?'alerta':'alertas'}</span><span><b>${cc('correo')}</b>por correo</span><span><b>${cc('resumen')}</b>en el resumen diario</span><span><b>${cc('panel')}</b>solo en el panel</span></div>`;}
  else h+=`<p class="note" role="status">Por ahora se muestran las alertas que el panel ya lee: problemas de los sistemas, eventos de las cajas y lo abierto en facturación. El historial completo, con el canal por el que salió cada una (correo, resumen diario o solo panel), se mostrará aquí en cuanto la base de datos entregue esa lectura.</p>`;
  if(abiertasAhora.length)h+=`<div class="eq-dia">Abiertas ahora<span>${abiertasAhora.length}</span></div>`+abiertasAhora.map(i=>`<div class="ss-a"><span class="ss-h2">Ahora</span><div><b>${esc(i.t)}</b>${i.det?`<span>${esc(i.det)}</span>`:''}</div><em class="${i.nivel==='urgente'?'ss-urg':'ss-rev'}">${i.nivel==='urgente'?'Urgente':'Por revisar'}</em><span class="ss-c">Panel</span></div>`).join('');
  if(!rows.length&&!abiertasAhora.length)h+=`<div class="blk" data-c="sistema"><p class="note">No hay alertas con estos filtros.</p></div>`;
  const vis=rows.slice(0,F.max);let dia='';
  vis.forEach(r=>{
    const d=diaCR(r.ts);if(d!==dia){dia=d;h+=`<div class="eq-dia">${esc(etDia(d,hoy))}<span>${esc(dl(d))}</span></div>`;}
    const est=r.estado==='abierta'?['Abierta','ss-rev']:r.estado==='atendida'?['Atendida','ss-ok']:r.estado==='cerrada'?['Cerrada','ss-ok']:['Aviso','ss-rev'];
    const can=r.canal?(CANAL[r.canal]||r.canal)+(r.conf?' (sin confirmar)':''):'Panel';
    h+=`<div class="ss-a${r.urg?' ss-au':''}"><span class="ss-h2">${esc(horaCR(r.ts))}</span><div><b>${esc(r.t)}</b><span>${esc(r.tipoN)}</span></div><em class="${est[1]}">${est[0]}</em><span class="ss-c">${esc(can)}</span></div>`;
  });
  if(rows.length>vis.length)h+=`<div class="ss-btns"><button type="button" class="ss-go" data-mas="1">Mostrar más (${rows.length-vis.length} restantes)</button></div>`;
  return h;
}

/* ---- historial de alertas (solo si la base de datos ya tiene la lectura) ---- */
async function traerHist(){
  const t=Date.now();if(HIST_OCUP)return;
  if(HIST===null&&t-HIST_NO<600000)return;
  if(Array.isArray(HIST)&&t-HIST_T<(SUB==='alertas'?55000:290000))return;
  HIST_OCUP=true;
  try{
    const {data,error}=await sb.rpc('panel_alertas_historial',{p_dias:30});
    if(error){if(/PGRST202|Could not find|does not exist|404/i.test((error.code||'')+' '+(error.message||''))){HIST=null;HIST_NO=t;}}
    else if(data&&Array.isArray(data.items)){HIST=data.items;HIST_T=t;}
  }catch(e){}
  HIST_OCUP=false;
}

/* ---- pintado ---- */
function botones(){
  const cnt=a=>C?C.pend.filter(i=>i.area===a).length:0;
  const est=a=>C?estDe(C.pend.filter(i=>i.area===a)):'sin_datos';
  const hoy=HOYCR();const nAl=C?todasFilas(C).filter(f=>diaCR(f.ts)===hoy).length:0;
  return SUBS.map(([k,t])=>{
    let dot,n=0;
    if(k==='resumen'){dot=C?estDe(C.pend):'sin_datos';n=C?C.pend.length:0;}
    else if(k==='alertas'){dot='sin_datos';n=nAl;}
    else{dot=est(k);n=cnt(k);}
    return `<button type="button" role="tab" aria-selected="${k===SUB}" data-ss="${k}"><i class="e-${dot}"></i>${t}${n?`<small>${n}</small>`:''}</button>`;
  }).join('');
}
function mostrar(){
  SUBS.forEach(([k])=>{const e=$('ss-'+k);if(e)e.hidden=k!==SUB;});
  const b=$('ss-botones');if(b)b.innerHTML=botones();
}
function pintar(){
  if(!C)return;
  const set=(id,h)=>{const e=$(id);if(e)e.innerHTML=h;};
  set('ss-resumen',htmlResumen(C));set('ss-facturacion',htmlFacturacion(C));set('ss-alertas',htmlAlertas(C));
  set('sal-eqtabla',htmlComputadoras(C));
  mostrar();
}
function irA(k){
  if(!SUBS.some(s=>s[0]===k))return;SUB=k;mostrar();
  if(k==='alertas'&&C){traerHist().then(()=>{if(SUB==='alertas')pintar();});}
  window.scrollTo(0,0);
}
async function ver(c){
  c.pend=pendientes(c);C=c;
  $('sal-base').innerHTML=c.hSis;
  const a=$('sal-aviso');if(a)a.innerHTML='';
  await traerHist();
  pintar();
  if(typeof equiposVista!=='undefined')equiposVista.ver(c.eqs,true);
}
function error(msg,t){
  const a=$('sal-aviso');
  if(C){if(a)a.innerHTML='<p class="note" role="status" style="color:var(--bad)">'+esc(msg)+' Lo que se ve abajo es de '+esc(sHace(t))+'.</p>';}
  else{if(a)a.innerHTML='<div class="blk" data-c="sistema"><h2>No se pudo cargar la salud de los sistemas</h2><p class="note">'+esc(msg)+'</p></div>';}
}
function entrar(){SUB='resumen';F={tipo:'todos',estado:'todas',dias:'1',canal:'todos',max:120};mostrar();}

document.addEventListener('click',e=>{
  const b=e.target.closest&&e.target.closest('#sec-salud [data-ss]');
  if(b){e.preventDefault();irA(b.dataset.ss);return;}
  const m=e.target.closest&&e.target.closest('#sec-salud [data-mas]');
  if(m){F.max+=120;pintar();}
});
document.addEventListener('change',e=>{
  const s=e.target.closest&&e.target.closest('#al-ctl select');if(!s)return;
  F[s.dataset.f]=s.value;F.max=120;pintar();
  const x=document.querySelector('#al-ctl select[data-f="'+s.dataset.f+'"]');if(x)x.focus();
});
return {ver,irA,entrar,error,pintar};
})();

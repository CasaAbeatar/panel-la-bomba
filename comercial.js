/* ---- Comercial: ventas por hora/día/local, ticket, productos pedidos juntos, clientes que repiten (datos del facturador, montos SIN IVA) ---- */
const comercial=(()=>{
const DOW=['','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],DS=['','Lun','Mar','Mié','Jue','Vie','Sáb','Dom'];   // dow ISO: 1 lunes … 7 domingo
const LOC={soda:'Soda La Bomba',pollos:'Pollos La Bomba'};
const R=n=>'₡'+fmt(n),P=n=>Math.round(num(n)*100)+' %',D1=n=>num(n).toFixed(2).replace('.',',');
let S={dias:30,pruebas:false},D=null,PA=null,CL=null,ocup=false,err=null,llave='';
function desde(){const d=new Date(hoyCR()+'T12:00:00');d.setDate(d.getDate()-S.dias);return d.toLocaleDateString('en-CA');}
async function traer(){
  const k=EMP+'|'+S.dias+'|'+S.pruebas;if(ocup||k===llave)return;ocup=true;
  const a={p_emp:EMP,p_desde:desde(),p_hasta:hoyCR(),p_pruebas:S.pruebas};
  try{
    const [r,p,c]=await Promise.all([sb.rpc('panel_comercial_resumen',a),sb.rpc('panel_comercial_pares',{...a,p_min:3}),sb.rpc('panel_comercial_clientes',a)]);
    if(r.error||p.error||c.error)throw (r.error||p.error||c.error);
    D=r.data;PA=p.data;CL=c.data;err=null;llave=k;
  }catch(e){err='No se pudieron cargar los datos comerciales. Toque «Actualizar» para intentarlo otra vez.';}
  ocup=false;pintar();
}
function ctl(){
  return `<div class="cm-ctl"><div class="cm-seg" role="group" aria-label="Período">${[7,30,90].map(n=>`<button type="button" data-d="${n}" aria-pressed="${S.dias===n}">${n} días</button>`).join('')}</div>
  <label class="cm-sw"><input type="checkbox" id="cm-pr" ${S.pruebas?'checked':''}> Incluir ventas de prueba</label><button type="button" class="out" id="cm-ref">Actualizar</button></div>`;
}
function aviso(){
  if(!D)return'';
  const pr=D.pruebas?`Se están contando ${fmt(D.n_ventas)} ventas <b>incluyendo las de prueba</b>.`:`Se excluyeron ${fmt(D.pruebas_excluidas||0)} ventas de prueba (se pueden incluir arriba).`;
  return `<div class="cm-av"><b>Muestra pequeña.</b> El facturador registra ventas solo desde ${D.primera_venta?fl(D.primera_venta):'hace muy poco'}${D.dias?` (${D.dias} día${D.dias>1?'s':''} con historial en este período)`:''}. Con tan pocos datos los promedios y las comparaciones cambian mucho de un día a otro; tómelos como una primera idea, no como una tendencia. ${pr} Todos los montos son <b>sin IVA</b>.</div>`;
}
function hoy(){
  const h=D.hoy||{n:0,total:0,ticket:0,por_hora:[]},dw=new Date((h.dia||hoyCR())+'T12:00:00').getDay()||7;
  const w=(D.por_dow||[]).find(x=>x.dow===dw),pm=w?num(w.prom_dia):0,tk=(D.ticket_dow||[]).find(x=>x.dow===dw);
  const dif=pm?Math.round((num(h.total)/pm-1)*100):null;
  const ph=h.por_hora||[];let a=ph.findIndex(x=>x.n>0),b=ph.length-1-[...ph].reverse().findIndex(x=>x.n>0);
  const rango=a<0?'':barsAx(ph.slice(a,b+1).map(x=>num(x.total)),ph.slice(a,b+1).map(x=>x.h+' h'),cc,false);
  return `<div class="dayl">Hoy · <b>${fl(h.dia||hoyCR())}</b></div>`+kpis([
    {l:'Ventas hoy (sin IVA)',v:R(h.total),s:dif===null?'Sin otros '+DOW[dw].toLowerCase()+' para comparar':`${dif>=0?'+':''}${dif} % frente al promedio de los ${DOW[dw].toLowerCase()} (${R(pm)})`},
    {l:'Ventas hoy',v:fmt(h.n),s:w?`Promedio ${DOW[dw].toLowerCase()}: ${D1(num(w.n)/Math.max(1,w.ndias))} por día`:''},
    {l:'Ticket promedio hoy',v:h.n?R(h.ticket):'—',s:tk?'Promedio de los '+DOW[dw].toLowerCase()+': '+R(tk.prom):''},
    {l:'Período',v:S.dias+' días',s:'Desde '+fl(D.desde)}])+
    (rango?`<div class="blk"><h2>Ventas de hoy por hora</h2>${rango}<p class="note">Eje horizontal: hora del día. Eje vertical: ventas en colones, sin IVA.</p></div>`:`<div class="blk"><h2>Ventas de hoy por hora</h2><p class="note">Todavía no hay ventas hoy.</p></div>`);
}
function horas(){
  const ph=D.por_hora||[];let a=ph.findIndex(x=>x.n>0),b=ph.length-1-[...ph].reverse().findIndex(x=>x.n>0);if(a<0)return'';
  const s=ph.slice(a,b+1);
  return cols('Ventas por hora · promedio por día',s.map(x=>num(x.prom_dia)),s.map(x=>x.h+' h'),'Eje horizontal: hora del día. Eje vertical: promedio por día en colones, sin IVA. Los días sin ventas cuentan como cero.',0,cc)+
  table('Detalle por hora',['Hora','Ventas','Promedio por día','Desv. est.','Variación'],s.map(x=>[x.h+':00',fmt(x.n),R(x.prom_dia),R(x.sd),D1(x.cv)]),true)+
  `<p class="note">«Variación» es el coeficiente de variación (desviación estándar entre el promedio): cerca de 0 la hora es estable; sobre 1 cambia muchísimo de un día a otro.</p>`;
}
function dias(){
  const w=D.por_dow||[],m=Array.from({length:8},(_,i)=>w.find(x=>x.dow===i)||{dow:i,n:0,ndias:0,total:0,prom_dia:0,sd:0,cv:0}),o=[1,2,3,4,5,6,7].map(i=>m[i]);
  const pd=(D.por_dia||[]).map(x=>num(x.total));
  return cols('Ventas por día de la semana · promedio',o.map(x=>num(x.prom_dia)),o.map(x=>DS[x.dow]),'Eje horizontal: día de la semana. Eje vertical: promedio por día en colones, sin IVA.',0,cc,true)+
  table('Detalle por día de la semana',['Día','Días con dato','Ventas','Promedio por día','Desv. est.','Variación'],o.map(x=>[DOW[x.dow],fmt(x.ndias),fmt(x.n),R(x.prom_dia),x.ndias>1?R(x.sd):'—',x.ndias>1?D1(x.cv):'—']),true)+
  (pd.length>1?`<div class="blk"><h2>Ventas por día</h2>${lineAx(pd,dlabs((D.por_dia||[]).map(x=>D10(x.dia))),cc)}<p class="note">Eje horizontal: fecha. Eje vertical: ventas del día en colones, sin IVA.</p></div>`:'');
}
function locales(){
  const l=D.por_local||[];if(!l.length)return'';
  return table('Soda y Pollos',['Local','Ventas','Total sin IVA','Ticket promedio','Promedio por día'],l.map(x=>[LOC[x.soc]||x.soc,fmt(x.n),R(x.total),R(x.ticket),R(x.prom_dia)]),true)+(EMP==='grupo'?'':`<p class="note">Para compararlos lado a lado, elija «Grupo» arriba.</p>`);
}
function ticket(){
  const t=D.ticket||{};if(!t.n)return'';
  const th=(D.ticket_hora||[]).filter(x=>x.n>0),td=[1,2,3,4,5,6,7].map(i=>(D.ticket_dow||[]).find(x=>x.dow===i)||{dow:i,prom:0,n:0});
  return kpis([{l:'Ticket promedio (sin IVA)',v:R(t.prom),s:`${fmt(t.n)} ventas`},{l:'Mediana',v:R(t.mediana),s:'La mitad de las ventas es menor'},{l:'Desv. estándar',v:R(t.sd),s:'Qué tanto se aleja cada venta'},{l:'Variación',v:D1(t.cv),s:'Desv. est. entre promedio'}])+
  cols('Ticket promedio por día de la semana',td.map(x=>num(x.prom)),td.map(x=>DS[x.dow]),'Eje horizontal: día. Eje vertical: colones por venta, sin IVA.',0,cc,true)+
  (th.length?cols('Ticket promedio por hora',th.map(x=>num(x.prom)),th.map(x=>x.h+' h'),'Eje horizontal: hora. Eje vertical: colones por venta, sin IVA. Las horas con una sola venta pesan poco.',0,cc):'');
}
function pares(){
  if(!PA||!PA.n_ventas)return'';
  const p=PA.pares||[];
  return `<div class="blk"><h2>Productos que se piden juntos</h2><p class="note" style="margin-top:12px">Se revisaron ${fmt(PA.n_ventas)} ventas; ${fmt(PA.n_ventas_varios||0)} tenían más de un producto.</p>`+
  (p.length?`<table class="tb stk"><thead><tr>${['Producto A','Producto B','Veces juntos','% de las ventas','Si piden A, piden B','Si piden B, piden A','Lift'].map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${p.map(x=>`<tr>${[esc(x.a),esc(x.b),fmt(x.n),P(x.soporte),P(x.conf_ab),P(x.conf_ba),D1(x.lift)].map((c,j)=>`<td data-l="${['Producto A','Producto B','Veces juntos','% de las ventas','Si piden A, piden B','Si piden B, piden A','Lift'][j]}">${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`:`<p class="note">Todavía ningún par se repite las veces suficientes (mínimo 3) para mostrarse.</p>`)+
  `<p class="note">Lift mayor a 1 significa que se piden juntos más de lo que daría el azar; alrededor de 1, no hay relación. Con pocas ventas un lift alto puede ser casualidad.</p>`+
  ((PA.top||[]).length?bars('Lo más pedido (veces en una venta)',PA.top.map(x=>[x.nombre,x.n]),fmt):'')+`</div>`;
}
function clientes(){
  if(!CL||!CL.clientes)return `<div class="blk"><h2>Clientes que repiten</h2><p class="note" style="margin-top:12px">Todavía no hay compras con cliente identificado en este período.</p></div>`;
  const f=CL.frecuencia||{},r=CL.recencia||{};
  return `<div class="blk"><h2>Clientes que repiten</h2></div>`+kpis([
    {l:'Clientes identificados',v:fmt(CL.clientes),s:`${fmt(CL.n_ventas_identificadas)} de ${fmt(CL.n_ventas)} ventas`},
    {l:'Repiten',v:fmt(CL.repiten),s:P(CL.pct_repiten)+' de los clientes'},
    {l:'Compras por cliente',v:D1(CL.compras_prom),s:'Desv. est. '+D1(CL.compras_sd)},
    {l:'Entre compras',v:D1(CL.intervalo_prom_dias)+' días',s:'Gasto promedio '+R(CL.gasto_prom)+' (sin IVA)'}])+
  bars('Cuántas veces compró cada cliente',['1','2','3-4','5+'].map(k=>[k==='1'?'1 vez':k+' veces',num(f[k])]),fmt)+
  bars('Cuándo fue su última compra',[['0-7','En los últimos 7 días'],['8-30','Hace 8 a 30 días'],['31+','Hace más de 30 días']].map(k=>[k[1],num(r[k[0]])]),fmt,0,'Solo se cuentan clientes con cédula o nombre en la factura; se excluyen las cédulas propias del grupo.');
}
function pintar(){
  const el=$('sec-comercial');if(!el)return;
  let h=ctl();
  if(!D)h+=err?`<p class="note">${esc(err)}</p>`:cargando(' ');
  else if(D.vacio)h+=aviso()+`<p class="note">No hay ventas en este período${S.pruebas?'':'. Pruebe activar «Incluir ventas de prueba»'}.</p>`;
  else h+=aviso()+hoy()+`<h3 class="cm-h">Ventas por hora y por día</h3>`+horas()+dias()+locales()+`<h3 class="cm-h">Ticket promedio</h3>`+ticket()+`<h3 class="cm-h">Qué se pide junto</h3>`+pares()+`<h3 class="cm-h">Quién vuelve</h3>`+clientes();
  el.innerHTML=h;
  el.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{S.dias=+b.dataset.d;ver();});
  const pr=$('cm-pr');if(pr)pr.onchange=()=>{S.pruebas=pr.checked;ver();};
  const rf=$('cm-ref');if(rf)rf.onclick=()=>{llave='';ver();};
}
function ver(){if(!$('sec-comercial'))return;if(D)pintar();traer();}
return {ver};
})();

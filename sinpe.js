/* ---- SINPE Móvil recibidos, dentro de la pestaña Ingresos: SOLO CONSULTA (avisos del banco que llegan por mensaje de texto al teléfono del local) ----
   Nada de esto condiciona el cobro, el pedido ni el cierre. Cifras BRUTAS (monto recibido, sin descontar nada). Hora de Costa Rica.
   Datos: public.panel_sinpe_consulta (lee fact.sinpe_pagos y fact.sinpe_avisos, sin pruebas). */
const sinpe=(()=>{
const NEGN={soda:'Soda',pollos:'Pollos'};
const MCORTO=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const R=n=>crc(n),RM=n=>mo(crc(n));
const D1=n=>fmtD(n,2);
const PCT=n=>p1(n==null?NaN:Number(n));
let S=null,ocup=false,err=null,llave='',leido=null;
const horaCR=t=>new Date(t).toLocaleTimeString('es-CR',{timeZone:'America/Costa_Rica',hour:'2-digit',minute:'2-digit',hour12:false});
const diaCR=t=>new Date(t).toLocaleDateString('en-CA',{timeZone:'America/Costa_Rica'});
function avisoTxt(t,hoy){if(!t)return 'Todavía no hay';const d=diaCR(t);return d===hoy?horaCR(t):dl(d)+', '+horaCR(t);}
async function traer(forzar){
  const k=EMP;if(ocup||(!forzar&&k===llave&&leido&&Date.now()-leido<60000))return;ocup=true;   // se vuelve a leer si pasó más de un minuto: antes «hoy» quedaba congelado
  try{
    const {data,error}=await sb.rpc('panel_sinpe_consulta',{p_emp:EMP,p_dias:30});
    if(error)throw error;
    S=data;err=null;llave=k;leido=new Date();
  }catch(e){err='No se pudieron cargar los SINPE. Toque «Actualizar» para intentarlo otra vez.';}
  ocup=false;pintar();
}
function chipNeg(e){return EMP==='grupo'&&NEGN[e]?`<span class="tag par">${NEGN[e]}</span>`:'';}
function filas(lista,sinCab){
  if(!lista.length)return '';
  return `<div class="sp-t" role="table" aria-label="SINPE recibidos">${sinCab?'':'<div class="sp-f sp-cab" role="row"><span role="columnheader">Hora</span><span role="columnheader">Quién pagó (como viene en el mensaje)</span><span role="columnheader" class="sp-m">Monto bruto</span><span role="columnheader">Detalle</span><span role="columnheader">Comprobante</span></div>'}`+
  lista.map(p=>`<div class="sp-f" role="row"><span class="sp-h" role="cell">${horaCR(p.hora)}</span><span class="sp-q" role="cell"><b>${esc(p.pagador||'Sin nombre')}</b>${chipNeg(p.empresa)}</span><span class="sp-m" role="cell"><span class="mon"><span class="crc">₡</span><span class="cif">${fmt(p.monto)}</span></span></span><span class="sp-d" role="cell">${esc(p.detalle||'Sin detalle')}</span><span class="sp-c" role="cell">${esc(p.comprobante||'Sin comprobante')}</span></div>`).join('')+`</div>`;
}
function barras(vals,labels,fv,marcar,sub){
  const mx=Math.max(...vals,0)||10000,t=ticks(0,mx,vals.every(Number.isInteger)),hi=t[t.length-1];
  const plot=`<div class="bs${vals.length<=12?' g2':''}">${vals.map((v,i)=>`<div class="${marcar===i?'sp-hoy':''}" style="height:${Math.max(0,v/hi*100)}%" title="${esc(sub?sub[i]:'')}${sub?': ':''}${fv(v)}"></div>`).join('')}</div>`;
  return axes(plot,t,0,hi,fv,labels,vals.length);
}
const cinco=ds=>{const k=ds.length;if(k<2)return ds.map(dl);return [0,1,2,3,4].map(i=>dl(ds[Math.round(i*(k-1)/4)]));};
function hoyBloque(){
  const h=S.hoy,p=S.pagos_hoy||[],tot=p.reduce((a,x)=>a+Number(x.monto),0),n=p.length;
  const ph=S.por_hora_hoy||[];let a=ph.findIndex(x=>x.n>0),b=ph.length-1-[...ph].reverse().findIndex(x=>x.n>0);
  let grafico='';
  if(a>=0){let i0=a,i1=b;while(i1-i0<5){if(i0>0)i0--;if(i1-i0>=5)break;if(i1<23)i1++;}const s=ph.slice(i0,i1+1);
    grafico=`<div class="blk"><h2>SINPE de hoy por hora (brutos)</h2>${barras(s.map(x=>Number(x.total)),s.map(x=>x.h+' h'),v=>'₡'+cc(v),-1,s.map(x=>x.h+':00 a '+x.h+':59'))}<p class="note">Eje vertical: colones brutos recibidos en esa hora. Eje horizontal: hora del día (reloj de 24 horas, hora de Costa Rica); el 12 es de 12:00 a 12:59.</p></div>`;}
  const lista=n?filas([...p].sort((x,y)=>String(y.hora).localeCompare(String(x.hora)))):`<p class="note" style="margin-top:12px">Todavía no ha entrado ningún SINPE hoy.</p>`;
  return kpis([{c:'sinpe',l:'SINPE recibidos hoy',v:fmt(n),s:n===1?'1 pago':n+' pagos'},{c:'sinpe',l:'Monto bruto hoy',v:R(tot),s:'Brutos, sin descontar nada'},{c:'sinpe',l:'Pago promedio hoy',v:n?R(tot/n):'—',s:n?'Monto bruto entre pagos':'Sin pagos todavía'},{c:'sinpe',l:'Último aviso recibido',v:avisoTxt(S.ultimo_aviso,h),s:'Dato informativo del teléfono'}])
    +`<div class="g" data-c="sinpe"><div class="blk"><h2>SINPE que han entrado hoy</h2><p class="note" style="margin:10px 0 0">De la más reciente a la más antigua. Hora del teléfono al recibir el aviso del banco.</p>${lista}</div></div>`
    +(grafico?`<div class="g" data-c="sinpe">${grafico}</div>`:'');
}
function estadBloque(){
  const e=S.estad_dia||{},q=S.estad_pago||{};
  const nd=Number(e.n_dias||0);
  return `<div class="blk"><h2>Estadística de los ${nd} días completos</h2>
    <table class="tb stk"><thead><tr><th>Por día (suma de pagos)</th><th>Cifra</th></tr></thead><tbody>
      <tr><td data-l="Medida">Promedio diario (bruto)</td><td data-l="Cifra">${e.prom==null?'—':RM(e.prom)}</td></tr>
      <tr><td data-l="Medida">Desviación estándar</td><td data-l="Cifra">${e.sd==null?'—':RM(e.sd)}</td></tr>
      <tr><td data-l="Medida">Coeficiente de variación</td><td data-l="Cifra">${PCT(e.cv)}</td></tr></tbody></table>
    <table class="tb stk" style="margin-top:14px"><thead><tr><th>Por pago</th><th>Cifra</th></tr></thead><tbody>
      <tr><td data-l="Medida">Pagos contados</td><td data-l="Cifra">${fmt(q.n||0)}</td></tr>
      <tr><td data-l="Medida">Promedio por pago (bruto)</td><td data-l="Cifra">${q.prom==null?'—':RM(q.prom)}</td></tr>
      <tr><td data-l="Medida">Mediana</td><td data-l="Cifra">${q.mediana==null?'—':RM(q.mediana)}</td></tr>
      <tr><td data-l="Medida">Desviación estándar</td><td data-l="Cifra">${q.sd==null?'—':RM(q.sd)}</td></tr>
      <tr><td data-l="Medida">Coeficiente de variación</td><td data-l="Cifra">${PCT(q.cv)}</td></tr>
      <tr><td data-l="Medida">Pago menor y mayor</td><td data-l="Cifra">${q.min==null?'—':R(q.min)+' y '+R(q.max)}</td></tr></tbody></table>
    <p class="note">Cifras brutas. Se cuentan los ${nd} días anteriores a hoy (hoy se deja fuera por estar incompleto) desde el ${dly(S.desde)}; los días sin SINPE cuentan como ₡0. El coeficiente de variación es la desviación estándar entre el promedio: cerca de 0 los días se parecen, sobre 100 % cambian muchísimo.</p></div>`;
}
function agregados(){
  const pd=S.por_dia||[],pm=S.por_mes||[],hoy=S.hoy;
  const ds=pd.map(x=>x.dia),vals=pd.map(x=>Number(x.total));
  const dia=`<div class="blk"><h2>SINPE por día (brutos) · últimos ${pd.length} días</h2>${barras(vals,cinco(ds),v=>'₡'+cc(v),ds.indexOf(hoy),pd.map(x=>dl(x.dia)))}<p class="note">Eje vertical: colones brutos recibidos en el día. Eje horizontal: fecha, de la más antigua (izquierda) a hoy (derecha, en ámbar porque el día no ha terminado).</p></div>`;
  const mv=pm.map(x=>Number(x.total)),ml=pm.map(x=>MCORTO[Number(x.mes.slice(5,7))-1]);
  const mes=`<div class="blk"><h2>SINPE por mes (brutos) · ${hoy.slice(0,4)}</h2>${barras(mv,ml,v=>'₡'+cc(v),pm.length-1,pm.map(x=>x.mes))}<p class="note">Eje vertical: colones brutos recibidos en el mes. Eje horizontal: mes, de enero (izquierda) al mes actual (derecha, en ámbar porque el mes no ha terminado).</p></div>`;
  const tm=table('Detalle por mes · enero primero',['Mes','Pagos','Monto bruto','Pago promedio'],pm.map(x=>[MCORTO[Number(x.mes.slice(5,7))-1]+' '+x.mes.slice(0,4),fmt(x.n),R(x.total),x.n?R(x.total/x.n):'—']),true);
  return `<h3 class="cm-h">SINPE Móvil recibidos · agregados, del más antiguo al más reciente</h3><div class="g c2" data-c="sinpe">${dia}${mes}</div><div class="g c2" data-c="sinpe">${estadBloque()}${tm}</div>`;
}
function anteriores(){
  const r=S.recientes||[];if(!r.length)return `<div class="g" data-c="sinpe"><div class="blk"><h2>SINPE de días anteriores</h2><p class="note" style="margin-top:12px">Todavía no hay SINPE de días anteriores en estos ${S.dias} días.</p></div></div>`;
  const g=[];r.forEach(p=>{const d=diaCR(p.hora);let x=g[g.length-1];if(!x||x.d!==d){x={d,l:[]};g.push(x);}x.l.push(p);});
  return `<div class="g" data-c="sinpe"><div class="blk"><h2>SINPE de días anteriores · los últimos ${r.length}</h2><p class="note" style="margin:10px 0 0">Del día más antiguo al más reciente.</p>`+g.map((x,i)=>`<div class="sp-dh"><b>${fl(x.d)}</b><span>${x.l.length} ${x.l.length===1?'pago':'pagos'} · ${R(x.l.reduce((a,p)=>a+Number(p.monto),0))} brutos</span></div>${filas(x.l,i>0)}`).join('')+`</div></div>`;
}
function pintar(){
  const eh=$('ing-sinpe-hoy'),ea=$('ing-sinpe-agg');if(!eh||!ea)return;
  if(!S){eh.innerHTML=err?`<p class="note">${esc(err)}</p><div class="sp-bar"><button type="button" class="out" id="sp-ref">Actualizar SINPE</button></div>`:cargando('Cargando los SINPE…');ea.innerHTML='';const r=$('sp-ref');if(r)r.onclick=()=>traer(true);return;}
  const lectura=leido?leido.toLocaleTimeString('es-CR',{timeZone:'America/Costa_Rica',hour:'2-digit',minute:'2-digit',hour12:false}):'';
  eh.innerHTML=`<div class="sp-sec"><div class="sp-bar"><div class="dayl" style="margin:0">SINPE Móvil recibidos · hoy <b>${fl(S.hoy)}</b></div><button type="button" class="out" id="sp-ref">${ocup?'Actualizando…':'Actualizar SINPE'}</button></div>
  <p class="note" style="margin:0 0 12px">Son los avisos del banco que llegan por mensaje de texto al teléfono del local, al momento. Aparte, más abajo, está el comprobante diario del BCR (con atraso de un día).</p>
  ${err?`<p class="note">${esc(err)}</p>`:''}</div>`+hoyBloque();
  ea.innerHTML=agregados()+anteriores()+
  `<p class="cm-av"><b>Solo consulta.</b> Estas secciones de SINPE no cambian nada: no condicionan el cobro, el pedido Express ni el cierre. Las cifras son brutas, en colones, con hora de Costa Rica (última lectura: ${lectura||'—'}). El comprobante diario de tarjetas y SINPE del BCR es el de arriba y no se mezcla con estos avisos.</p>`;
  $('sp-ref').onclick=()=>traer(true);
}
function ver(f){if(!$('ing-sinpe-hoy'))return;if(S)pintar();traer(!!f);}
return {ver};
})();

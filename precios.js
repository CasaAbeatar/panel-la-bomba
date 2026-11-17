/* ---- Precios: análisis permanente de precios de compra (costo por unidad, sin IVA = neto) ---- */
const precios=(()=>{
const PAL=['#B81622','#2D5FA0','#7A3F78','#3F7FA8','#B8740A','#51657A','#8A6D3B','#7A5A3A'];
const PERS={todo:'Todo el historial',12:'Últimos 12 meses',6:'Últimos 6 meses',3:'Últimos 3 meses'};
const TEND={alza_sostenida:'alza sostenida',baja_sostenida:'baja sostenida',estable:'precio estable',salto_alza:'salto puntual hacia arriba',salto_baja:'salto puntual hacia abajo',variable:'sube y baja sin rumbo',pocos_datos:'pocas compras, aún sin tendencia'};
const TEXPL={alza_sostenida:'sube compra tras compra',baja_sostenida:'baja compra tras compra',estable:'casi no se mueve',salto_alza:'subió una sola vez y el resto igual',salto_baja:'bajó una sola vez y el resto igual',variable:'sube y baja sin una dirección clara',pocos_datos:'menos de 3 compras: todavía no se puede hablar de tendencia'};
let P={per:'todo',prov:'',cat:'',q:'',sub:'cat',orden:'gasto',det:null,abiertos:{},hoyTodos:false,limite:60};
try{const s=JSON.parse(sessionStorage.getItem('panel.precios')||'null');if(s)P={...P,...s,det:null};}catch(e){}
const guardar=()=>{try{const {det,...r}=P;sessionStorage.setItem('panel.precios',JSON.stringify(r));}catch(e){}};
const M={};let F={},cargandoEmp=null,errores={},scrollY=0,tq=null;
const n2=new Intl.NumberFormat('es-CR',{minimumFractionDigits:2,maximumFractionDigits:2});
const c2=n=>n==null?'—':'₡'+n2.format(n);
const c0=n=>n==null?'—':(n<0?'−':'')+'₡'+fmt(Math.abs(n));
const pc=(v,s)=>v==null?'—':(s?(v>0.00049?'+':v<-0.00049?'−':''):(v<0?'−':''))+(Math.abs(v)*100).toFixed(1).replace('.',',')+' %';
const cl=v=>v==null?'pr-eq':v>0.005?'pr-up':v<-0.005?'pr-dn':'pr-eq';
const fa=v=>v==null?'':(v>0.005?'▲ ':v<-0.005?'▼ ':'= ');
const MSL=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const fd=f=>{const d=new Date(String(f).slice(0,10)+'T12:00:00');return d.getDate()+' '+MSL[d.getMonth()]+' '+String(d.getFullYear()).slice(2);};
const fm=m=>MSL[+m.slice(5,7)-1]+' '+m.slice(2,4);
const fmL=m=>MSL[+String(m).slice(5,7)-1]+' '+String(m).slice(0,4);
const uni=u=>({'unidad suelta':'unidad suelta','unidad facturada':'unidad facturada'}[u]||u||'unidad');
const desde=()=>P.per==='todo'?null:addd(hoyCR(),-30*(+P.per)-(+P.per>=12?5:0));
const emp=()=>EMP;
async function rpc(fn,args){
  const k=fn+'|'+EMP+'|'+(args.p_desde||'')+'|'+JSON.stringify({...args,p_emp:0,p_desde:0});
  const hit=M[k];if(hit&&Date.now()-hit.t<120000)return hit.v;
  const {data,error}=await sb.rpc(fn,{p_emp:EMP,...args});
  if(error)throw error;M[k]={t:Date.now(),v:data};return data;
}
function veredicto(o){
  const w=o.v90!=null?['90 días',o.v90,90]:o.v30!=null?['30 días',o.v30,30]:o.v365!=null?['un año',o.v365,365]:o.vt!=null?['todo el período',o.vt,0]:null;
  const u=uni(o.unidad);
  if(!w)return `Una sola compra registrada: ${c2(o.p)} por ${u}. Todavía no hay con qué comparar.`;
  const de=o.p/(1+w[1]);
  const acc=Math.abs(w[1])<0.005?'Se mantuvo igual':(w[1]>0?'Subió ':'Bajó ')+pc(Math.abs(w[1]));
  return `${acc} en ${w[0]}, ${TEND[o.tend]||''}${Math.abs(w[1])<0.005?'':`: pasa de ${c2(de)} a ${c2(o.p)} por ${u}`}.`;
}
function notas(o){
  let s='';
  if(o.xml)s+='<span class="pr-tag">según XML</span>';
  if(o.n!=null&&o.n<3)s+='<span class="pr-tag">pocas compras ('+o.n+')</span>';
  return s;
}
/* ---------- gráficos con ejes rotulados ---------- */
function lineas(series,o){
  o=o||{};const all=series.flatMap(s=>s.pts);if(all.length<1)return'<p class="pr-vacio">Todavía no hay compras suficientes para dibujar la gráfica.</p>';
  let xs=all.map(p=>p[0]),x0=Math.min(...xs),x1=Math.max(...xs);if(x1===x0){x1=x0+1;}
  let ys=all.map(p=>p[1]);if(o.base)ys.push(100);
  const t=ticks(Math.min(...ys),Math.max(...ys)),lo=t[0],hi=t[t.length-1],R=(hi-lo)||1;
  const X=x=>(x-x0)/(x1-x0)*100,Y=y=>100-(y-lo)/R*100;
  const paths=series.map((s,i)=>{const c=s.color;const d=s.pts.map((p,j)=>(j?'L':'M')+X(p[0]).toFixed(2)+' '+Y(p[1]).toFixed(2)).join(' ');
    return s.pts.length>1?`<path d="${d}" fill="none" stroke="${c}" stroke-width="1.6" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`:'';}).join('');
  const base=o.base?`<path d="M0 ${Y(100).toFixed(2)} L100 ${Y(100).toFixed(2)}" stroke="#B81622" stroke-width="1" stroke-dasharray="4 3" opacity=".55" vector-effect="non-scaling-stroke"/>`:'';
  const dots=series.map(s=>s.pts.map(p=>`<i class="pr-dot" style="--c:${s.color};left:${X(p[0]).toFixed(2)}%;bottom:${(100-Y(p[1])).toFixed(2)}%"></i>`).join('')).join('');
  const k=5,labs=[];for(let i=0;i<k;i++){const x=x0+(x1-x0)*i/(k-1);labs.push(o.xl(x));}
  const html=axes(`<div class="pr-g" style="position:absolute;inset:0"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${paths}${base}</svg>${dots}</div>`,t,lo,hi,o.yf||c2,labs,0);
  const ley=series.length>1||o.leyenda?`<div class="pr-leyenda">${series.map(s=>`<span style="--c:${s.color}"><i></i>${esc(s.name)}</span>`).join('')}${o.base?'<span style="--c:#B81622"><i style="border-top-style:dashed;border-top-width:1px"></i>Base 100</span>':''}</div>`:'';
  return `<p class="pr-eje">${o.eje||''}</p>${html}${ley}`;
}
const dayN=f=>Math.round(new Date(String(f).slice(0,10)+'T12:00:00').getTime()/864e5);
const xlDia=(rango)=>x=>{const d=new Date(x*864e5);const f=d.getUTCFullYear()+'-'+String(d.getUTCMonth()+1).padStart(2,'0')+'-'+String(d.getUTCDate()).padStart(2,'0');return rango>300?fd(f):dl(f);};
const mesN=m=>(+m.slice(0,4))*12+(+m.slice(5,7)-1);
const xlMes=x=>{const y=Math.floor(x/12),mm=Math.round(x-y*12);return MSL[Math.min(11,Math.max(0,mm))]+' '+String(y).slice(2);};
function barrasEfecto(items,eje){
  if(!items||!items.length)return'<p class="pr-vacio">Sin datos todavía.</p>';
  const v=items.map(x=>x.e),t=ticks(Math.min(0,...v),Math.max(0,...v)),lo=t[0],hi=t[t.length-1],R=(hi-lo)||1,n=v.length;
  const Z=(0-lo)/R*100,w=100/n;
  const bars=v.map((x,i)=>{const top=(Math.max(x,0)-lo)/R*100,bot=(Math.min(x,0)-lo)/R*100;return `<div class="pr-bar" style="left:${(i*w+w*.15).toFixed(2)}%;width:${(w*.7).toFixed(2)}%;bottom:${bot.toFixed(2)}%;height:${Math.max(.6,top-bot).toFixed(2)}%;background:${x>0?'var(--bad)':x<0?'var(--ok)':'var(--mute)'}" title="${esc(fmL(items[i].m))}: ${c0(x)}"></div>`;}).join('');
  const labs=items.map((x,i)=>n<=12||i%Math.ceil(n/10)===0?fm(x.m):'');
  return `<p class="pr-eje">${eje}</p>`+axes(`<div class="pr-g" style="position:absolute;inset:0">${bars}<div class="pr-cero" style="bottom:${Z.toFixed(2)}%"></div></div>`,t,lo,hi,c0,labs,n);
}
/* ---------- apertura: hoy ---------- */
function hoyHtml(H){
  if(!H)return errores.hoy?`<p class="nodata">${esc(errores.hoy)}</p>`:cargando();
  let h=`<div class="dayl">${H.es_hoy?'Hoy':'Último día con facturas'} · <b>${fl(H.fecha)}</b></div>`;
  if(!H.facturas)return h+'<p class="pr-vacio">Todavía no han llegado facturas de proveedores.</p>';
  if(!H.es_hoy)h+='<p class="note" style="margin:-4px 0 12px">Hoy todavía no han llegado facturas con precios. Se muestra el último día que sí.</p>';
  const ef=num(H.efecto);
  h+=kpis([{c:'precio',l:'Facturas con precios',v:fmt(H.facturas),s:fmt(H.productos)+' productos distintos'},
    {c:'precio',l:'Productos que subieron',v:`<span class="pr-up">${fmt(H.subieron)}</span>`,s:'frente a su promedio de '+H.ventana+' días'},
    {c:'precio',l:'Productos que bajaron',v:`<span class="pr-dn">${fmt(H.bajaron)}</span>`,s:H.iguales+' igual'+(H.iguales===1?'':'es')+', '+H.nuevos+' sin comparación'},
    {c:'precio',l:ef>=0?'Pagado de más hoy':'Pagado de menos hoy',v:`<span class="${ef>0?'pr-up':ef<0?'pr-dn':''}">${c0(Math.abs(ef))}</span>`,s:'por el cambio de precio, sin IVA (neto)'}]);
  const it=H.items||[];const mostrar=P.hoyTodos?it:it.slice(0,8);
  h+=`<div class="g" data-c="precio"><div class="blk"><h2>Qué cambió de precio en estas facturas</h2>${mostrar.map(x=>{
    const ref=x.ref!=null?(x.base==='promedio'?'promedio de '+H.ventana+' días: ':'última compra: ')+c2(x.ref):'primera vez que se compra';
    return `<button type="button" class="pr-fila" data-pa="prod" data-k="${esc(x.key)}"><div class="tx"><b>${esc(x.producto)}</b><span>${esc(x.prov)} · ${esc(x.cat)}</span><span>${ref}</span><span>${x.alerta?'<span class="pr-tag al">Fuera de lo normal</span>':''}${x.xml?'<span class="pr-tag">según XML</span>':''}</span></div><div class="vl"><b>${c2(x.costo)}</b><i class="${cl(x.v)}">${x.estado==='nuevo'?'Nuevo':x.estado==='igual'?'Igual':fa(x.v)+pc(Math.abs(x.v))}</i><span class="pr-ver">Ver detalle</span></div></button>`;}).join('')||'<p class="pr-vacio">Ningún producto con precio en estas facturas.</p>'}
    ${it.length>8?`<div class="pr-hoy-mas"><button type="button" class="pr-btn" data-pa="hoymas">${P.hoyTodos?'Mostrar solo los 8 con más cambio':'Mostrar los '+it.length+' productos de este día'}</button></div>`:''}
    <p class="note">Costo por unidad sin IVA (neto). «Fuera de lo normal» sigue la misma regla de la alerta de precios: al menos 10 % de diferencia y más de 2 desviaciones estándar del promedio reciente, con 3 compras o más.</p></div></div>`;
  return h;
}
/* ---------- encabezado, filtros ---------- */
function cobHtml(){
  if(!F.lineas)return'';
  const pdf=F.pdf_leidas/F.lineas,xml=F.lineas-F.pdf_leidas;
  return `<p class="pr-cob">Datos desde <b>${fmL(F.min)}</b> hasta <b>${fd(F.max)}</b> · ${fmt(F.lineas)} líneas de facturas de proveedores · costo por unidad leído con el PDF en <b>${(pdf*100).toFixed(0)} %</b> de las líneas (${fmt(F.pdf_confirmadas)} confirmadas con la regla del PDF); las ${fmt(xml)} restantes van «según XML», sin lectura del PDF${F.comp&&F.comp.lineas?` · <b>${(F.comp.pct_lineas*100).toFixed(0)} %</b> de las líneas se pudieron llevar a precio por kilo o por litro (${(F.comp.pct_gasto*100).toFixed(0)} % del gasto); el resto no trae el contenido en la descripción`:''}${F.outliers?` · ${fmt(F.outliers)} líneas con costo fuera de rango quedan aparte (probable error de unidad)`:''}.</p>`;
}
function selHtml(){
  const op=(a,v)=>a.map(([k,t])=>`<option value="${esc(k)}"${String(v)===String(k)?' selected':''}>${esc(t)}</option>`).join('');
  return `<div class="pr-sel"><div><label for="pr-per">Período</label><select id="pr-per" data-pf="per">${op(Object.entries(PERS),P.per)}</select></div>
  <div><label for="pr-prov">Proveedor</label><select id="pr-prov" data-pf="prov">${op([['','Todos los proveedores'],...(F.proveedores||[]).map(p=>[p.ced,p.nombre])],P.prov)}</select></div>
  <div><label for="pr-cat">Categoría</label><select id="pr-cat" data-pf="cat">${op([['','Todas las categorías'],...(F.categorias||[]).map(p=>[p.nombre,p.nombre])],P.cat)}</select></div>
  <div><label for="pr-q">Buscar producto</label><input id="pr-q" data-pf="q" type="search" placeholder="Ej.: aceite, pollo, Fresca" value="${esc(P.q)}" autocomplete="off"></div></div>`;
}
const AYUDA=`<details class="pr-ayuda"><summary>¿Cómo leer esta pantalla?</summary><div>
<p><b>Costo por unidad.</b> Es lo que cuesta una sola unidad (una botella, un kilo, una pieza) sin IVA, ya dividido si la factura trae cajas o paquetes. Así se pueden comparar compras de distinto tamaño. Cuando la factura trae PDF, se usa para confirmar cuántas unidades vienen en cada caja; si no, se usa el XML y se marca «según XML».</p>
<p><b>Rojo y ámbar.</b> Rojo (▲) es que usted paga más; ámbar (▼) es que paga menos. Todas las cifras son netas, sin IVA, en colones.</p>
<p><b>Tendencia.</b> «Alza sostenida» o «baja sostenida» es cuando el precio se mueve en la misma dirección compra tras compra (cambio total de 5 % o más y al menos 6 de cada 10 movimientos en esa dirección). «Salto puntual» es un solo precio raro con el resto igual. «Estable» es menos de 5 % de diferencia entre el más barato y el más caro. Con menos de 3 compras no se habla de tendencia.</p>
<p><b>Índice.</b> Empieza en 100 en el primer mes con compras. Cada mes se compara solo lo que se compró en ese mes y en el anterior (la misma canasta), pesando cada producto por lo que se gastó en él; luego se encadena. Si el índice marca 108, esa canasta cuesta 8 % más que al inicio.</p>
</div></details>`;
function subHtml(){
  const b=(k,t)=>`<button role="tab" aria-selected="${P.sub===k}" data-pa="sub" data-k="${k}">${t}</button>`;
  return `<div class="subtabs" role="tablist" aria-label="Vistas de precios">${b('cat','Por categoría')}${b('prov','Por proveedor')}${b('prod','Por producto')}</div>`;
}
/* ---------- por producto ---------- */
function prodListaHtml(D){
  if(!D)return errores.prod?`<p class="nodata">${esc(errores.prod)}</p>`:cargando();
  const it=D.items||[];
  let h=`<div class="pr-sel" style="margin-bottom:10px"><div><label for="pr-ord">Ordenar por</label><select id="pr-ord" data-pf="orden">${[['gasto','Lo que más se compra'],['sube','Los que más subieron'],['baja','Los que más bajaron'],['nombre','Nombre']].map(([k,t])=>`<option value="${k}"${P.orden===k?' selected':''}>${t}</option>`).join('')}</select></div></div>`;
  h+=`<div class="g" data-c="precio"><div class="blk"><h2>Productos · costo por unidad sin IVA (neto)</h2>${it.map(x=>`<button type="button" class="pr-fila" data-pa="prod" data-k="${esc(x.key)}"><div class="tx"><b>${esc(x.producto)}</b><span>${esc(x.cat)} · ${x.nprov>1?x.nprov+' proveedores':esc(x.prov)}</span><span class="vd">${esc(veredicto({...x,v30:x.v30,unidad:x.unidad}))}</span><span>${notas(x)}</span></div><div class="vl"><b>${c2(x.p)}</b><i class="${cl(x.v90!=null?x.v90:x.vt)}">${fa(x.v90!=null?x.v90:x.vt)}${pc(x.v90!=null?Math.abs(x.v90):x.vt!=null?Math.abs(x.vt):null)}</i><span class="pr-ver">Ver detalle</span></div></button>`).join('')||'<p class="pr-vacio">No hay productos con esos filtros.</p>'}
  <p class="note">Mostrando ${it.length} de ${fmt(D.total)} productos${D.total>it.length?'. Use la búsqueda o los filtros para encontrar otros':''}. El porcentaje compara el último costo con el de hace 90 días (o con el de todo el período si no hay tanto historial).</p>
  ${D.total>it.length&&P.limite<300?`<div class="pr-hoy-mas"><button type="button" class="pr-btn" data-pa="mas">Mostrar más productos</button></div>`:''}</div></div>`;
  return h;
}
function prodDetHtml(D){
  if(!D)return errores.det?`<p class="nodata">${esc(errores.det)}</p>`:cargando();
  const S=D.series||[];if(!S.length)return'<p class="pr-vacio">Este producto no tiene compras en el período elegido.</p>';
  const S0=S[0],col=S.map((s,i)=>PAL[i%PAL.length]);
  const todos=S.flatMap(s=>s.puntos||[]).map(p=>dayN(p[0])),rg=Math.max(...todos)-Math.min(...todos);
  const sr=S.map((s,i)=>({name:s.prov,color:col[i],pts:(s.puntos||[]).map(p=>[dayN(p[0]),+p[1]])}));
  let h=`<div class="lblx">${esc(D.cat||'')}${D.cat_origen==='cabys'?' · grupo CABYS (sin categoría de inventario)':''}</div><h1 class="h1" style="font-size:clamp(22px,5vw,32px)">${esc(D.producto)}</h1>`;
  h+=`<div class="g" data-c="precio"><div class="blk"><h2>Cómo se mueve el precio</h2><p style="margin:12px 0 4px;font-size:16px;line-height:1.4">${esc(veredicto({...S0,unidad:D.unidad}))}</p><p>${notas(S0)}</p>
  ${lineas(sr,{xl:xlDia(rg),eje:'Costo por unidad, sin IVA (neto), en colones · cada punto es una compra · de la más antigua (izquierda) a la más reciente (derecha)',leyenda:true})}
  ${S.some(s=>s.n<3)?'<p class="note">Los proveedores con menos de 3 compras no tienen tendencia todavía: su línea es solo un punto de referencia.</p>':''}
  ${S.some(s=>s.xml)?'<p class="note">Parte de las compras va «según XML» (sin lectura del PDF todavía); si el factor por caja era distinto, un cambio de nivel puede deberse al método y no a un cambio real de precio.</p>':''}</div></div>`;
  if(S.some(s=>s.cp_ult!=null)){
    const U=x=>x.base==='kg'?'kilo':'litro',conp=S.filter(s=>s.cp_ult!=null).sort((a,b)=>a.cp_ult-b.cp_ult);
    h+=`<div class="g" data-c="precio"><div class="blk"><h2>Precio por ${U(conp[0])} (neto, sin IVA)</h2><p class="note" style="margin-top:8px">Sirve para comparar presentaciones distintas: se divide el costo entre los ${conp[0].base==='kg'?'kilos':'litros'} que trae cada unidad, según la unidad de la factura o el contenido de la descripción.</p>${conp.map((s,i)=>`<div class="pr-fila" style="cursor:default"><div class="tx"><b>${esc(s.prov)}</b><span>Presentación: ${esc(s.pres||'—')}${s.cambio_pres?' · <b>cambió de presentación</b>: compare con cuidado':''}</span></div><div class="vl"><b>${c2(s.cp_ult)}</b><i class="${i===0||(s.cp_barato||0)<.0005?'pr-dn':'pr-up'}">${i===0||(s.cp_barato||0)<.0005?'El más barato':'+'+pc(s.cp_barato)+' más caro'}</i><span class="pr-ver">por ${U(s)}</span></div></div>`).join('')}</div></div>`;
  }else if(S.some(s=>s.motivo_cp)){h+=`<p class="note">No se calculó precio por kilo o litro: ${esc(S.find(s=>s.motivo_cp).motivo_cp)}.</p>`;}
  if(S.length>1){
    const act=S.filter(s=>s.activo).sort((a,b)=>a.p-b.p),mn=act.length?act[0].p:null;
    h+=`<div class="g" data-c="precio"><div class="blk"><h2>Quién vende más barato</h2><p class="note" style="margin-top:8px">Último costo por unidad de cada proveedor al que se le compró en los últimos 6 meses.</p>${act.map((s,i)=>`<div class="pr-fila" style="cursor:default"><div class="tx"><b>${esc(s.prov)}</b><span>Última compra ${fd(s.ultima)}</span></div><div class="vl"><b>${c2(s.p)}</b><i class="${i===0?'pr-dn':'pr-up'}">${i===0?'El más barato':'+'+pc(s.p/mn-1)+' más caro'}</i></div></div>`).join('')||'<p class="pr-vacio">Ningún proveedor con compras en los últimos 6 meses.</p>'}</div></div>`;
  }
  h+=S.map((s,i)=>`<div class="g" data-c="precio"><div class="blk"><h2 style="border-left:0"><span style="display:inline-block;width:18px;border-top:2px solid ${col[i]};vertical-align:middle;margin-right:8px"></span>${esc(s.prov)}</h2>
   <p style="margin:12px 0 0;font-size:15px;line-height:1.4">${esc(veredicto({...s,unidad:D.unidad}))}</p><p>${notas(s)}</p>
   <dl class="pr-stat"><div><dt>Último costo</dt><dd>${c2(s.p)}</dd></div><div><dt>Promedio</dt><dd>${c2(s.prom)}</dd></div><div><dt>Mínimo</dt><dd>${c2(s.mn)}</dd></div><div><dt>Máximo</dt><dd>${c2(s.mx)}</dd></div>
   <div><dt>Desviación estándar</dt><dd>${c2(s.sd)}</dd></div><div><dt>Coef. de variación</dt><dd>${pc(s.cv)}</dd></div><div><dt>Compras (días)</dt><dd>${fmt(s.n)}</dd></div><div><dt>Última compra</dt><dd>${fd(s.ultima)}</dd></div>
   <div><dt>Cambio a 30 días</dt><dd class="${cl(s.v30)}">${s.v30==null?'sin compras':fa(s.v30)+pc(Math.abs(s.v30))}</dd></div><div><dt>Cambio a 90 días</dt><dd class="${cl(s.v90)}">${s.v90==null?'sin compras':fa(s.v90)+pc(Math.abs(s.v90))}</dd></div><div><dt>Cambio a 365 días</dt><dd class="${cl(s.v365)}">${s.v365==null?'sin compras':fa(s.v365)+pc(Math.abs(s.v365))}</dd></div><div><dt>Desde la primera compra</dt><dd class="${cl(s.vt)}">${s.vt==null?'—':fa(s.vt)+pc(Math.abs(s.vt))}</dd></div></dl>
   <p class="note">Tendencia: ${esc(TEND[s.tend]||'')} (${esc(TEXPL[s.tend]||'')}). Desviación y coeficiente de variación sobre los costos por día de compra.</p></div></div>`).join('');
  return h;
}
/* ---------- por categoría ---------- */
function idxTabla(meses){
  let ac=null;return `<table class="pr-t"><thead><tr><th>Mes</th><th>Índice</th><th>Cambio del mes</th><th>Acumulado</th></tr></thead><tbody>${meses.map(m=>{const e=m.e!=null?m.e-1:null,a=m.i/100-1;return `<tr><td>${fmL(m.m)}</td><td>${n2.format(m.i)}</td><td class="${cl(e)}">${e==null?'base':fa(e)+pc(Math.abs(e))}</td><td class="${cl(a)}">${Math.abs(a)<.0005?'0,0 %':fa(a)+pc(Math.abs(a))}</td></tr>`;}).join('')}</tbody></table>`;
}
function idxChart(meses,nombre){
  const pts=meses.map(m=>[mesN(m.m),m.i]);
  return lineas([{name:nombre,color:'#B81622',pts}],{base:true,xl:xlMes,yf:v=>n2.format(v).replace(/,00$/,''),eje:'Índice de precios (base 100 = primer mes) · cada punto es un mes · de izquierda (más antiguo) a derecha (más reciente)'});
}
function catHtml(D){
  if(!D)return errores.cat?`<p class="nodata">${esc(errores.cat)}</p>`:cargando();
  const T=D.total||{},tm=T.meses||[];
  let h='';
  if(tm.length){const a=tm[tm.length-1].i/100-1,e=tm.length>1?tm[tm.length-1].e-1:0;
    h+=`<div class="g" data-c="precio"><div class="blk"><h2>Índice de precios de todo lo que compra · desde ${fmL(T.base)}</h2>
    <p style="margin:12px 0 4px;font-size:16px;line-height:1.4">${Math.abs(a)<.0005?'Los precios de la canasta no han cambiado':`La canasta cuesta <b class="${cl(a)}">${pc(Math.abs(a))} ${a>0?'más':'menos'}</b> que en ${fmL(T.base)}`}; el último mes ${Math.abs(e)<.0005?'no cambió':'<span class="'+cl(e)+'">'+(e>0?'subió ':'bajó ')+pc(Math.abs(e))+'</span>'}.</p>
    ${idxChart(tm,'Todas las compras')}<details class="pr-ayuda" style="margin:12px 0 0"><summary>Ver el índice mes a mes</summary><div>${idxTabla(tm)}</div></details>
    <p class="note">Índice encadenado de Laspeyres sobre la misma canasta de productos de meses consecutivos, ponderado por el gasto del mes anterior; precios netos, sin IVA.</p></div></div>`;}
  let cats=D.categorias||[];if(P.cat)cats=cats.filter(c=>c.cat===P.cat);
  h+=`<div class="pr-sub">Categorías · de la que más gasto tiene a la que menos</div><div class="g" data-c="precio"><div class="blk" style="padding-top:6px">`+cats.map((c,ci)=>{
    const nm=c.nm||0,a=c.ult!=null?c.ult/100-1:null,e=nm>1&&c.e_ult!=null?c.e_ult-1:null,ab=!!P.abiertos['c'+c.cat];
    return `<div><button type="button" class="pr-fila" data-pa="abrir" data-k="c${esc(c.cat)}" aria-expanded="${ab}"><div class="tx"><b>${esc(c.cat)}</b><span>${c.origen==='cabys'?'Grupo CABYS (sin categoría de inventario) · ':''}${fmt(c.series)} productos · gasto ${c0(c.gasto)} sin IVA</span><span class="vd">${a==null||nm<2?'Todavía hay un solo mes de compras.':(Math.abs(a)<.0005?'Sin cambio':(a>0?'Subió ':'Bajó ')+pc(Math.abs(a)))+' desde '+fmL(c.base)+(e!=null?` · el último mes ${Math.abs(e)<.0005?'sin cambio':(e>0?'subió ':'bajó ')+pc(Math.abs(e))}`:'')+'.'}</span></div><div class="vl"><b class="${cl(a)}">${c.ult!=null?n2.format(c.ult):'—'}</b><i class="${cl(a)}">${a==null||nm<2?'':fa(a)+pc(Math.abs(a))}</i><span class="pr-ver">${ab?'Ocultar':'Ver detalle'}</span></div></button>
    ${ab?(DETC[c.cat+'|'+desde()]?catDet({...c,...DETC[c.cat+'|'+desde()]}):(pedirCat(c.cat),cargando())):''}</div>`;}).join('')||'<p class="pr-vacio">No hay categorías con esos filtros.</p>'+`</div></div>`;
  return h+(cats.length?'</div></div>':'');
}
const DETC={};
function pedirCat(cat){const k=cat+'|'+desde();if(DETC[k]===0)return;DETC[k]=0;
  rpc('precios_categoria',{p_cat:cat,p_desde:desde()}).then(D=>{DETC[k]=D;cargarCuerpo();}).catch(()=>{delete DETC[k];errores.cat='No se pudo cargar el detalle de la categoría.';cargarCuerpo();});}
function catDet(c){
  const ms=c.meses||[];
  const lp=(x,sg)=>`<button type="button" class="pr-fila" data-pa="prod" data-k="${esc(x.key)}"><div class="tx"><b>${esc(x.producto)}</b><span>${esc(x.prov||'')}${x.de!=null?' · de '+c2(x.de)+' ('+fd(x.desde)+') a '+c2(x.a)+' ('+fd(x.hasta)+')':''}</span></div><div class="vl"><i class="${cl(x.v)}">${fa(x.v)}${pc(Math.abs(x.v))}</i><span class="pr-ver">Ver detalle</span></div></button>`;
  let h=`<div style="padding:4px 0 16px">${ms.length>1?idxChart(ms,c.cat):'<p class="pr-vacio">Con un solo mes de compras todavía no hay índice que dibujar.</p>'}`;
  if(ms.length>1)h+=`<details class="pr-ayuda" style="margin:12px 0 0"><summary>Ver el índice mes a mes</summary><div>${idxTabla(ms)}</div></details>`;
  h+=`<div class="pr-sub">Los 10 que más subieron</div>${(c.suben||[]).map(x=>lp(x)).join('')||'<p class="pr-vacio">Ninguno subió.</p>'}`;
  h+=`<div class="pr-sub">Los 10 que más bajaron</div>${(c.bajan||[]).map(x=>lp(x)).join('')||'<p class="pr-vacio">Ninguno bajó.</p>'}`;
  const ct=c.contrib||[];h+=`<div class="pr-sub">Qué producto empuja el índice de la categoría</div>${ct.map(x=>`<button type="button" class="pr-fila" data-pa="prod" data-k="${esc(x.key)}"><div class="tx"><b>${esc(x.producto)}</b><span>${esc(x.prov||'')}</span></div><div class="vl"><i class="${cl(x.pts)}">${x.pts>0?'+':x.pts<0?'−':''}${Math.abs(x.pts).toFixed(2).replace('.',',')} puntos</i><span class="pr-ver">Ver detalle</span></div></button>`).join('')||'<p class="pr-vacio">Sin movimientos medibles todavía.</p>'}<p class="note">Los puntos suman el cambio del índice de la categoría (un punto es 1 % del precio inicial).</p>`;
  const cm=c.comparan||[];if(cm.length)h+=`<div class="pr-sub">Mismo producto, distintos proveedores</div>${cm.map(x=>`<button type="button" class="pr-fila" data-pa="prod" data-k="${esc(x.key)}"><div class="tx"><b>${esc(x.producto)}</b><span>Más barato: ${esc(x.barato)} (${c2(x.p_barato)}) · más caro: ${esc(x.caro)} (${c2(x.p_caro)})</span></div><div class="vl"><i class="pr-up">+${pc(x.dif)}</i><span class="pr-ver">Ver detalle</span></div></button>`).join('')}`;
  return h+'</div>';
}
/* ---------- por proveedor ---------- */
function provHtml(D){
  if(!D)return errores.prov?`<p class="nodata">${esc(errores.prov)}</p>`:cargando();
  let ps=D.proveedores||[];if(P.prov)ps=ps.filter(p=>p.ced===P.prov);
  const et=num(D.efecto_total);
  let h=`<div class="g" data-c="precio"><div class="blk"><h2>Cuánto más (o menos) se pagó por cambios de precio · por mes</h2>
   <p style="margin:12px 0 4px;font-size:16px;line-height:1.4">${et>=0?'En total se pagó':'En total se pagó'} <b class="${et>0?'pr-up':et<0?'pr-dn':''}">${c0(Math.abs(et))} ${et>=0?'de más':'de menos'}</b> por los cambios de precio, frente al primer precio de cada producto.</p>
   ${barrasEfecto(D.efecto_mes,'Diferencia de precio × cantidad comprada en cada mes, en colones sin IVA (neto) · rojo: se pagó más · ámbar: se pagó menos')}
   <p class="note">Para cada producto de cada proveedor: (precio del mes − precio de su primera compra) × unidades compradas ese mes. Es el costo real del alza sobre lo que realmente se compró.</p></div></div>`;
  h+=`<div class="pr-sub">Ranking de proveedores · de mayor a menor aumento acumulado</div><div class="g" data-c="precio"><div class="blk" style="padding-top:6px">`;
  h+=ps.map((p,i)=>{const ms=p.meses||[],a=ms.length>1?ms[ms.length-1].i/100-1:null;
    return `<button type="button" class="pr-fila" data-pa="provdet" data-k="${esc(p.ced)}"><div class="tx"><b>${i+1}. ${esc(p.prov)}</b><span>${fmt(p.series)} productos · gasto ${c0(p.gasto)} sin IVA · <span class="pr-up">${p.suben} subieron</span>, <span class="pr-dn">${p.bajan} bajaron</span>, ${p.igual} igual</span>
     <span class="vd">${a==null?'Pocos meses de compras para medir el aumento.':(Math.abs(a)<.0005?'Sin cambio':(a>0?'Subió ':'Bajó ')+pc(Math.abs(a)))+' desde '+fmL(p.base)+' (misma canasta)'}${p.v90!=null?' · 90 días: '+fa(p.v90)+pc(Math.abs(p.v90)):''}.</span></div><div class="vl"><b class="${cl(a)}">${a==null?'—':fa(a)+pc(Math.abs(a))}</b><i class="${cl(p.efecto)}">${p.efecto==null?'':(p.efecto>=0?'+':'−')+c0(Math.abs(p.efecto)).replace('−','')}</i><span class="pr-ver">Ver detalle</span></div></button>`;}).join('')||'<p class="pr-vacio">No hay proveedores con esos filtros.</p>';
  return h+`<p class="note">El porcentaje grande es el aumento acumulado de su índice de precios (base 100 en su primer mes). Debajo, el monto en colones que costó ese aumento.</p></div></div>`;
}
function provDetHtml(p,L){
  if(!p)return cargando();const ms=p.meses||[],a=ms.length>1?ms[ms.length-1].i/100-1:null;
  let h=`<div class="lblx">Proveedor</div><h1 class="h1" style="font-size:clamp(22px,5vw,32px)">${esc(p.prov)}</h1>
  <div class="g" data-c="precio"><div class="blk"><h2>Cuánto han subido sus precios</h2>
  <p style="margin:12px 0 4px;font-size:16px;line-height:1.4">${a==null?'Todavía hay pocos meses de compras para medir.':Math.abs(a)<.0005?'Sus precios no han cambiado.':`Sus precios ${a>0?'subieron':'bajaron'} <b class="${cl(a)}">${pc(Math.abs(a))}</b> desde ${fmL(p.base)}, sobre la misma canasta de productos.`} Costó ${c0(Math.abs(num(p.efecto)))} ${num(p.efecto)>=0?'más':'menos'} de lo que se habría pagado a los primeros precios.</p>
  ${ms.length>1?idxChart(ms,p.prov):''}
  <dl class="pr-stat"><div><dt>Cambio a 30 días</dt><dd class="${cl(p.v30)}">${p.v30==null?'sin compras':fa(p.v30)+pc(Math.abs(p.v30))}</dd></div><div><dt>Cambio a 90 días</dt><dd class="${cl(p.v90)}">${p.v90==null?'sin compras':fa(p.v90)+pc(Math.abs(p.v90))}</dd></div><div><dt>Cambio a 365 días</dt><dd class="${cl(p.v365)}">${p.v365==null?'sin compras':fa(p.v365)+pc(Math.abs(p.v365))}</dd></div><div><dt>Productos</dt><dd><span class="pr-up">${p.suben}↑</span> <span class="pr-dn">${p.bajan}↓</span> ${p.igual}=</dd></div></dl>
  <div class="pr-sub">Cuánto más (o menos) se pagó, por mes</div>${barrasEfecto(p.efecto_mes,'En colones sin IVA (neto) · rojo: se pagó más · ámbar: se pagó menos')}</div></div>`;
  h+=`<div class="g" data-c="precio"><div class="blk"><h2>Productos que más empujaron el alza</h2>${(p.empujan||[]).map(x=>`<button type="button" class="pr-fila" data-pa="prod" data-k="${esc(x.key)}"><div class="tx"><b>${esc(x.producto)}</b></div><div class="vl"><i class="pr-up">+${c0(x.imp).replace('−','')} de más</i><span class="pr-ver">Ver detalle</span></div></button>`).join('')||'<p class="pr-vacio">Ningún producto subió de forma medible.</p>'}
   ${(p.aflojan||[]).length?`<div class="pr-sub">Productos que bajaron</div>`+p.aflojan.map(x=>`<button type="button" class="pr-fila" data-pa="prod" data-k="${esc(x.key)}"><div class="tx"><b>${esc(x.producto)}</b></div><div class="vl"><i class="pr-dn">${c0(Math.abs(x.imp))} de menos</i><span class="pr-ver">Ver detalle</span></div></button>`).join(''):''}</div></div>`;
  h+=`<div class="g" data-c="precio"><div class="blk"><h2>Sus productos y la serie de precios</h2>${L?(L.productos||[]).map(x=>{const ab=!!P.abiertos['p'+x.key];
    return `<div><button type="button" class="pr-fila" data-pa="abrir" data-k="p${esc(x.key)}" aria-expanded="${ab}"><div class="tx"><b>${esc(x.producto)}</b><span class="vd">${esc(veredicto({...x,unidad:x.unidad}))}</span><span>${notas(x)}${x.otro_barato&&x.otro_dif>0.005?`<span class="pr-up">${esc(x.otro_barato)} lo vende ${pc(x.otro_dif)} más barato</span>`:''}</span></div><div class="vl"><b>${c2(x.p)}</b><i class="${cl(x.vt)}">${x.vt==null?'':fa(x.vt)+pc(Math.abs(x.vt))}</i><span class="pr-ver">${ab?'Ocultar serie':'Ver serie'}</span></div></button>
    ${ab?`<div style="padding:0 0 16px">${(x.meses||[]).length>1?lineas([{name:p.prov,color:'#B81622',pts:x.meses.map(m=>[mesN(m.m),+m.p])}],{xl:xlMes,eje:'Costo por unidad, sin IVA (neto), promedio de cada mes · de izquierda (más antiguo) a derecha (más reciente)'}):'<p class="pr-vacio">Un solo mes de compras: todavía no hay serie.</p>'}<button type="button" class="pr-btn" data-pa="prod" data-k="${esc(x.key)}">Ver detalle y comparar con otros proveedores</button></div>`:''}</div>`;}).join(''):cargando()}</div></div>`;
  return h;
}
/* ---------- orquestación ---------- */
const $p=()=>$('sec-precios');
function esqueleto(){
  const el=$p();if(el.dataset.ok===EMP)return;el.dataset.ok=EMP;
  el.innerHTML=`<div id="pr-top"><div class="lblx">${EMPN[EMP]} · colones, sin IVA (neto)</div><h1 class="h1">Precios de compra</h1></div>
   <div id="pr-main"><div id="pr-hoy"></div><div id="pr-cob"></div>${AYUDA}<div id="pr-sel"></div><div id="pr-subs"></div><div id="pr-cuerpo"></div></div><div id="pr-det" hidden></div>`;
}
const pend=new Set();
async function cargarHoy(){try{errores.hoy=null;const H=await rpc('precios_hoy',{});$('pr-hoy').innerHTML=hoyHtml(H);}catch(e){errores.hoy='No se pudieron cargar los precios de hoy.';$('pr-hoy').innerHTML=hoyHtml(null);}}
async function cargarCuerpo(){
  const tok=Symbol();pend.tok=tok;const cu=$('pr-cuerpo'),sub=P.sub;
  try{
    if(sub==='cat'){cu.innerHTML=cargando();const D=await rpc('precios_categorias',{p_desde:desde()});if(pend.tok!==tok)return;cu.innerHTML=catHtml(D);}
    else if(sub==='prov'){cu.innerHTML=cargando();const D=await rpc('precios_proveedores',{p_desde:desde()});if(pend.tok!==tok)return;cu.innerHTML=provHtml(D);}
    else{const D=await rpc('precios_productos',{p_desde:desde(),p_prov:P.prov||null,p_cat:P.cat||null,p_q:P.q||null,p_orden:P.orden,p_limite:P.limite});if(pend.tok!==tok)return;cu.innerHTML=prodListaHtml(D);}
  }catch(e){errores[sub]='No se pudo cargar. Intente de nuevo en un momento.';cu.innerHTML=`<p class="nodata">${errores[sub]}</p>`;}
}
function pintarFiltros(){$('pr-cob').innerHTML=cobHtml();$('pr-sel').innerHTML=selHtml();$('pr-subs').innerHTML=subHtml();}
let hecho='';
async function ver(){
  if(!$p()||SEC!=='precios')return;
  if(hecho===EMP){if(!P.det)cargarHoy();return;}
  hecho=EMP;esqueleto();
  if(!F.lineas||F.emp!==EMP){try{F=await rpc('precios_filtros',{});F.emp=EMP;try{F.comp=await rpc('precios_comparables',{p_desde:desde()});}catch(e2){}}catch(e){$('pr-hoy').innerHTML='<p class="nodata">No se pudo cargar el análisis de precios.</p>';return;}}
  pintarFiltros();cargarHoy();cargarCuerpo();
}
function mostrarDet(){
  const d=$('pr-det'),m=$('pr-main');
  if(!P.det){d.hidden=true;m.hidden=false;window.scrollTo(0,scrollY);return;}
  m.hidden=true;d.hidden=false;window.scrollTo(0,0);
}
async function abrirProd(k){
  scrollY=window.scrollY;P.det={t:'prod',k};history.pushState({precios:1},'');
  $('pr-det').innerHTML=`<div class="pr-vol"><button type="button" class="pr-btn" data-pa="volver">← Volver a la lista</button></div>`+cargando();mostrarDet();
  try{const D=await rpc('precios_producto',{p_key:k,p_desde:desde()});if(!P.det||P.det.k!==k)return;$('pr-det').innerHTML=`<div class="pr-vol"><button type="button" class="pr-btn" data-pa="volver">← Volver a la lista</button></div>`+prodDetHtml(D)+`<div class="pr-vol"><button type="button" class="pr-btn" data-pa="volver">← Volver a la lista</button></div>`;}
  catch(e){$('pr-det').innerHTML=`<div class="pr-vol"><button type="button" class="pr-btn" data-pa="volver">← Volver a la lista</button></div><p class="nodata">No se pudo cargar el detalle.</p>`;}
}
async function abrirProv(ced){
  scrollY=window.scrollY;P.det={t:'prov',k:ced};history.pushState({precios:1},'');
  const vol=`<div class="pr-vol"><button type="button" class="pr-btn" data-pa="volver">← Volver a los proveedores</button></div>`;
  $('pr-det').innerHTML=vol+cargando();mostrarDet();
  try{const [D,L]=await Promise.all([rpc('precios_proveedores',{p_desde:desde()}),rpc('precios_proveedor',{p_prov:ced,p_desde:desde()})]);if(!P.det||P.det.k!==ced)return;
    const p=(D.proveedores||[]).find(x=>x.ced===ced);P.det.p=p;P.det.L=L;$('pr-det').innerHTML=vol+provDetHtml(p,L);}
  catch(e){$('pr-det').innerHTML=vol+'<p class="nodata">No se pudo cargar el proveedor.</p>';}
}
function volver(){
  if(!P.det)return;
  if(P.det.t==='prod'&&P.det.from){const f=P.det.from;P.det=f;history.replaceState({precios:1},'');$('pr-det').innerHTML=provDetHtml(f.p,f.L).replace('<div class="lblx">','<div class="pr-vol"><button type="button" class="pr-btn" data-pa="volver">← Volver a los proveedores</button></div><div class="lblx">');return;}
  P.det=null;mostrarDet();
}
window.addEventListener('popstate',()=>{if(P.det)volver();});
document.addEventListener('click',e=>{
  const b=e.target.closest('#sec-precios [data-pa]');if(!b)return;const a=b.dataset.pa,k=b.dataset.k;
  if(a==='prod'){if(P.det&&P.det.t==='prov'){const f=P.det;scrollY=window.scrollY;P.det={t:'prod',k,from:f};history.replaceState({precios:1},'');
      $('pr-det').innerHTML='<div class="pr-vol"><button type="button" class="pr-btn" data-pa="volver">← Volver al proveedor</button></div>'+cargando();window.scrollTo(0,0);
      rpc('precios_producto',{p_key:k,p_desde:desde()}).then(D=>{if(P.det&&P.det.k===k)$('pr-det').innerHTML='<div class="pr-vol"><button type="button" class="pr-btn" data-pa="volver">← Volver al proveedor</button></div>'+prodDetHtml(D);}).catch(()=>{});}
    else abrirProd(k);}
  else if(a==='provdet')abrirProv(k);
  else if(a==='volver'){if(history.state&&history.state.precios)history.back();else volver();}
  else if(a==='sub'){P.sub=k;guardar();pintarFiltros();cargarCuerpo();}
  else if(a==='abrir'){P.abiertos[k]=!P.abiertos[k];const y=window.scrollY;if(P.det&&P.det.t==='prov'){$('pr-det').innerHTML='<div class="pr-vol"><button type="button" class="pr-btn" data-pa="volver">← Volver a los proveedores</button></div>'+provDetHtml(P.det.p,P.det.L);}else cargarCuerpo().then(()=>window.scrollTo(0,y));}
  else if(a==='hoymas'){P.hoyTodos=!P.hoyTodos;cargarHoy();}
  else if(a==='mas'){P.limite=Math.min(300,P.limite+60);cargarCuerpo();}
});
document.addEventListener('input',e=>{const t=e.target;if(!t.dataset||t.dataset.pf!=='q')return;clearTimeout(tq);tq=setTimeout(()=>{P.q=t.value;P.sub='prod';P.limite=60;guardar();pintarFiltros();$('pr-q').value=P.q;cargarCuerpo();},350);});
document.addEventListener('change',e=>{const t=e.target;if(!t.dataset||!t.dataset.pf||t.dataset.pf==='q')return;P[t.dataset.pf]=t.value;P.limite=60;guardar();
  if(t.dataset.pf==='per'){Object.keys(M).forEach(k=>delete M[k]);cargarHoy();}
  if((t.dataset.pf==='prov'||t.dataset.pf==='cat')&&P.sub==='cat'&&t.dataset.pf==='prov')P.sub='prod';
  cargarCuerpo();pintarFiltros();});
return {ver};
})();

/* Antiencuadre: si otra pagina mete el panel en un marco, no se muestra (GitHub Pages no deja poner X-Frame-Options ni frame-ancestors). */
if(window.top!==window.self){document.documentElement.style.display='none';try{window.top.location=window.self.location;}catch(e){}}
const SUPA_URL='https://dwlbcbtwdungyrykgahm.supabase.co';
const SUPA_KEY='sb_publishable_gUoYvCNka0je2rbNeWPpUA_l26vgQbO'; // clave pública; el acceso real lo controla RLS
const sb=supabase.createClient(SUPA_URL,SUPA_KEY);
const $=id=>document.getElementById(id);
const esc=t=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
/* ---- Formato de cifras: un solo criterio de miles (espacio duro), coma decimal y «—» cuando la cifra no existe (nunca NaN ni Infinity) ---- */
const NB=' ';
const miles=s=>s.replace(/\B(?=(\d{3})+(?!\d))/g,NB);
const fin=x=>x!=null&&Number.isFinite(Number(x));
const fmt=n=>{if(!fin(n))return '—';n=Math.round(Number(n));return (n<0?'−':'')+miles(String(Math.abs(n)));};
const fmtD=(n,d)=>{if(!fin(n))return '—';const v=Number(n),t=Math.abs(v).toFixed(d),p=t.split('.');return (v<0&&Number(t)!==0?'−':'')+miles(p[0])+(p[1]?','+p[1]:'');};
const crc=n=>{if(!fin(n))return '—';const t=fmt(n);return t.charAt(0)==='−'?'−₡'+t.slice(1):'₡'+t;};
const crcD=(n,d)=>{if(!fin(n))return '—';const t=fmtD(n,d);return t.charAt(0)==='−'?'−₡'+t.slice(1):'₡'+t;};
/* Columna del ₡: una cifra en colones que abre una celda, un valor o una fila se parte en dos columnas: el ₡ siempre al mismo borde y los dígitos alineados por posición. */
const MONRE=/^(\s*)(−?)₡([\d ]+(?:,\d+)?)(?=<|$)/;
const mo=s=>typeof s==='string'?s.replace(MONRE,(m,sp,sg,c)=>sp+'<span class="mon"><span class="crc">₡</span><span class="cif">'+sg+c+'</span></span>'):s;
const pct=(a,b)=>b&&fin(a/b)?Math.round(a/b*100)+' %':'—';
const FALLO={};
const reint=t=>`<div class="blk"><h2>${t}</h2><p class="note" role="alert">No se pudo cargar. Toque «Reintentar» o espere la próxima actualización. <button type="button" class="out" data-reint="1">Reintentar</button></p></div>`;
const reintTxt='<button type="button" class="out" data-reint="1">Reintentar</button>';
const NEG={soda:'Soda La Bomba',pollos:'Pollos La Bomba',papea:'Papea'};
let R=[],RALL=[],MALL=[],PEDALL=[],CARALL=[];
const HOYCR=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Costa_Rica'});

/* ---- datos ---- */
const rows=(o)=>R.filter(r=>(!o.fuente||r.fuente===o.fuente)&&(!o.metrica||r.metrica===o.metrica)&&(o.sitio===undefined||r.sitio===o.sitio)&&(o.detalle===undefined||r.detalle===o.detalle));
const sum=o=>rows(o).reduce((a,r)=>a+Number(r.valor),0);
const dias=()=>[...new Set(R.map(r=>r.fecha))].sort();
const serie=o=>{const m={};rows(o).forEach(r=>m[r.fecha]=(m[r.fecha]||0)+Number(r.valor));return dias().map(d=>m[d]||0);};
const avg=o=>{const a=rows(o);return a.length?a.reduce((x,r)=>x+Number(r.valor),0)/a.length:0;};
const last=o=>{const a=rows(o).sort((x,y)=>x.fecha<y.fecha?-1:1);return a.length?Number(a[a.length-1].valor):0;};
const first=o=>{const a=rows(o).sort((x,y)=>x.fecha<y.fecha?-1:1);return a.length?Number(a[0].valor):0;};
const groups=o=>{const m={};rows(o).forEach(r=>m[r.detalle]=(m[r.detalle]||0)+Number(r.valor));return Object.entries(m).sort((a,b)=>b[1]-a[1]);};

/* ---- piezas ---- */
function path(v,w,h,p){const mn=Math.min(...v),mx=Math.max(...v),r=(mx-mn)||1;return v.map((x,i)=>[i*(w/(v.length-1)),h-p-((x-mn)/r)*(h-p*2)]);}
function area(v){if(v.length<2)return'';const w=300,h=96,p=path(v,w,h,10);const d=p.map((q,i)=>(i?'L':'M')+q[0].toFixed(1)+' '+q[1].toFixed(1)).join(' ');
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true"><path d="${d}" fill="none" stroke="#B81622" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>`;}
function delta(v){if(v.length<8)return'';const a=v.slice(-7).reduce((x,y)=>x+y,0),b=v.slice(0,-7).reduce((x,y)=>x+y,0);if(!b)return'';const d=(a-b)/b*100;return `<span class="delta">${d>=0?'▲':'▼'} ${Math.abs(d).toFixed(0)} % vs semana anterior</span>`;}
const C=(c,x)=>`<div data-c="${c}">${x}</div>`;
const stt=(v,t)=>`<span class="st ${v>=99.5?'ok':v>=99?'warn':'bad'}">${t}</span>`;
const hero=(l,n,v,f,ds)=>`<div class="hero"><div class="lbl">${l}</div><div class="num">${mo(n)}</div>${delta(v)}${ds?lineAx(v,dlabs(ds),f||fmt):area(v)}</div>`;
const kpis=a=>`<div class="kpis">${a.map(k=>`<div class="kpi" data-c="${k.c||''}"><div class="l">${k.l}</div><div class="v">${mo(k.v)}</div><div class="s">${k.s||''}</div></div>`).join('')}</div>`;
function bars(titulo,items,f=fmt,max,sub){
  max=max||Math.max(...items.map(i=>i[1]),1);
  return `<div class="blk"><h2>${titulo}</h2>${items.map(i=>`<div class="br"><div class="t"><b>${esc(i[0])}</b><i>${mo(f(i[1]))}</i></div>${i[2]?`<div class="s2">${esc(i[2])}</div>`:''}<div class="tr"><u style="width:${Math.max(1.5,i[1]/max*100)}%"></u></div></div>`).join('')}${sub?`<p class="note">${sub}</p>`:''}</div>`;
}
const d1=x=>String(Math.round(x*10)/10).replace('.',',');
const cc=n=>{const a=Math.abs(n);return a>=1e6?d1(n/1e6)+' M':a>=1e3?d1(n/1e3)+' mil':String(Math.round(n));};   // 2,5 mil y 7,5 mil ya no se redondean a 3 y 8
const ylab=s=>{s=String(s);return s.charAt(0)==='₡'?'<b class="yc">₡</b><em>'+s.slice(1)+'</em>':s;};
function ticks(lo,hi,ent){const r=(hi-lo)||1,raw=r/4,p=Math.pow(10,Math.floor(Math.log10(raw))),f=raw/p,st=Math.max(ent?1:0,(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p),a=Math.floor(lo/st+1e-9)*st,b=Math.ceil(hi/st-1e-9)*st,t=[];for(let v=a;v<=b+st/2;v+=st)t.push(v);return t;}
function xlab(labels,n,bars){return labels.map((l,i)=>{if(!l)return'';const k=labels.length,pos=k===n?(i+.5)/n:i/(k-1),tr=pos<.04?'0':pos>.96?'-100%':'-50%';return `<span style="left:${(pos*100).toFixed(2)}%;transform:translateX(${tr})">${l}</span>`;}).join('');}
function axes(plot,t,lo,hi,f,labels,n){const R=(hi-lo)||1;return `<div class="ch"><div class="yl">${t.map(v=>`<span style="bottom:${((v-lo)/R*100).toFixed(2)}%">${ylab(f(v))}</span>`).join('')}</div><div class="pl">${t.map(v=>`<div class="gl" style="bottom:${((v-lo)/R*100).toFixed(2)}%"></div>`).join('')}${plot}</div></div><div class="xl">${xlab(labels,n)}</div>`;}
function barsAx(vals,labels,f,vl,avg){vals=vals.map(v=>fin(v)?Number(v):0);const t=ticks(0,Math.max(...vals,1),vals.every(Number.isInteger)),hi=t[t.length-1];return axes(`<div class="bs${vals.length<=12?' g2':''}${vl&&vals.length>10?' dens':''}">${vals.map(v=>`<div style="height:${Math.max(0,v/hi*100)}%" title="${f(v)}">${vl?`<i>${f(v)}</i>`:''}</div>`).join('')}</div>${avg?`<div class="pm" style="bottom:${(avg/hi*100).toFixed(2)}%" title="promedio"></div>`:''}`,t,0,hi,f,labels,vals.length);}
function lineAx(v,labels,f){v=v.map(x=>fin(x)?Number(x):0);if(v.length<2)return'';const t=ticks(Math.min(...v),Math.max(...v)),lo=t[0],hi=t[t.length-1],R=(hi-lo)||1,pts=v.map((x,i)=>[i/(v.length-1)*100,100-(x-lo)/R*100]),d=pts.map((q,i)=>(i?'L':'M')+q[0].toFixed(2)+' '+q[1].toFixed(2)).join(' ');return axes(`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><path d="${d} L100 100 L0 100 Z" fill="var(--cat)" opacity=".10"/><path d="${d}" fill="none" stroke="var(--cat)" stroke-width="1.6" vector-effect="non-scaling-stroke"/></svg>`,t,lo,hi,f,labels,v.length);}
const dly=f=>{if(!f)return '';const d=new Date(f+'T12:00:00');return d.getDate()+' '+['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()]+' '+d.getFullYear();};
const dl=f=>{if(!f)return '';const d=new Date(f+'T12:00:00');return d.getDate()+' '+['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'][d.getMonth()];};
const dlabs=ds=>!ds.length?[]:ds.length<=5?ds.map(dl):[0,1,2,3,4].map(i=>dl(ds[Math.round(i*(ds.length-1)/4)]));
function cols(titulo,vals,labels,sub,w,f,vl,avg){return `<div class="blk"><h2>${titulo}</h2>${barsAx(vals,labels,f||fmt,vl,avg)}${sub?`<p class="note">${sub}</p>`:''}</div>`;}
function table(titulo,head,body,stk){return `<div class="blk"><h2>${titulo}</h2><table class="tb${stk?' stk':''}"><thead><tr>${head.map(h=>`<th>${h}</th>`).join('')}</tr></thead><tbody>${body.map(r=>`<tr>${r.map((c,j)=>`<td${stk?` data-l="${head[j]}"`:''}>${mo(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;}

/* ---- Ingresos digitales (tarjetas del BCR) ---- */
const MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
const DIA=['domingo','lunes','martes','miércoles','jueves','viernes','sábado'];
const dts=f=>new Date(f+'T12:00:00');
const mesL=m=>MES[Number(m.slice(5,7))-1]+' '+m.slice(0,4);                      // septiembre 2025
const mesC=m=>MES[Number(m.slice(5,7))-1].slice(0,3)+' '+m.slice(2,4);          // sep 25
const lbM=ms=>{const k=ms.length,p=k>12?3:k>8?2:1;return ms.map((m,i)=>(k-1-i)%p===0?mesC(m):'');};   // con muchos meses se muestra uno de cada p, anclado en el último
function fl(f){const d=dts(f);return DIA[d.getDay()]+' '+d.getDate()+' de '+MES[d.getMonth()];}
function addd(f,n){const d=dts(f);d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
const mean=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
const sd=a=>{if(a.length<2)return 0;const m=mean(a);return Math.sqrt(a.reduce((x,y)=>x+(y-m)*(y-m),0)/(a.length-1));};
const p2=n=>fin(n)?(n*100).toFixed(2).replace('.',',')+' %':'—';
const p1=n=>fin(n)?(n*100).toFixed(1).replace('.',',')+' %':'—';
const dif=(a,b)=>b&&fin(a/b)?((a/b-1)>=0?'▲ ':'▼ ')+Math.abs((a/b-1)*100).toFixed(0)+' %':'—';
let B={},mesSel=null;
const KEY={tarjeta_bruto:'b',tarjeta_vouchers:'v',tarjeta_comision:'c',tarjeta_iva:'i',tarjeta_renta:'r',tarjeta_neto:'n'};
let SP={},SPM={},SPR={};
function armarB(a){B={};SP={};SPM={};SPR={};a.forEach(r=>{if(/^hist\|/.test(r.detalle||''))return;const SK={sinpe_monto:'m',sinpe_cantidad:'n',sinpe_especial_monto:'em',sinpe_especial_cantidad:'en'};if(SK[r.metrica]){const o=SP[r.fecha]||(SP[r.fecha]={m:0,n:0,em:0,en:0});o[SK[r.metrica]]+=Number(r.valor);return;}if(r.metrica==='sinpe_rango_n'||r.metrica==='sinpe_rango_monto'){const o=SPR[r.detalle]||(SPR[r.detalle]={});const m=r.fecha.slice(0,7),q=o[m]||(o[m]={n:0,m:0});q[r.metrica==='sinpe_rango_n'?'n':'m']+=Number(r.valor);return;}if(r.metrica==='sinpe_desv_pago'||r.metrica==='sinpe_mediana_pago'){const o=SPM[r.fecha.slice(0,7)]||(SPM[r.fecha.slice(0,7)]={});o[r.metrica==='sinpe_desv_pago'?'sd':'md']=Number(r.valor);return;}const k=KEY[r.metrica];if(!k)return;const o=B[r.fecha]||(B[r.fecha]={b:0,v:0,c:0,i:0,r:0,n:0,rev:false});o[k]+=Number(r.valor);if(k==='b')o.k=(o.k||0)+1;if(k==='b'&&/revisar/.test(r.detalle))o.rev=true;});}

function sinpeHtml(){
  const sk=Object.keys(SP).sort();
  if(!sk.length)return `<div class="g" data-c="banco"><div class="blk"><h2>SINPE Móvil</h2><p class="note">Sin datos todavía.</p></div></div>`;
  const ms=[...new Set(sk.map(k=>k.slice(0,7)))];
  const tm=m=>sk.filter(k=>k.slice(0,7)===m).reduce((t,k)=>t+SP[k].m,0),tn=m=>sk.filter(k=>k.slice(0,7)===m).reduce((t,k)=>t+SP[k].n,0);
  const tb=m=>Object.keys(B).filter(k=>k.slice(0,7)===m).reduce((t,k)=>t+B[k].b,0);
  const M=sk.reduce((t,k)=>t+SP[k].m,0),N=sk.reduce((t,k)=>t+SP[k].n,0),EM=sk.reduce((t,k)=>t+SP[k].em,0),EN=sk.reduce((t,k)=>t+SP[k].en,0);
  const rm=m=>sk.filter(k=>k.slice(0,7)===m).reduce((t,k)=>t+SP[k].m-SP[k].em,0),rn=m=>sk.filter(k=>k.slice(0,7)===m).reduce((t,k)=>t+SP[k].n-SP[k].en,0);
  const comunes=sk.filter(k=>B[k]),pS=comunes.reduce((t,k)=>t+SP[k].m,0),pT=comunes.reduce((t,k)=>t+B[k].b,0);
  const full=ms.filter(m=>sk.filter(k=>k.slice(0,7)===m).length>=20);
  let h=`<div class="dayl" style="margin-top:34px">SINPE Móvil · cuenta en colones de la Soda</div><div class="mes">${T0(sk)===sk[sk.length-1].slice(0,4)?T0(sk):T0(sk)+' a '+sk[sk.length-1].slice(0,4)}<small>${dly(sk[0])} al ${dly(sk[sk.length-1])} · ${sk.length} días con pagos</small></div>`;
  h+=kpis([{c:'banco',l:'Recibido por SINPE Móvil',v:crc(M),s:'bruto, '+fmt(N)+' pagos'},{c:'banco',l:'Ticket promedio',v:crc((M-EM)/(N-EN)),s:'sin '+fmt(EN)+' ventas especiales ('+crc(EM)+')'},{c:'banco',l:'Promedio por día',v:crc(M/sk.length),s:fmt(N/sk.length)+' pagos al día'},{c:'banco',l:'Peso frente a tarjeta',v:p1(pS/(pS+pT)),s:'del cobro digital (SINPE + tarjeta), mismos días'}]);
  const pa=m=>sk.filter(k=>k.slice(0,7)===m).length<20?' <span class="tag lo">parcial</span>':'';
  h+=`<div class="g c2" data-c="banco">`+table('SINPE Móvil mes por mes',['Mes','Pagos','Monto','Prom./día','% digital'],ms.map(m=>{const d=sk.filter(k=>k.slice(0,7)===m).length,x=tm(m);return [mesL(m)+pa(m),fmt(tn(m)),crc(x),crc(x/d),tb(m)?p1(x/(x+tb(m))):'—'];}))+table('Ticket por pago · sin ventas especiales',['Mes','Promedio','Desv. est.','CV','Mediana'],ms.map(m=>{const x=rm(m),n=rn(m),st=SPM[m]||{};return [mesL(m)+pa(m),crc(x/n),st.sd?crc(st.sd):'—',st.sd?p1(st.sd/(x/n)):'—',st.md?crc(st.md):'—'];}))+`</div><p class="note">% digital: parte del SINPE en el cobro digital del mes (SINPE más tarjeta bruta). Desviación, coeficiente de variación y mediana se calcularon con cada pago del estado de cuenta.</p>`;
  h+=`<div class="g c2" data-c="banco">${cols('SINPE Móvil por mes',full.map(tm),lbM(full),'Eje vertical: colones recibidos (bruto). Eje horizontal: mes, del más antiguo (izquierda) al más reciente (derecha). Solo meses con datos completos.',1,v=>'₡'+cc(v))}${(()=>{const dow=Array(7).fill(0),dn=Array(7).fill(0);sk.forEach(k=>{const i=(dts(k).getDay()+6)%7;dow[i]+=SP[k].m;dn[i]++;});const pr=dow.map((v,i)=>v/Math.max(dn[i],1));return cols('SINPE promedio por día de la semana',pr,['L','M','K','J','V','S','D'],'Eje vertical: colones promedio por día. Eje horizontal: día de la semana, de lunes a domingo.',1,v=>'₡'+cc(v));})()}</div>`;
  // rangos de pago
  const rl=Object.keys(SPR).sort(),rt=l=>Object.values(SPR[l]).reduce((a,q)=>({n:a.n+q.n,m:a.m+q.m}),{n:0,m:0}),RT=rl.map(rt),RN=RT.reduce((a,q)=>a+q.n,0),RM=RT.reduce((a,q)=>a+q.m,0);
  if(rl.length){const lim=l=>l.replace(/^\d+ · /,'');
    h+=`<div class="g c2" data-c="banco">`+table('Pagos por rango de monto · '+dly(sk[0])+' al '+dly(sk[sk.length-1]),['Rango','Pagos','% pagos','Monto','% monto','Prom.'],rl.map((l,i)=>[lim(l),fmt(RT[i].n),p1(RT[i].n/RN),crc(RT[i].m),p1(RT[i].m/RM),crc(RT[i].m/RT[i].n)]),1)+
    heat('Peso de cada rango por mes · % del monto',rl.map(l=>ms.filter(m=>m>='2026-03').map(m=>{const q=SPR[l][m];const tot=rl.reduce((a,x)=>a+((SPR[x][m]||{}).m||0),0);return q&&tot?Math.round(q.m/tot*100):0;})),rl.map(lim),ms.filter(m=>m>='2026-03').map(mesC),'Cada columna suma 100 %. Rangos fijados con cortes naturales de la distribución (método de Jenks sobre el logaritmo del monto), redondeados a precios del menú.')+`</div>`;
    h+=`<p class="note">Lectura de los rangos: menos de ${crc(1500)} es café, refresco o un extra; ${crc(1500)} a ${crc(2999)}, un antojo o desayuno liviano; ${crc(3000)} a ${crc(4999)}, un plato individual como el casado; ${crc(5000)} a ${crc(9999)}, comida con bebida o para dos; ${crc(10000)} a ${crc(19999)}, grupo o familia; ${crc(20000)} o más, pedido grande. Las ventas especiales van aparte.</p>`;}
  // ciclos y tendencia
  const bk=Object.keys(B).sort(),avgOf=(keys,f)=>keys.length?keys.reduce((a,k)=>a+f(k),0)/keys.length:0;
  const tV=k=>B[k].b,sV=k=>SP[k].m,tG=avgOf(bk,tV),sG=avgOf(sk,sV),idx=(v,g)=>g?Math.round(v/g*100):0;
  const DL=['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'],wd=k=>(dts(k).getDay()+6)%7;
  const TR=[[1,5,'Días 1 a 5'],[6,14,'Días 6 a 14'],[15,19,'Días 15 a 19'],[20,27,'Días 20 a 27'],[28,31,'Días 28 a 31']],dd=k=>Number(k.slice(8));
  h+=`<div class="dayl" style="margin-top:34px">Ciclos, estacionalidad y tendencia</div><div class="g c2" data-c="banco">`+
    table('Índice por día de la semana',['Día','Tarjeta','SINPE'],DL.map((n,i)=>[n,idx(avgOf(bk.filter(k=>wd(k)===i),tV),tG),idx(avgOf(sk.filter(k=>wd(k)===i),sV),sG)]))+
    table('Índice por tramo del mes',['Tramo','Tarjeta','SINPE'],TR.map(t=>[t[2],idx(avgOf(bk.filter(k=>dd(k)>=t[0]&&dd(k)<=t[1]),tV),tG),idx(avgOf(sk.filter(k=>dd(k)>=t[0]&&dd(k)<=t[1]),sV),sG)]))+`</div>`;
  const mt=[...new Set(bk.map(k=>k.slice(0,7)))],iT=mt.map(m=>idx(avgOf(bk.filter(k=>k.slice(0,7)===m),tV),tG)),iS=mt.map(m=>{const a=sk.filter(k=>k.slice(0,7)===m);return a.length>=20?idx(avgOf(a,sV),sG):null;});
  h+=`<div class="g" data-c="banco">`+table('Tendencia mensual · índice del promedio por día',['Mes','Tarjeta','Var.','SINPE','Var.'],mt.map((m,i)=>[mesL(m),iT[i],i?((iT[i]-iT[i-1])>0?'+':'')+(iT[i]-iT[i-1]):'—',iS[i]??'—',i&&iS[i]!=null&&iS[i-1]!=null?((iS[i]-iS[i-1])>0?'+':'')+(iS[i]-iS[i-1]):'—']))+`</div><p class="note">Índice 100 = promedio por día de todo el periodo con datos de cada medio. Arriba de 100, el día, tramo o mes vende más que el promedio. El tramo del mes muestra el efecto de las quincenas. Los meses parciales cuentan solo sus días con datos.</p>`;
  const u=sk.slice(-60);
  h+=`<div class="g" data-c="banco">${cols('SINPE Móvil diario · últimos 60 días con datos',u.map(k=>SP[k].m),dlabs(u),'Eje vertical: colones recibidos por día. Eje horizontal: fecha, de la más antigua a la más reciente.',0,v=>'₡'+cc(v))}</div>`;
  h+=`<p class="note">Fuente: estados de cuenta del BCR, columna de crédito, solo los movimientos de SINPE Móvil. Quedan fuera el depósito de ventas en efectivo de enero (${crc(3000000)}), la transferencia de febrero (${crc(1000000)}), los intereses, enero y febrero, una devolución (${crc(75000)}, setiembre) y un préstamo (${crc(3000)}, julio). Las ventas especiales (pagos de facturas y montos fuera de lo común, ${fmt(EN)} ${EN===1?'pago':'pagos'} por ${crc(EM)}) suman a los totales pero no al ticket, la desviación ni el coeficiente de variación. Los datos llegan hasta el ${dly(sk[sk.length-1])}; el mes siguiente se agrega cuando el banco emita su estado de cuenta.</p>`;
  return h;
}
function T0(sk){return sk[0].slice(0,4);}

/* ---- Comparativo con años anteriores (mismo mes) ---- */
let HC={};
function cmpAgregar(rows,y,mm){
  const o={};rows.filter(r=>r.fecha.slice(0,4)===String(y)).forEach(r=>{const d=o[r.fecha]||(o[r.fecha]={b:0,v:0,n:0});const k={tarjeta_bruto:'b',tarjeta_vouchers:'v',tarjeta_neto:'n'}[r.metrica];if(k)d[k]+=Number(r.valor);});
  return o;
}
function cmpFila(etq,dias,mm,y,vivo){
  const ks=Object.keys(dias).sort(),nd=new Date(y,Number(mm),0).getDate();
  if(!ks.length)return null;
  const at=ks.filter(k=>HIST_ATIPICOS.includes(k)),ok=ks.filter(k=>!HIST_ATIPICOS.includes(k)),vs=ok.map(k=>dias[k].b);
  const tot=ks.reduce((t,k)=>t+dias[k].b,0),net=ks.reduce((t,k)=>t+dias[k].n,0);
  return {etq,y,n:ks.length,nd,at,tot,net,prom:mean(vs),cv:mean(vs)?sd(vs)/mean(vs):0,vivo,ini:ks[0],fin:ks[ks.length-1]};
}
function cmpHtml(sel){
  const mm=sel.slice(5),mn=MES[Number(mm)-1],hr=HC[mm];
  const filas=[];
  const anios=[...new Set([...(hr?HIST_ANOS.map(String):[]),...Object.keys(B).filter(k=>k.slice(5,7)===mm).map(k=>k.slice(0,4))])].sort();
  anios.forEach(y=>{
    const d=hr?cmpAgregar(hr,y,mm):{},nh=Object.keys(d).length;
    const viv=Object.keys(B).filter(k=>k.slice(0,4)===y&&k.slice(5,7)===mm);
    viv.forEach(k=>{d[k]={b:B[k].b,v:B[k].v,n:B[k].n};});
    const f=cmpFila(mn.slice(0,3)+' '+y.slice(2),d,mm,Number(y),viv.length>0);if(f){f.mixto=nh>0&&viv.length>0;filas.push(f);}});
  filas.sort((a,b)=>a.y-b.y);
  const cargando=hr===undefined&&!HC['err'+mm];
  let h='';
  if(!filas.length)return `<p class="note">${cargando?'Cargando la historia de '+mn+'…':'No hay ventas con tarjeta cargadas para '+mn+' en ningún año.'}</p>`;
  const falt=HIST_FALTAN.filter(k=>k.slice(5,7)===mm).map(k=>dl(k)+' '+k.slice(0,4));
  const nfa=f=>HIST_FALTAN.filter(k=>k.slice(0,4)===String(f.y)&&k.slice(5,7)===mm).length,parc=f=>f.n>=f.nd?'':f.n+nfa(f)>=f.nd?`<small>${f.n} de ${f.nd} días · sin comprobante: ${HIST_FALTAN.filter(k=>k.slice(0,4)===String(f.y)&&k.slice(5,7)===mm).map(k=>dl(k)).join(', ')}</small>`:` <span class="tag par">parcial</span><small>${f.n} de ${f.nd} días · hay datos del ${dl(f.ini)} al ${dl(f.fin)}</small>`;
  h+=barsAx(filas.map(f=>f.prom),filas.map(f=>f.etq),v=>'₡'+cc(v),1);
  h+=`<p class="note">Eje vertical: colones de venta bruta promedio por día. Eje horizontal: ${mn} de cada año, del más antiguo (izquierda) al más reciente (derecha).</p>`;
  h+=`<table class="tb" style="margin-top:14px"><thead><tr><th>${mn[0].toUpperCase()+mn.slice(1)}</th><th>Ventas brutas</th><th>Prom./día</th><th>CV</th><th>Neto</th></tr></thead><tbody>${filas.map(f=>`<tr><td>${f.etq}${f.mixto?'<small>historia del BCR y periodo vivo</small>':f.vivo?'':'<small>historia del BCR</small>'}${parc(f)}${f.at.length?`<small>${f.at.length} ${f.at.length==1?'día fuera':'días fuera'} del promedio y del CV: ${f.at.map(k=>dl(k)+(HIST_PARCIAL[k]?' ('+HIST_PARCIAL[k]+')':'')).join(', ')}</small>`:''}</td><td>${mo(crc(f.tot))}</td><td>${mo(crc(f.prom))}</td><td style="white-space:nowrap">${p1(f.cv)}</td><td>${mo(crc(f.net))}<small>${p1(f.net/f.tot)} de la venta</small></td></tr>`).join('')}</tbody></table>`;
  h+=`<p class="note">Cifras brutas: venta con tarjeta antes de comisión y retenciones; la columna Neto es lo depositado. Prom./día y coeficiente de variación (CV) excluyen los días atípicos o parciales marcados en cada fila (8 al 10 de octubre de 2022, 8 de marzo de 2023, 10 de febrero, 15 de mayo y 5 de agosto de 2025). Ventas brutas suma solo los días con datos del mes: donde faltan comprobantes no se completa ni se estima nada; el promedio por día sí es comparable aunque el mes esté incompleto.</p>`;
  if(falt.length)h+=`<p class="note"><b>Falta el comprobante de:</b> ${falt.join(', ')}.</p>`;
  const sinm=HIST_HUECOS.filter(g=>HIST_ANOS.some(y=>y+'-'+mm+'-01'>=g[0]&&y+'-'+mm+'-31'<=g[1]&&!filas.some(x=>x.y===y))).map(g=>g[2]);
  if(sinm.length)h+=`<p class="note"><b>Sin comprobantes cargados</b> para este mes (hueco del ${sinm.join(' y del ')}): ese año no se muestra, no se estima.</p>`;
  h+=cargando?`<p class="note">Cargando la historia de ${mn}…</p>`:HC['err'+mm]?`<p class="note">No se pudo cargar la historia de ${mn}; se muestra solo el periodo vivo.</p>`:'';
  return h;
}
function cmpSeccion(sel,ms){
  return `<div class="g" data-c="banco"><div class="blk"><h2>Comparativo con años anteriores · ${MES[Number(sel.slice(5))-1]}</h2><div class="chips">${ms.map(m=>`<button data-mes="${m}" aria-pressed="${m===sel}">${MES[Number(m.slice(5))-1].slice(0,3)} ${m.slice(2,4)}</button>`).join('')}</div><div id="cmp-b" data-mm="${sel.slice(5)}" data-sel="1">${cmpHtml(sel)}</div><p class="note">Faltan algunos comprobantes sueltos (por ejemplo 7 oct y 25 dic de 2022, 5 jun de 2023 y 11 al 14 feb de 2025). La historia cargada va de febrero de 2021 al 23 de agosto de 2025, con dos huecos sin comprobantes en el buzón: del 23 de julio al 15 de diciembre de 2024 y del 16 de mayo al 14 de julio de 2025; esos meses salen parciales o no aparecen y no se rellenan. 2021 fue de arranque del negocio y restricciones: ventas con tarjeta mucho menores.</p></div></div>`;
}
async function cmpCargar(sel){
  const mm=sel.slice(5);if(HC[mm]!==undefined)return;
  try{HC[mm]=await traerHist(mm);}catch(e){HC['err'+mm]=true;HC[mm]=[];}
  const b=$('cmp-b');if(b&&b.dataset.mm===mm)b.innerHTML=cmpHtml(sel);
}
function pintarIng(){
  const el=$('tab-ingresos');const ks=Object.keys(B).sort();
  if(!ks.length){el.innerHTML='<div class="g" data-c="banco"><div class="blk"><h2>Sin datos todavía</h2><p class="note">Los comprobantes del BCR aún no se han cargado.</p></div></div>';return;}
  const T=ks[ks.length-1],x=B[T],V=k=>B[k]?B[k].b:0;
  const wd=dts(T).getDay(),mismo=ks.filter(k=>dts(k).getDay()===wd&&k<T),pw=mean(mismo.map(V));
  const rk=[...ks].sort((a,b)=>V(b)-V(a)),pos=rk.indexOf(T)+1;
  const ayer=addd(T,-1),sem=addd(T,-7);
  const u30=ks.slice(-30).map(V);
  const kv=ks.filter(k=>B[k].v>0),tk=kv.map(k=>B[k].b/B[k].v),tn=kv.map(k=>B[k].n/B[k].v);   // días sin vouchers no entran al ticket (no se divide entre 0)
  const mk=T.slice(0,7);
  const sel=mesSel||mk;
  // ---- el día
  let h=T===hoyCR()?`<div class="dayl">Hoy · <b>${fl(T)}</b></div>`:`<div class="dayl">Último día con datos · <b>${fl(T)}</b> · reporte del BCR, que llega con un día de atraso</div>`;
  const raros=ks.slice(-30).filter(k=>{const w=dts(k).getDay(),ref=mean(ks.filter(z=>dts(z).getDay()===w&&z!==k).map(V));return ref&&(V(k)<0.4*ref||V(k)>2.5*ref);});
  RAROS=raros.map(k=>({k,v:V(k)}));
  if(raros.length)h+=`<div class="alerta"><b>Revisar ${raros.length===1?'un día':raros.length+' días'} con valores fuera de lo normal</b>${raros.map(k=>{const w=dts(k).getDay(),ref=mean(ks.filter(z=>dts(z).getDay()===w&&z!==k).map(V));return `<span>${fl(k)}: ${crc(V(k))} en tarjeta, frente a ${crc(ref)} de un ${DIA[w]} típico (${dif(V(k),ref)}). Puede faltar un comprobante o haber un problema con el datáfono.</span>`;}).join('')}</div>`;
  h+=C('banco',`<div class="hero"><div class="lbl">Ventas brutas con tarjeta</div><div class="num">${crc(x.b)}</div><span class="delta">${dif(x.b,pw)} frente al promedio de los ${DIA[wd]}${DIA[wd].endsWith('s')?'':'s'} (${crc(pw)})</span>${lineAx(u30,dlabs(ks.slice(-30)),v=>'₡'+cc(v))}</div>`);
  h+=kpis([{c:'banco',l:'Neto depositado',v:crc(x.n),s:p1(x.n/x.b)+' de la venta'},{c:'banco',l:'Comisión',v:crc(x.c),s:p2(x.c/x.b)+' de la venta'},{c:'banco',l:'Retenciones',v:crc(x.i+x.r),s:'IVA '+crc(x.i)+' · renta '+crc(x.r)},{c:'banco',l:'Comprobantes del día',v:fmt(x.k||1),s:(x.k>1?'se sumaron los '+x.k+' correos del depósito · ':'')+fmt(x.v)+' vouchers · ticket '+crc(x.b/x.v)}]);
  h+=`<div class="g c2" data-c="banco">`+
    table('El día frente a su contexto',['','Ventas brutas','Dif.'],[
      ['Ayer<small>'+fl(ayer)+'</small>',B[ayer]?crc(B[ayer].b):'—',B[ayer]?dif(x.b,B[ayer].b):'—'],
      ['Hace 7 días<small>'+fl(sem)+'</small>',B[sem]?crc(B[sem].b):'—',B[sem]?dif(x.b,B[sem].b):'—'],
      ['Promedio de los '+DIA[wd]+(DIA[wd].endsWith('s')?'':'s')+'<small>'+mismo.length+' semanas</small>',crc(pw),dif(x.b,pw)],
      ['Posición en el periodo<small>de mayor a menor</small>',pos+' de '+ks.length,''],
      ['Mejor día del periodo<small>'+fl(rk[0])+'</small>',crc(V(rk[0])),''],
      ['Día con menos venta<small>'+fl(rk[rk.length-1])+'</small>',crc(V(rk[rk.length-1])),'']])+
    bars('De la venta al depósito',[['Ventas brutas',x.b,'100 %'],['Comisión',x.c,p2(x.c/x.b)],['Retención de IVA',x.i,p2(x.i/x.b)],['Retención de renta',x.r,p2(x.r/x.b)],['Neto depositado',x.n,p2(x.n/x.b)]],crc,x.b,'El comprobante trae totales por lote y marca, no el monto de cada voucher. Por eso no hay mínimo ni máximo por voucher.')+`</div>`;
  // ---- mes en curso
  const dm=ks.filter(k=>k.slice(0,7)===mk),sm=a=>a.reduce((s,k)=>s+B[k].b,0);
  const mp=addd(mk+'-01',-1).slice(0,7),dp=ks.filter(k=>k.slice(0,7)===mp).slice(0,dm.length);
  const tot=f=>dm.reduce((s,k)=>s+B[k][f],0);
  const mesN=MES[Number(mk.slice(5))-1];
  h+=`<div class="dayl" style="margin-top:34px">Agregados del mes</div><div class="mes">${mesN}<small>${mk.slice(0,4)} · ${dm.length} ${dm.length==1?'día':'días'} con datos</small></div>`;
  h+=kpis([{c:'banco',l:'Ventas brutas acumuladas',v:crc(tot('b')),s:dp.length?dif(tot('b'),sm(dp))+' vs '+MES[Number(mp.slice(5))-1]+' (mismos días)':''},{c:'banco',l:'Promedio por día',v:crc(tot('b')/dm.length)},{c:'banco',l:'Neto acumulado',v:crc(tot('n')),s:p1(tot('n')/tot('b'))+' de la venta'},{c:'banco',l:'Comisión y retenciones acumuladas',v:crc(tot('c')+tot('i')+tot('r')),s:p1((tot('c')+tot('i')+tot('r'))/tot('b'))+' de la venta'}]);
  // ---- acumulado del año
  const ya=q=>ks.reduce((t,k)=>t+B[k][q],0),yb=ya('b'),yn=ya('n'),yc=ya('c'),yi=ya('i'),yr=ya('r'),yv=ya('v');
  h+=`<div class="dayl" style="margin-top:34px">Acumulado del periodo</div><div class="mes" style="text-transform:none">${dly(ks[0])} al ${dly(T)}<small>${ks.length} días con datos · cifras brutas salvo donde dice neto</small></div>`;
  h+=kpis([{c:'banco',l:'Ventas brutas acumuladas',v:crc(yb),s:crc(yb/ks.length)+' por día'},{c:'banco',l:'Neto acumulado',v:crc(yn),s:p1(yn/yb)+' de la venta'},{c:'banco',l:'Comisión y retenciones acumuladas',v:crc(yc+yi+yr),s:'comisión '+crc(yc)+' · IVA '+crc(yi)+' · renta '+crc(yr)},{c:'banco',l:'Vouchers acumulados',v:fmt(yv),s:'ticket '+crc(yb/yv)+' bruto · '+crc(yn/yv)+' neto'}]);
  h+=`<div class="g" data-c="banco"><div class="blk"><h2>Ventas brutas por mes · ${dly(ks[0]).replace(/^\d+ /,'')} a ${dly(T).replace(/^\d+ /,'')}</h2>${(()=>{const mm=[...new Set(ks.map(k=>k.slice(0,7)))],tv=mm.map(m=>ks.filter(k=>k.slice(0,7)===m).reduce((t,k)=>t+B[k].b,0)),pa=mm.map(m=>!(ks.filter(k=>k.slice(0,7)===m).length>=new Date(Number(m.slice(0,4)),Number(m.slice(5)),0).getDate())),t=ticks(0,Math.max(...tv)),hi=t[t.length-1];return axes(`<div class="bs g2">${tv.map((v,i)=>`<div class="${pa[i]?'pa':''}" style="height:${v/hi*100}%" title="${crc(v)}"><i>₡${cc(v)}</i></div>`).join('')}</div>`,t,0,hi,v=>'₡'+cc(v),lbM(mm),mm.length)+`<p class="lg">${pa.some(x=>x)?'La barra clara es un mes parcial ('+ks.filter(k=>k.slice(0,7)===mm[mm.length-1]).length+' días con datos).':''}</p>`;})()}</div></div>`;
  // ---- meses
  const ms=[...new Set(ks.map(k=>k.slice(0,7)))];
  const comp=ms.filter(m=>m!==mk||ks.filter(k=>k.slice(0,7)===m).length>=new Date(Number(m.slice(0,4)),Number(m.slice(5)),0).getDate());
  const mt=m=>ks.filter(k=>k.slice(0,7)===m).reduce((s,k)=>s+B[k].b,0);
  const mx=comp.reduce((a,m)=>mt(m)>mt(a)?m:a,comp[0]),mn=comp.reduce((a,m)=>mt(m)<mt(a)?m:a,comp[0]);
  h+=`<div class="g c2" data-c="banco">`+
    (x=>{const p=!comp.includes(mk);return p?x.replace(/<\/div>$/,`<p class="note">${MES[Number(mk.slice(5))-1][0].toUpperCase()+MES[Number(mk.slice(5))-1].slice(1)} es un mes parcial: sus ventas y neto suman solo ${dm.length} días. La columna comparable es Prom./día.</p></div>`):x;})(table('Mes por mes',['Mes','Ventas','Prom./día','Neto'],ms.map(m=>{const d=ks.filter(k=>k.slice(0,7)===m);const t=mt(m),n=d.reduce((s,k)=>s+B[k].n,0);const tg=m===mx?'<span class="tag">más venta</span>':m===mn?'<span class="tag lo">menos venta</span>':'';return [mesL(m)+tg+(m===mk&&!comp.includes(m)?`<span class="tag par">parcial</span><small>${d.length} días</small>`:''),crc(t),crc(t/d.length),crc(n)];})))+
    (()=>{const dow=Array(7).fill(0),dn=Array(7).fill(0);ks.forEach(k=>{const i=(dts(k).getDay()+6)%7;dow[i]+=V(k);dn[i]++;});const pr=dow.map((v,i)=>v/Math.max(dn[i],1));return cols('Venta bruta promedio por día de la semana',pr,['L','M','K','J','V','S','D'],'Más alto: '+['lunes','martes','miércoles','jueves','viernes','sábado','domingo'][pr.indexOf(Math.max(...pr))]+' ('+crc(Math.max(...pr))+'). Más bajo: '+['lunes','martes','miércoles','jueves','viernes','sábado','domingo'][pr.indexOf(Math.min(...pr))]+' ('+crc(Math.min(...pr))+').',1,v=>'₡'+cc(v),1);})()+`</div>`;
  // ---- días del mes
  const dsel=ks.filter(k=>k.slice(0,7)===sel),vs=dsel.map(V),bm=Math.max(...vs),wm=Math.min(...vs);
  const nd=new Date(Number(sel.slice(0,4)),Number(sel.slice(5)),0).getDate(),dv=Array(nd).fill(0);dsel.forEach(k=>dv[Number(k.slice(8))-1]=V(k));
  const dlb=dv.map((_,i)=>[1,5,10,15,20,25,nd].includes(i+1)?String(i+1):'');
  h+=`<div class="g" data-c="banco"><div class="blk"><h2>Días de ${mesL(sel)} · ventas brutas</h2><div class="chips">${ms.map(m=>`<button data-mes="${m}" aria-pressed="${m===sel}">${mesC(m)}</button>`).join('')}</div>
   <div class="mg"><div><table class="tb"><thead><tr><th>Día</th><th>Ventas</th><th>Vouchers</th><th>Ticket</th></tr></thead><tbody>${dsel.map(k=>{const b=B[k];const tg=b.b===bm?'<span class="tag">mejor</span>':b.b===wm?'<span class="tag lo">menor</span>':'';return `<tr><td>${Number(k.slice(8))} ${DIA[dts(k).getDay()].slice(0,3)}${tg}${b.rev?'<small>total del comprobante por revisar</small>':''}${b.k>1?'<small>'+b.k+' comprobantes sumados</small>':''}</td><td>${mo(crc(b.b))}</td><td>${fmt(b.v)}</td><td>${mo(crc(b.v>0?b.b/b.v:NaN))}</td></tr>`;}).join('')}</tbody></table></div>
   <div class="c">${barsAx(dv,dlb,v=>'₡'+cc(v),0,mean(vs))}<p class="lg"><b style="border-top-style:dashed;border-top-width:1px"></b>Promedio del mes ${crc(mean(vs))}</p></div></div></div></div>`;
  // ---- tendencia
  const ma=(n,end)=>{const a=ks.slice(Math.max(0,end-n),end);return mean(a.map(V));};
  const L=ks.length,m7=ma(7,L),m7p=ma(7,L-7),m30=ma(30,L),m30p=ma(30,L-30);
  h+=`<div class="dayl" style="margin-top:34px">Tendencia</div>`+kpis([{c:'banco',l:'Promedio móvil 7 días',v:crc(m7),s:dif(m7,m7p)+' vs 7 días previos'},{c:'banco',l:'Promedio móvil 30 días',v:crc(m30),s:dif(m30,m30p)+' vs 30 días previos'},{c:'banco',l:'Promedio del periodo',v:crc(mean(ks.map(V))),s:ks.length+' días'},{c:'banco',l:'Variación diaria',v:p1(sd(ks.map(V))/mean(ks.map(V))),s:'coef. de variación de las ventas'}]);
  h+=`<div class="g" data-c="banco">${cols('Ventas brutas diarias · últimos 60 días',ks.slice(-60).map(V),dlabs(ks.slice(-60)),null,0,v=>'₡'+cc(v))}</div>`;
  // ---- ticket
  const n=mean(ks.map(k=>B[k].v)),t30=tk.slice(-30),n30=tn.slice(-30);
  const pond=ks.reduce((s,k)=>s+B[k].b,0)/ks.reduce((s,k)=>s+B[k].v,0),pondn=ks.reduce((s,k)=>s+B[k].n,0)/ks.reduce((s,k)=>s+B[k].v,0);
  h+=`<div class="g c2" data-c="banco">`+
    table('Ticket medio',['','Bruto','Neto'],[
      ['Del día<small>'+fl(T)+'</small>',x.v>0?crc(x.b/x.v):'—',x.v>0?crc(x.n/x.v):'—'],
      ['Ponderado del periodo<small>ventas ÷ vouchers</small>',crc(pond),crc(pondn)],
      ['Promedio de los tickets diarios',crc(mean(tk)),crc(mean(tn))],
      ['Desviación estándar diaria',crc(sd(tk)),crc(sd(tn))],
      ['Coeficiente de variación',p1(sd(tk)/mean(tk)),p1(sd(tn)/mean(tn))],
      ['Últimos 30 días<small>desviación estándar</small>',crc(sd(t30)),crc(sd(n30))],
      ['Últimos 30 días<small>coef. de variación</small>',p1(sd(t30)/mean(t30)),p1(sd(n30)/mean(n30))],
      ['Desviación por voucher<small>estimada: s·√n, con n = '+fmt(n)+' vouchers al día</small>',crc(sd(tk)*Math.sqrt(n)),crc(sd(tn)*Math.sqrt(n))]])+
    table('Comisión y retenciones por mes',['Mes','Comisión','Ret. IVA','Ret. renta'],ms.map(m=>{const d=ks.filter(k=>k.slice(0,7)===m),f=q=>d.reduce((s,k)=>s+B[k][q],0);return [mesL(m),crc(f('c')),crc(f('i')),crc(f('r'))];}).concat([['Acumulado del periodo',crc(ks.reduce((s,k)=>s+B[k].c,0)),crc(ks.reduce((s,k)=>s+B[k].i,0)),crc(ks.reduce((s,k)=>s+B[k].r,0))]]))+`</div>`;
  const nrev=ks.filter(k=>B[k].rev).length;
  h+=cmpSeccion(sel,ms);
  h+=sinpeHtml();
  if(nrev)h+=`<p class="note">${nrev} días tienen el total impreso del comprobante inconsistente con la suma de sus lotes. Aquí se usa siempre la suma de los lotes.</p>`;
  el.innerHTML=h;
  el.querySelectorAll('[data-mes]').forEach(b=>b.onclick=()=>{mesSel=b.dataset.mes;pintarIng();});
  cmpCargar(sel);
}

/* ---- Redes sociales (Meta, API oficial) ---- */
let M=[];
async function traerMeta(){let all=[],from=0;for(;;){const {data,error}=await sb.from('panel_metricas').select('fecha,sitio,metrica,valor').eq('fuente','meta').gte('fecha',addd(HOYCR(),-61)).order('fecha').order('id').range(from,from+999);if(error)throw error;all=all.concat(data);if(data.length<1000)break;from+=1000;}return all;}
const CUENTAS=[['fb-soda','Facebook · Soda La Bomba'],['fb-pollos','Facebook · Pollos La Bomba & PAPEA'],['ig-sodaypolloslabomba','Instagram · @sodaypolloslabomba']];
// métrica equivalente en Facebook e Instagram
const EQ={vistas:{fb:'page_media_view',ig:'views'},alcance:{fb:'page_total_media_view_unique',ig:'reach'},perfil:{fb:'page_views_total',ig:'profile_views'},inter:{fb:'page_post_engagements',ig:'total_interactions'},nuevos:{fb:'page_daily_follows_unique',ig:'seguidores_nuevos'}};
const mk=(s,k)=>EQ[k][s.slice(0,2)];
const mv=(s,m,f)=>M.filter(r=>r.sitio===s&&r.metrica===m&&(!f||r.fecha===f)).reduce((a,r)=>a+Number(r.valor),0);
const mserie=(k,ds,ss)=>ds.map(d=>(ss||CUENTAS.map(c=>c[0])).reduce((a,s)=>a+mv(s,mk(s,k),d),0));
const msnap=(s,m)=>{const a=M.filter(r=>r.sitio===s&&r.metrica===m).sort((x,y)=>x.fecha<y.fecha?-1:1);return a.length?Number(a[a.length-1].valor):0;};
function pintarRedes(){
  const el=$('tab-redes');
  if(!M.length){el.innerHTML='<div class="blk"><h2>Sin datos de Meta todavía</h2><p class="note">La conexión con Meta se actualiza dos veces al día.</p></div>';return;}
  const hoy=new Date().toLocaleDateString('en-CA',{timeZone:'America/Costa_Rica'});
  const ds=[];for(let i=29;i>=0;i--)ds.push(addd(hoy,-i));
  const S=CUENTAS.map(c=>c[0]);
  const seg=S.reduce((a,s)=>a+msnap(s,'seguidores'),0);
  const tot=(k,f)=>S.reduce((a,s)=>a+mv(s,mk(s,k),f),0);
  const t30=k=>mserie(k,ds).reduce((a,b)=>a+b,0);
  let h=`<div class="dayl">Hoy · <b>${fl(hoy)}</b> · datos parciales hasta la última actualización</div>`;
  h+=kpis([
    {c:'redes',l:'Seguidores',v:fmt(seg),s:CUENTAS.map(c=>c[1].split(' · ')[1].replace('Soda La Bomba','Soda').replace('Pollos La Bomba & PAPEA','Pollos')+' '+fmt(msnap(c[0],'seguidores'))).join(' · ')},
    {c:'redes',l:'Vistas de contenido',v:fmt(tot('vistas',hoy)),s:'ayer '+fmt(tot('vistas',addd(hoy,-1)))},
    {c:'redes',l:'Visitas a los perfiles',v:fmt(tot('perfil',hoy)),s:'ayer '+fmt(tot('perfil',addd(hoy,-1)))},
    {c:'redes',l:'Interacciones',v:fmt(tot('inter',hoy)),s:'me gusta, comentarios, compartidos y guardados'}]);
  h+=`<div class="dayl">Últimos 30 días</div><div class="g c2" data-c="redes">${cols('Vistas de contenido por día',mserie('vistas',ds),dlabs(ds),'Eje vertical: vistas (una persona puede contar varias veces), Facebook e Instagram sumados. Eje horizontal: fecha, de la más antigua a la más reciente.',1,fmt)}${cols('Seguidores nuevos por día',mserie('nuevos',ds),dlabs(ds),'Eje vertical: seguidores nuevos en las tres cuentas. Eje horizontal: fecha.',1,fmt)}</div>`;
  h+=`<div class="g c2" data-c="redes">${cols('Visitas a los perfiles por día',mserie('perfil',ds),dlabs(ds),'Eje vertical: visitas a la página de Facebook o al perfil de Instagram. Eje horizontal: fecha.',1,fmt)}${cols('Interacciones por día',mserie('inter',ds),dlabs(ds),'Eje vertical: me gusta, comentarios, compartidos y guardados. Eje horizontal: fecha.',1,fmt)}</div>`;
  const s30=(k,s)=>mserie(k,ds,[s]).reduce((a,b)=>a+b,0),f1=x=>x.toFixed(1).replace('.',',');
  h+=`<div class="g c2" data-c="redes">`+table('Audiencia por cuenta · 30 días',['Cuenta','Seguidores','Nuevos','Visitas al perfil'],CUENTAS.map(([s,n])=>[n,fmt(msnap(s,'seguidores')),fmt(s30('nuevos',s)),fmt(s30('perfil',s))]))+table('Contenido por cuenta · 30 días',['Cuenta','Vistas','Alcance por día','Interacciones','Por 100 vistas'],CUENTAS.map(([s,n])=>{const v=s30('vistas',s),it=s30('inter',s);return [n,fmt(v),f1(mean(mserie('alcance',ds,[s]))),fmt(it),v?f1(it/v*100):'—'];}))+`</div>`;
  const vv=mserie('vistas',ds),m=mean(vv),dv=sd(vv);
  h+=`<p class="note">Vistas en 30 días: ${fmt(t30('vistas'))}, promedio ${fmt(m)} por día, desviación estándar ${fmt(dv)}${m?', coeficiente de variación '+p1(dv/m):''}. El alcance es de personas distintas en cada día; no se suma entre días porque la misma persona se repetiría. Datos de la API oficial de Meta, actualizados a las 12:45 p. m. y a las 11:50 p. m. La página de Pollos La Bomba todavía no tiene Instagram vinculado.</p>`;
  el.innerHTML=h;
}

/* ---- utilidades comunes de Pedidos web y Páginas ---- */
const TZ='America/Costa_Rica';
const dCR=ts=>new Date(ts).toLocaleDateString('en-CA',{timeZone:TZ});
const hCR=ts=>Number(new Date(ts).toLocaleString('en-GB',{timeZone:TZ,hour:'2-digit',hour12:false}).slice(0,2))%24;
const dowCR=ts=>(new Date(dCR(ts)+'T12:00:00').getDay()+6)%7;
const lineaNombre=i=>i.prisma_modificador||((i.producto||'')+(i.opcion?' ('+i.opcion+')':''));
const prodNombre=i=>i.prisma_producto||i.producto||i.prisma_modificador||'';
const lineaMonto=i=>(Number(i.precio_unitario)||0)*(Number(i.cantidad)||1);
function stdev(a){if(a.length<2)return 0;const m=a.reduce((x,y)=>x+y,0)/a.length;return Math.sqrt(a.reduce((x,y)=>x+(y-m)**2,0)/(a.length-1));}
function mediana(a){if(!a.length)return 0;const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;}
const RANGOS=[[0,1500,'Menos de ₡1.500'],[1500,3000,'₡1.500 a ₡2.999'],[3000,5000,'₡3.000 a ₡4.999'],[5000,10000,'₡5.000 a ₡9.999'],[10000,20000,'₡10.000 a ₡19.999'],[20000,1e12,'₡20.000 o más']];
const rangoDe=v=>RANGOS.findIndex(r=>v>=r[0]&&v<r[1]);
async function traerTabla(t,campos,ord2,desde){let all=[],from=0;for(;;){let q=sb.from(t).select(campos);if(desde)q=q.gte('creado_en',desde);q=q.order('creado_en');if(ord2)q=q.order(ord2);const {data,error}=await q.range(from,from+999);if(error)throw error;all=all.concat(data);if(data.length<1000)break;from+=1000;}return all;}
function heat(titulo,M,filas,colsL,sub){const mx=Math.max(1,...M.flat());return `<div class="blk"><h2>${titulo}</h2><div class="hm"><table><thead><tr><th></th>${colsL.map(c=>`<th>${c}</th>`).join('')}</tr></thead><tbody>${M.map((r,i)=>`<tr><th>${filas[i]}</th>${r.map(v=>`<td class="${v/mx>.72?'hi':''}" style="background:rgba(184,22,34,${(v/mx*0.85).toFixed(2)})" title="${fmt(v)}">${v?fmt(v):''}</td>`).join('')}</tr>`).join('')}</tbody></table></div>${sub?`<p class="note">${sub}</p>`:''}</div>`;}
const visitasEn=(desdeF)=>rows({fuente:'goatcounter',metrica:'visitas'}).filter(r=>r.fecha>=desdeF).reduce((a,r)=>a+Number(r.valor),0);

/* ---- Pedidos web: decisiones de compra ---- */
function pintarPed(P,K){
  const hoy=dCR(Date.now());
  const ds=[];for(let i=29;i>=0;i--)ds.push(dCR(Date.now()-i*864e5));
  const NOW=Date.now(),ABAND=30*60e3,aband=c=>!c.enviado&&NOW-new Date(c.actualizado_en).getTime()>ABAND;
  const monto=a=>a.reduce((x,p)=>x+(Number(p.total)||0),0);
  const Ph=P.filter(p=>dCR(p.creado_en)===hoy),Kh=K.filter(c=>dCR(c.creado_en)===hoy),kA=K.filter(aband);
  const tk=P.map(p=>Number(p.total)||0).filter(v=>v>0),tm=tk.length?tk.reduce((a,b)=>a+b,0)/tk.length:0,sd=stdev(tk);
  let h=`<div class="dayl">Hoy · <b>${fl(hoy)}</b></div>`+kpis([
    {c:'ventas',l:'Pedidos web',v:fmt(Ph.length),s:'Soda '+Ph.filter(p=>p.sitio==='soda').length+' · Pollos '+Ph.filter(p=>p.sitio==='pollos').length},
    {c:'ventas',l:'Monto de los pedidos',v:crc(monto(Ph)),s:'bruto, sin envío ni precios por confirmar'},
    {c:'ventas',l:'Ticket del día',v:Ph.length?crc(monto(Ph)/Ph.length):'—',s:'frente a '+crc(tm)+' de los 30 días'},
    {c:'ped',l:'Carritos sin enviar',v:fmt(Kh.filter(aband).length),s:'de '+fmt(Kh.length)+' carritos armados hoy'}]);
  // embudo y ticket
  const d14=ds[16],v14=visitasEn(d14),k14=K.filter(c=>dCR(c.creado_en)>=d14).length,p14=P.filter(p=>dCR(p.creado_en)>=d14).length;
  h+=`<div class="dayl">Últimos 30 días</div><div class="g c2">`+C('visitas',bars('Embudo de los últimos 14 días',[['Visitas',v14,'personas que abrieron una página'],['Carritos armados',k14,pct(k14,v14)+' de las visitas'],['Pedidos enviados',p14,pct(p14,k14)+' de los carritos']],fmt,null,'Mismo periodo para las tres cifras. Las visitas no cuentan las páginas de prueba; los carritos y pedidos sí.'))+
    C('ped',`<div class="blk"><h2>Carritos sin enviar</h2><div class="br"><div class="t"><b>Abandonados</b><i>${fmt(kA.length)}</i></div><div class="s2">más de 30 minutos sin enviarse · ${pct(kA.length,K.length)} de los carritos</div></div><div class="br"><div class="t"><b>Monto que quedó sin enviar</b><i>${crc(monto(kA))}</i></div><div class="s2">bruto, con los precios conocidos</div></div><div class="br"><div class="t"><b>Ticket de los abandonados</b><i>${kA.length?crc(monto(kA)/kA.length):'—'}</i></div><div class="s2">frente a ${crc(tm)} de los enviados</div></div></div>`)+`</div>`;
  const ret=P.filter(p=>/^Retiro/i.test(p.direccion||'')),exp=P.filter(p=>!/^Retiro/i.test(p.direccion||''));
  h+=kpis([{c:'ventas',l:'Ticket promedio',v:crc(tm),s:'bruto, '+fmt(tk.length)+' pedidos con precio'},{c:'ventas',l:'Desviación estándar',v:crc(sd),s:'coeficiente de variación '+(tm?(sd/tm*100).toFixed(0)+' %':'—')},{c:'ventas',l:'Mediana',v:crc(mediana(tk)),s:'la mitad de los pedidos está por debajo'},{c:'ventas',l:'Express / retiro',v:fmt(exp.length)+' / '+fmt(ret.length),s:'ticket '+(exp.length?crc(monto(exp)/exp.length):'—')+' / '+(ret.length?crc(monto(ret)/ret.length):'—')}]);
  // rangos de ticket
  const rN=RANGOS.map(()=>0),rM=RANGOS.map(()=>0);tk.forEach(v=>{const i=rangoDe(v);rN[i]++;rM[i]+=v;});
  h+=`<div class="g c2" data-c="ventas">${bars('Pedidos por rango de monto',RANGOS.map((r,i)=>[r[2],rN[i],pct(rM[i],tk.reduce((a,b)=>a+b,0))+' del monto']),v=>fmt(v)+' ped.',null,'Mismos rangos que SINPE Móvil para poder compararlos.')}${(()=>{const n=[1,2,3,4].map(c=>P.filter(p=>{const u=(p.items||[]).reduce((a,i)=>a+(Number(i.cantidad)||1),0);return c<4?u===c:u>=4;}));return cols('Ticket según cantidad de productos',n.map(a=>a.length?monto(a)/a.length:0),['1','2','3','4 o más'],'Eje vertical: ticket promedio bruto. Eje horizontal: unidades en el pedido. '+n.map((a,i)=>['1','2','3','4+'][i]+': '+a.length+' ped.').join(' · '),1,v=>'₡'+cc(v));})()}</div>`;
  // tiempo
  const lab=ds.map((d,i)=>(29-i)%7===0?dl(d):'');
  const pDia=ds.map(d=>P.filter(p=>dCR(p.creado_en)===d).length);
  const abDia=ds.map(d=>{const k=K.filter(c=>dCR(c.creado_en)===d&&(c.enviado||aband(c)));return k.length?Math.round(k.filter(aband).length/k.length*100):0});
  h+=`<div class="g c2">${C('ventas',cols('Pedidos por día',pDia,lab,'Eje vertical: pedidos. Eje horizontal: fecha, de la más antigua a la más reciente.',1,fmt))}${C('ped',cols('Abandono de carritos por día',abDia,lab,'Eje vertical: % de carritos que no se enviaron. Eje horizontal: fecha.',1,v=>v+' %'))}</div>`;
  const FR=[[0,6,'Madrugada 0–5'],[6,10,'Mañana 6–9'],[10,14,'Mediodía 10–13'],[14,18,'Tarde 14–17'],[18,21,'Noche 18–20'],[21,24,'Noche 21–23']];
  const HM=FR.map(f=>[0,1,2,3,4,5,6].map(d=>P.filter(p=>dowCR(p.creado_en)===d&&hCR(p.creado_en)>=f[0]&&hCR(p.creado_en)<f[1]).length));
  h+=`<div class="g" data-c="ventas">${heat('Cuándo piden: día de la semana y franja horaria',HM,FR.map(f=>f[2]),['L','M','K','J','V','S','D'],'Pedidos de los últimos 30 días. Más oscuro, más pedidos. Sirve para ver turnos de cocina y de mensajeros.')}</div>`;
  // productos
  const uP={},mP={},uA={};P.forEach(p=>(p.items||[]).forEach(i=>{const n=lineaNombre(i);uP[n]=(uP[n]||0)+(Number(i.cantidad)||1);mP[n]=(mP[n]||0)+lineaMonto(i);}));
  kA.forEach(c=>(c.items||[]).forEach(i=>{const n=lineaNombre(i);uA[n]=(uA[n]||0)+(Number(i.cantidad)||1);}));
  const top=o=>Object.entries(o).sort((a,b)=>b[1]-a[1]).slice(0,10);
  h+=`<div class="g c2">${C('ventas',bars('Más pedidos',top(uP),fmt,null,'Unidades. Las bebidas salen con el nombre de Prisma.'))}${C('ventas',bars('Los que más venden',top(mP),v=>'₡'+cc(v),null,'Monto bruto por producto, con los precios conocidos.'))}</div>`;
  const tasa=Object.keys({...uP,...uA}).map(n=>[n,(uA[n]||0)/((uA[n]||0)+(uP[n]||0)),(uA[n]||0)+(uP[n]||0)]).filter(x=>x[2]>=3).sort((a,b)=>b[1]-a[1]).slice(0,10);
  h+=`<div class="g c2">${C('ped',bars('Más dejados en carritos abandonados',top(uA),fmt,null,'Unidades que se quedaron sin enviar.'))}${C('ped',bars('Tasa de abandono por producto',tasa.map(x=>[x[0],Math.round(x[1]*100),fmt(x[2])+' unidades en total']),v=>v+' %',100,'Solo productos con 3 unidades o más. Una tasa alta puede indicar precio, opciones confusas o falta de foto.'))}</div>`;
  // combinaciones
  const par={};P.forEach(p=>{const s=[...new Set((p.items||[]).map(prodNombre).filter(Boolean))].sort();for(let a=0;a<s.length;a++)for(let b=a+1;b<s.length;b++){const k=s[a]+' + '+s[b];par[k]=(par[k]||0)+1;}});
  const pares=Object.entries(par).sort((a,b)=>b[1]-a[1]).slice(0,8);
  const abP=RANGOS.map(r=>{const k=K.filter(c=>(c.enviado||aband(c))&&Number(c.total)>=r[0]&&Number(c.total)<r[1]);return k.length?Math.round(k.filter(aband).length/k.length*100):0;});
  h+=`<div class="g c2">${C('ventas',pares.length?bars('Combinaciones frecuentes',pares.map(x=>[x[0],x[1],pct(x[1],P.length)+' de los pedidos']),v=>fmt(v)+' ped.',null,'Productos que se piden juntos. Sirve para armar combos y sugerencias.'):'<div class="blk"><h2>Combinaciones frecuentes</h2><p class="note">Todavía no hay pedidos con dos productos distintos.</p></div>')}${C('ped',cols('Abandono según el valor del carrito',abP,['<1,5k','1,5–3k','3–5k','5–10k','10–20k','20k+'],'Eje vertical: % de carritos de ese rango que no se enviaron. Eje horizontal: valor del carrito en colones. Si sube con el valor, el precio frena la compra.',1,v=>v+' %'))}</div>`;
  // clientes
  const tel={};P.forEach(p=>{const t=(p.cliente_telefono||'').replace(/\D/g,'');if(t)(tel[t]=tel[t]||[]).push(new Date(p.creado_en).getTime());});
  const cl=Object.values(tel),rep=cl.filter(a=>a.length>1),gaps=rep.flatMap(a=>a.sort((x,y)=>x-y).slice(1).map((v,i)=>(v-a[i])/864e5));
  h+=kpis([{c:'redes',l:'Clientes distintos',v:fmt(cl.length),s:'teléfonos en 30 días'},{c:'redes',l:'Clientes que repiten',v:fmt(rep.length),s:pct(rep.length,cl.length)+' de los clientes'},{c:'redes',l:'Días entre pedidos',v:gaps.length?(gaps.reduce((a,b)=>a+b,0)/gaps.length).toFixed(1).replace('.',','):'—',s:'promedio de los que repiten'},{c:'redes',l:'Pedidos por cliente',v:cl.length?(P.length/cl.length).toFixed(2).replace('.',','):'—',s:'en 30 días'}]);
  h+=`<p class="note">Montos brutos, sin costo de envío. Un carrito cuenta como abandonado si pasa más de 30 minutos sin enviarse. Los teléfonos solo se cuentan; el panel no muestra datos personales. Cruces que vienen: pedidos web frente a ingresos por SINPE y tarjeta del mismo día, y conversión por origen de la visita.</p>`;
  $('tab-pedidos').innerHTML=h;
}

/* ---- Páginas: quién llega, de dónde y qué hace ---- */
const INTENCION=[
  ['Pedir: abrir el menú o una categoría',p=>/^(soda|pollos)-menu|^chip-|menu-a-pedido/.test(p)],
  ['Escribir por WhatsApp',p=>/-wa$/.test(p)],
  ['Cómo llegar: Maps o Waze',p=>/^info-(maps|waze)$/.test(p)],
  ['Ver la zona de entrega',p=>p==='zona-entrega'],
  ['Dejar o leer reseñas',p=>/resena|^red-g$/.test(p)],
  ['Ir a redes sociales',p=>/^red-(ig|fb)$|nosotros-(instagram|facebook)/.test(p)],
  ['Pasar a otro negocio',p=>/^(sites|fam|cross)-|hero-papea|pollos-a-papea/.test(p)],
  ['Ver información',p=>p==='bbar-info'],
  ['Inscribirse a novedades',p=>p==='novedades-enviado']];
const PAG={'/':'Inicio','/nosotros':'Nosotros','/pollos/':'Menú de Pollos','/papea/':'Papea','/privacidad':'Privacidad'};
function pintarPag(){
  const g=o=>groups(Object.assign({fuente:'goatcounter'},o));
  const fv=rows({fuente:'goatcounter',metrica:'visitas'}).map(r=>r.fecha).sort().pop();
  const ds=[...new Set(rows({fuente:'goatcounter',metrica:'visitas'}).map(r=>r.fecha))].sort(),visT=sum({fuente:'goatcounter',metrica:'visitas'});
  const dv=(s,f)=>rows({fuente:'goatcounter',metrica:'visitas',sitio:s}).filter(r=>r.fecha===f).reduce((a,r)=>a+Number(r.valor),0);
  const dev=g({metrica:'dispositivo'}),devT=dev.reduce((a,x)=>a+x[1],0),cel=(dev.find(x=>x[0]==='Celular')||[0,0])[1];
  const ORG={ig:'Instagram',fb:'Facebook',l:'Facebook','Directo o WhatsApp':'Directo'};
  const og=Object.entries(g({metrica:'origen'}).reduce((m,[k,v])=>{const n=ORG[k]||k;m[n]=(m[n]||0)+v;return m},{})).sort((a,b)=>b[1]-a[1]),ogT=og.reduce((a,x)=>a+x[1],0);
  let h=fv?`<div class="dayl">Último día con datos · <b>${fl(fv)}</b></div>`+kpis([{c:'visitas',l:'Visitas',v:fmt(dv('soda',fv)+dv('pollos',fv)),s:'Soda '+fmt(dv('soda',fv))+' · Pollos y Papea '+fmt(dv('pollos',fv))},{c:'visitas',l:'Desde el celular',v:pct(cel,devT),s:'de las visitas de 14 días'},{c:'visitas',l:'Llegan más desde',v:og[0]?esc(og[0][0]):'—',s:og[0]?pct(og[0][1],ogT)+' de las llegadas':''},{c:'visitas',l:'Visitas en 14 días',v:fmt(visT),s:fmt(visT/Math.max(ds.length,1))+' por día'}]):'';
  h+=`<div class="dayl">Últimos 14 días</div><div class="g" data-c="visitas">${cols('Visitas por día',ds.map(d=>dv('soda',d)+dv('pollos',d)),dlabs(ds),'Eje vertical: visitas a las dos páginas. Eje horizontal: fecha, de la más antigua a la más reciente.',1,fmt)}</div>`;
  // intención
  const cl=g({metrica:'clic'}),it=INTENCION.map(([n,f])=>[n,cl.filter(([p])=>f(p)).reduce((a,x)=>a+x[1],0)]).filter(x=>x[1]>0).sort((a,b)=>b[1]-a[1]);
  h+=`<div class="g c2" data-c="visitas">${bars('Qué hacen al llegar',it.map(x=>[x[0],x[1],pct(x[1],visT)+' de las visitas']),fmt,null,'Toques en botones, agrupados por intención.')}${bars('De dónde llegan',og,v=>pct(v,ogT),null,'WhatsApp y Cartel NFC se cuentan desde el 16 de noviembre, con enlaces marcados; antes esas visitas se sumaban a «Directo».')}</div>`;
  h+=`<div class="g c2" data-c="visitas">${bars('Dispositivos',dev,v=>pct(v,devT))}${table('Por negocio',['Negocio','Visitas','Pedir','WhatsApp','Cómo llegar'],['soda','pollos'].map(s=>{const c=g({metrica:'clic',sitio:s}),vv=sum({fuente:'goatcounter',metrica:'visitas',sitio:s}),q=f=>pct(c.filter(([p])=>f(p)).reduce((a,x)=>a+x[1],0),vv);return [s==='soda'?NEG.soda:'Pollos y Papea',fmt(vv),q(INTENCION[0][1]),q(INTENCION[1][1]),q(INTENCION[2][1])];}))}</div>`;
  // WhatsApp: toques a los botones, separados de todo lo demás
  const WAN={'hero-wa':'Entrada de la página','soda-wa':'Menú de la Soda','info-wa':'Información del menú'};
  const wab=cl.filter(([p])=>/-wa$/.test(p)).map(([p,v])=>[WAN[p]||p.replace(/-wa$/,'').replace(/-/g,' '),v]);
  const wao=og.filter(x=>x[0]==='WhatsApp'||x[0]==='Cartel NFC');
  h+=`<div class="g c2" data-c="visitas">${wab.length?bars('Toques a WhatsApp, por botón',wab,fmt,null,'Cada toque en un botón de WhatsApp de las páginas.'):'<div class="blk"><h2>Toques a WhatsApp, por botón</h2><p class="note">Sin toques en estos días.</p></div>'}${wao.length?bars('Llegadas por WhatsApp y cartel NFC',wao,v=>pct(v,ogT),null,'Visitas que entraron por un enlace marcado de WhatsApp o por el cartel NFC.'):'<div class="blk"><h2>Llegadas por WhatsApp y cartel NFC</h2><p class="note">Empieza a contar cuando se comparta un enlace marcado (con ?ref=whatsapp) o se lea el cartel NFC (?ref=nfc).</p></div>'}</div>`;
  // menú
  const CH=['Desayunos y gallos','Casados y platos fuertes','Extras','Antojitos','Pollo','Hamburguesas','Pizzas','Combos y baldes','Bebidas y postres'];
  const cat=cl.filter(([p])=>p.startsWith('chip-')).map(([p,v])=>{const k=p.slice(5);return [/^\d+$/.test(k)?(CH[+k]||k)+' (Soda)':k.replace(/-/g,' ')+' (Pollos)',v];});
  const ab={},ag={};cl.forEach(([p,v])=>{if(p.startsWith('p-abrir/'))ab[p.slice(8)]=(ab[p.slice(8)]||0)+v;if(p.startsWith('p-agregar/'))ag[p.slice(10)]=(ag[p.slice(10)]||0)+v;});
  const nom=s=>s.replace(/-/g,' ').replace(/^./,c=>c.toUpperCase());
  const pa=Object.keys(ab).map(k=>[esc(nom(k)),ab[k],ag[k]||0]).sort((a,b)=>b[1]-a[1]).slice(0,10);
  const bus=cl.filter(([p])=>p.startsWith('buscar/')).map(([p,v])=>[p.slice(7).replace(/-/g,' '),v]).slice(0,10),sin=cl.filter(([p])=>p.startsWith('buscar-sin/')).map(([p,v])=>[p.slice(11).replace(/-/g,' '),v]).slice(0,10);
  const sv=t=>(cl.find(([p])=>p===t)||[0,0])[1];
  h+=`<div class="dayl" style="margin-top:34px">El menú por dentro</div><div class="g c2" data-c="visitas">${cat.length?bars('Categorías más abiertas',cat.slice(0,10)):'<div class="blk"><h2>Categorías más abiertas</h2><p class="note">Sin datos todavía.</p></div>'}${pa.length?table('Productos abiertos y agregados',['Producto','Abiertos','Agregados','% agregado'],pa.map(x=>[x[0],fmt(x[1]),fmt(x[2]),pct(x[2],x[1])])):'<div class="blk"><h2>Productos abiertos y agregados</h2><p class="note">Empieza a contar cuando la página nueva reemplace a la publicada.</p></div>'}</div>`;
  h+=`<div class="g c2" data-c="visitas">${bus.length?bars('Lo que más buscan',bus):'<div class="blk"><h2>Lo que más buscan</h2><p class="note">Sin datos todavía.</p></div>'}${sin.length?bars('Buscaron y no encontraron',sin,fmt,null,'Productos que la gente espera y no ve en el menú.'):'<div class="blk"><h2>Buscaron y no encontraron</h2><p class="note">Sin datos todavía.</p></div>'}</div>`;
  const sg=[['Bebida grande','sug-bebida-grande'],['Bebida','sug-bebida'],['Papea','sug-papea']].map(([n,t])=>[n,sv(t+'-visto'),sv(t),sv(t+'-agregada')]).filter(x=>x[1]||x[2]);
  if(sg.length)h+=`<div class="g" data-c="visitas">${table('Sugerencias del carrito',['Sugerencia','Vistas','Tocadas','Agregadas','% agregadas'],sg.map(x=>[x[0],fmt(x[1]),fmt(x[2]),fmt(x[3]),pct(x[3],x[1])]))}</div>`;
  const pg=['soda','pollos'].flatMap(s=>g({metrica:'pagina',sitio:s}).map(([p,v])=>[(PAG[p]||p)+(s==='soda'?' de la Soda':' de Pollos'),v])).sort((a,b)=>b[1]-a[1]).slice(0,8);
  h+=`<div class="g" data-c="visitas">${bars('Páginas más vistas',pg)}</div>`;
  h+=`<p class="note">Datos anónimos de GoatCounter, sin datos personales. Las páginas de prueba no se cuentan: los eventos nuevos del menú (productos, búsquedas, zona de entrega y sugerencias) empiezan a sumar cuando la página nueva reemplace a la publicada.</p>`;
  $('tab-paginas').innerHTML=h;
}


/* ---- Gastos, Impuestos y Hoy ---- */
let RAROS=[],EMP='grupo',SEC='hoy',GG={},II={},INV={},BZ={},PED=[],FIN_ERR=false;
const EMPN={grupo:'Grupo DMA-La Bomba',soda:'Soda La Bomba',pollos:'Pollos La Bomba y Papea'};
const MS3=['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
const ml=m=>MS3[+m.slice(5,7)-1];
const mla=m=>ml(m)+' '+m.slice(2,4);          // mes con año (ene 25), para series que cruzan de un año a otro
const GASTOS_DESDE='2025-01-01';              // Gastos arranca en enero de 2025 (la RPC por defecto empieza en 2026)
const D10=x=>String(x).slice(0,10);
const hoyCR=()=>new Date().toLocaleDateString('en-CA',{timeZone:'America/Costa_Rica'});
const EMPCED={'3102111943':'Pollos La Bomba y Papea','3102765594':'Soda La Bomba'};
const CLASE={credito_soda:'A nombre de Soda',credito_pollos:'A nombre de Pollos',otro_receptor:'A nombre de otra persona',sin_cedula:'Sin cédula del receptor',tiquetes:'Tiquetes electrónicos'};
const num=x=>Number(x||0);
const cargando=m=>`<p class="nodata">${m||'Cargando…'}</p>`;
async function traerFin(){
  const E=['grupo','soda','pollos'],G2={...GG},I2={...II};
  const pedir=async e=>{
    for(let i=0;i<3;i++){
      let g,t;try{[g,t]=await Promise.all([sb.rpc('gastos_resumen',{p_desde:GASTOS_DESDE,p_emp:e}),sb.rpc('impuestos_resumen',{p_emp:e})]);}catch(x){g={error:x};t={};}
      if(!g.error&&!t.error){G2[e]=g.data;I2[e]=t.data;return true;}
      if(!navigator.onLine)break;
      await new Promise(r=>setTimeout(r,1500*(i+1)));
    }
    return false;
  };
  const ok=await Promise.all(E.map(pedir));
  if(ok.every(v=>!v)&&!Object.keys(G2).length)throw new Error('sin datos');
  return {GG:G2,II:I2,err:E.some((e,i)=>!ok[i]&&!G2[e])};   // lo que se guarda en la copia local y se restaura sin conexión
}
function aplicarFin(r){if(r){GG=r.GG||{};II=r.II||{};FIN_ERR=!!r.err;}}
async function traerInv(){
  const out={};
  for(const e of ['grupo','soda','pollos']){const r=await sb.rpc('inventario_valor_resumen',{p_emp:e});if(r.error)throw r.error;out[e]=r.data;}
  return out;
}
async function traerBz(){
  const out={};
  for(const e of ['grupo','soda','pollos']){const r=await sb.rpc('panel_control_buzones',{p_emp:e});if(r.error)throw r.error;out[e]=r.data;}
  return out;
}
function bloqueBuzones(){
  const v=BZ[EMP];if(!v)return '';
  const f=(t,n,s)=>`<div class="br"><div class="t"><b>${t}</b><i>${fmt(n)}</i></div>${s?`<div class="s2">${s}</div>`:''}</div>`;
  const falta=num(v.faltan),llegan=Math.max(0,num(v.recibidas)-num(v.registradas)-falta);
  const frase=v.estado==='error'?'No se pudo revisar los buzones':v.estado==='falta'?(falta===1?'Falta 1 factura':'Faltan '+fmt(falta)+' facturas'):'Todo en orden';
  const cuando=v.actualizado?new Date(v.actualizado).toLocaleString('es-CR',{timeZone:'America/Costa_Rica',weekday:'long',day:'numeric',month:'long',hour:'numeric',minute:'2-digit'}).replace(/\.$/,''):'';
  const sub=(v.estado==='error'?'La última revisión no terminó y se repetirá sola. ':'')+(cuando?'Última revisión: '+cuando+(llegan?' · ':'.'):'')+(llegan?(llegan===1?'1 factura llegó hace poco y se registrará en la próxima lectura.':fmt(llegan)+' facturas llegaron hace poco y se registrarán en la próxima lectura.'):'');
  return `<div class="g" data-c="sistema"><div class="blk"><h2>Control de buzones</h2><div class="rev ${v.estado==='ok'?'':'bad'}"><b>${frase}</b><span>${esc(sub.trim())}</span></div>${f('Facturas recibidas',v.recibidas,'en los buzones, últimos '+fmt(v.dias||7)+' días')}${f('Facturas registradas',v.registradas,'ya están en el panel y en Impuestos')}${f('Sin IVA registrado',v.sin_iva,num(v.sin_iva)?'el IVA no quedó anotado':'el IVA está anotado en todas')}${f('Líneas de inventario pendientes',v.inventario_lineas,num(v.inventario_facturas_mas3)?fmt(v.inventario_facturas_mas3)+(num(v.inventario_facturas_mas3)===1?' factura espera':' facturas esperan')+' hace más de 3 días':'por recibir en el inventario')}</div></div>`;
}
const GRUPO_INV={comida_preparada:'Comida preparada',unitario:'Unitarios (bebidas y empacados)',suministro:'Suministros',pulperia:'Pulpería'};
const grupoInv=g=>GRUPO_INV[g]||esc(String(g||'Sin grupo').replace(/_/g,' ').replace(/^./,c=>c.toUpperCase()));
function bloqueInv(){
  const v=INV[EMP];if(!v)return '';
  const f=g=>`<div class="br"><div class="t"><b>${grupoInv(g.grupo)}</b><i>${mo(crc(g.valor))}</i></div></div>`;
  return `<div class="g" data-c="gasto"><div class="blk"><h2>Valor del inventario</h2><div class="br"><div class="t"><b>Total</b><i>${mo(crc(v.total))}</i></div><div class="s2">a costo, sin IVA, de lo que ya se recibió en el facturador</div></div>${(v.grupos||[]).length?v.grupos.map(f).join(''):'<p class="note">Todavía no hay existencias recibidas.</p>'}</div></div>`;
}
function revisar(I){
  const out=[],cl=k=>(I.clasificacion||[]).find(x=>x.clase===k);
  const al=I.alertas||[];
  if(al.length){const t=al.reduce((a,x)=>a+num(x.total_factura),0);out.push({bad:1,t:al.length===1?'Falta el XML de una factura':'Faltan los XML de '+al.length+' facturas',s:al.length===1?`${(al[0].emisor_nombre||'Proveedor sin nombre')}, ${crc(al[0].total_factura)} con IVA. Hacienda la aceptó, pero no tenemos la factura.`:`Por ${crc(t)} con IVA en total. Hacienda las aceptó, pero no tenemos las facturas.`});}
  const rj=I.rechazadas||{};
  if(EMP!=='pollos'&&RAROS.length)out.unshift({bad:1,t:RAROS.length===1?'Un día con ingresos fuera de lo normal':RAROS.length+' días con ingresos fuera de lo normal',s:'Tarjeta de la Soda: '+RAROS.slice(-3).map(r=>dl(r.k)+' '+crc(r.v)).join(', ')+'. Detalle en Ingresos.'});
  if(num(rj.docs))out.push({bad:1,t:fmt(rj.docs)+(num(rj.docs)===1?' comprobante rechazado por Hacienda':' comprobantes rechazados por Hacienda'),s:`Quedan fuera del crédito. IVA que no se puede usar: ${crc(rj.iva)}.`});
  const o=cl('otro_receptor');if(o&&num(o.docs))out.push({t:o.docs+' facturas a nombre de otra persona',s:'IVA en duda: '+crc(o.iva)+'.'});
  const sc=cl('sin_cedula');if(sc&&num(sc.docs))out.push({t:sc.docs+' facturas sin cédula del receptor',s:'IVA en duda: '+crc(sc.iva)+'.'});
  return out;
}
function pintarPill(){
  const I=II[EMP],p=$('pill');
  if(!I){p.classList.remove('on');return;}
  const n=revisar(I).length;
  p.textContent=n+(n===1?' por revisar':' por revisar');
  p.classList.toggle('on',n>0);
}
function pintarHoy(){
  const el=$('sec-hoy');
  const G=GG[EMP],I=II[EMP];
  let h=`<div class="lblx">${EMPN[EMP]}</div><h1 class="h1">Hoy, ${fl(hoyCR())}</h1>`;
  if(!G||!I){el.innerHTML=h+cargando(FIN_ERR?'No se pudieron cargar los gastos. '+reintTxt:'');return;}
  const k=[];
  const bk=Object.keys(B).sort(),ult=bk[bk.length-1];
  if(EMP!=='pollos'){
    k.push(ult?{c:'ventas',l:'Ventas con tarjeta (Soda)',v:crc(B[ult].b),s:(ult===hoyCR()?'bruto, ':'bruto del '+fl(ult)+'. Hoy aún no hay: el BCR reporta con un día de atraso. ')+fmt(B[ult].v)+' vouchers'}:{c:'ventas',l:'Ventas con tarjeta (Soda)',v:'—',s:'sin datos'});
  }else k.push({c:'ventas',l:'Ventas de Pollos',v:'Por conectar',s:'falta definir la fuente'});
  k.push({c:'gasto',l:'Compras recibidas hoy',v:fmt(G.hoy.docs)+(G.hoy.docs===1?' factura':' facturas'),s:crc(G.hoy.bruto)+' con IVA. IVA soportado: '+crc(G.hoy.iva)});
  const th=hoyCR(),pe=PED.filter(r=>new Date(r.creado_en).toLocaleDateString('en-CA',{timeZone:'America/Costa_Rica'})===th&&(EMP==='grupo'||(EMP==='soda'?r.sitio==='soda':r.sitio!=='soda'))).length;
  k.push({c:'ped',l:'Pedidos Express hoy',v:fmt(pe),s:'desde las páginas web'});
  const rc=(G.recientes||[]).slice().sort((a,b)=>D10(a.dia)<D10(b.dia)?1:-1),RM={};rc.forEach(x=>{RM[D10(x.dia)]=x;});
  const ayer=addd(th,-1),ra=RM[ayer];          // «Ayer» es el día de calendario anterior a hoy, no la segunda fila que devuelva la base
  k.push({c:'gasto',l:'Ayer',v:ra?crc(ra.bruto):rc.length?crc(0):'—',s:ra?fmt(ra.docs)+(num(ra.docs)===1?' factura':' facturas')+' con IVA':rc.length?'sin facturas recibidas':'sin datos'});
  h+=kpis(k);
  if(EMP==='grupo'){
    const f=(e,n,c)=>{const g=GG[e];return `<div class="br"><div class="t"><b>${n} · hoy</b><i>${mo(crc(g.hoy.bruto))}</i></div><div class="s2">${fmt(g.hoy.docs)} facturas hoy. Compras desde enero de 2025: ${crc(g.totales.bruto)} (bruto)</div></div>`;};
    h+=`<div class="g" data-c="sistema"><div class="blk"><h2>Cada empresa</h2>${f('soda','Soda La Bomba')}${f('pollos','Pollos La Bomba y Papea')}<p class="note">Las compras sin cédula del receptor o a nombre de otra persona están en el total del Grupo, pero no en una empresa. Al elegir Soda o Pollos arriba se ve solo una.</p></div></div>`;
  }
  h+=bloqueInv();
  h+=bloqueBuzones();
  const rv=revisar(I);
  h+=`<div class="g" data-c="imp" id="por-revisar"><div class="blk"><h2>Por revisar</h2>${rv.length?rv.map(x=>`<div class="rev ${x.bad?'bad':''}"><b>${esc(x.t)}</b><span>${esc(x.s)}</span></div>`).join(''):'<p class="note">Nada por revisar.</p>'}<p class="note"><a href="#" data-go="impuestos">Ver todo en Impuestos</a></p></div></div>`;
  const d4=[-3,-2,-1,0].map(i=>addd(th,i));       // cuatro días seguidos, hoy al final; un día sin facturas vale 0 y no se salta
  if(rc.length)h+=`<div class="g" data-c="gasto">${cols('Compras recibidas, últimos 4 días (bruto, con IVA)',d4.map(d=>RM[d]?num(RM[d].bruto):0),d4.map(dl),'Eje vertical: colones. Eje horizontal: fecha, del día más antiguo al más reciente. Hoy aún está en curso; un día sin barra no tuvo facturas.',1,cc,true)}</div>`;
  h+=fallos();
  el.innerHTML=h;
}
function pintarGastos(){
  const el=$('sec-gastos'),G=GG[EMP];
  if(!G){el.innerHTML=cargando(FIN_ERR?'No se pudieron cargar los gastos. '+reintTxt:'');return;}
  const t=G.totales,m=G.mensual||[];
  let h=`<div class="lblx">${EMPN[EMP]} · colones</div><h1 class="h1">Gastos</h1>`;
  h+=(typeof atender!=='undefined'?atender.nota('gastos'):'')+`<div class="dayl">Hoy · <b>${fl(hoyCR())}</b></div>`+kpis([{c:'gasto',l:'Compras recibidas hoy (bruto)',v:crc(G.hoy.bruto),s:'con IVA, '+fmt(G.hoy.docs)+(G.hoy.docs===1?' factura recibida':' facturas recibidas')},{c:'gasto',l:'Compras recibidas hoy (neto)',v:crc(G.hoy.neto!=null?G.hoy.neto:num(G.hoy.bruto)-num(G.hoy.iva)),s:'sin IVA'},{c:'gasto',l:'IVA soportado hoy',v:crc(G.hoy.iva),s:'en las facturas de hoy'},{c:'gasto',l:'Facturas recibidas hoy',v:fmt(G.hoy.docs),s:G.hoy.docs===1?'comprobante electrónico':'comprobantes electrónicos'}]);
  h+=`<div class="dayl">Acumulado desde el 1 de enero de 2025</div>`+kpis([{c:'gasto',l:'Compras (bruto)',v:crc(t.bruto),s:'con IVA, '+fmt(t.docs)+' comprobantes'},{c:'gasto',l:'Compras (neto)',v:crc(t.neto),s:'sin IVA'},{c:'gasto',l:'IVA soportado',v:crc(t.iva),s:'crédito potencial en Impuestos'},{c:'gasto',l:'Comprobantes',v:fmt(t.docs),s:'recibidos desde enero de 2025'}]);
  if(m.length)h+=`<div class="g" data-c="gasto">${cols('Compras por mes (bruto, con IVA)',m.map(x=>num(x.bruto)),lbM(m.map(x=>x.mes)),'Eje vertical: colones. Eje horizontal: mes, de enero de 2025 (izquierda) al actual (derecha); se rotulan algunos meses para que quepan. El último puede estar en curso. Las notas de crédito restan.',null,cc,false)}</div>`;
  const c2=(G.categorias||[]).map(c=>[c.cat||'Sin categoría',num(c.bruto),'IVA '+crc(c.iva)]);
  const c3=(G.tipos||[]).map(c=>[c.tipo||'Sin tipo',num(c.bruto)]);
  h+=`<div class="g c2" data-c="gasto">${c2.length?bars('Categorías (CABYS)',c2,crc,null,'Monto bruto. Clasificación oficial de Hacienda.'):''}${c3.length?bars('Productos y servicios',c3,crc,null,'Monto bruto, agrupado por tipo.'):''}</div>`;
  const pv=G.proveedores||[];
  if(pv.length)h+=`<div class="g" data-c="gasto">${table('Proveedores principales',['Proveedor','Facturas','Bruto','IVA'],pv.map(p=>[esc(p.prov),fmt(p.docs),crc(p.bruto),crc(p.iva)]))}</div>`;
  h+=`<p class="note">Fuente: facturas electrónicas recibidas en los correos de contabilidad, leídas desde el XML. Solo colones. Los gastos sin factura electrónica (comprobantes de transferencia) se sumarán cuando esté conectada la carpeta de SharePoint.</p>`;
  el.innerHTML=h;
}
function pintarImpuestos(){
  const el=$('sec-impuestos'),I=II[EMP];
  if(!I){el.innerHTML=cargando(FIN_ERR?'No se pudieron cargar los impuestos. '+reintTxt:'');return;}
  const cl=k=>(I.clasificacion||[]).find(x=>x.clase===k)||{docs:0,bruto:0,iva:0};
  const dudaIva=['otro_receptor','sin_cedula','tiquetes'].reduce((a,k)=>a+num(cl(k).iva),0);
  const GH=GG[EMP]&&GG[EMP].hoy,nrev=revisar(I).length;
  let h=`<div class="lblx">${EMPN[EMP]} · colones</div><h1 class="h1">Impuestos</h1>`;
  h+=(typeof atender!=='undefined'?atender.nota('impuestos'):'')+`<div class="dayl">Hoy · <b>${fl(hoyCR())}</b></div>`+kpis([{c:'imp',l:'IVA soportado hoy',v:GH?crc(GH.iva):'—',s:GH?'en '+fmt(GH.docs)+(GH.docs===1?' factura recibida hoy':' facturas recibidas hoy'):'sin datos'},{c:'imp',l:'Por revisar ahora',v:fmt(nrev),s:nrev?'cosas que piden atención, abajo':'nada pendiente'},{c:'imp',l:'Rechazadas por Hacienda',v:fmt(num((I.rechazadas||{}).docs)),s:'no cuentan en el crédito'}]);
  h+=`<div class="dayl">Acumulado desde el 1 de enero</div>`+kpis([{c:'imp',l:'IVA soportado',v:crc(I.iva_total),s:'en compras válidas, sin los rechazados'},{c:'imp',l:'Crédito potencial Soda',v:crc(cl('credito_soda').iva),s:fmt(cl('credito_soda').docs)+' facturas a su nombre'},{c:'imp',l:'Crédito potencial Pollos',v:crc(cl('credito_pollos').iva),s:fmt(cl('credito_pollos').docs)+' facturas a su nombre'},{c:'imp',l:'IVA en duda',v:crc(dudaIva),s:'otra persona, sin cédula o tiquete'}]);
  const al=I.alertas||[];
  h+=`<div class="g" data-c="imp"><div class="blk"><h2>Facturas sin XML</h2>${al.length?al.map(a=>`<div class="rev bad"><b>${esc(a.emisor_nombre||'Proveedor sin nombre')}, ${crc(a.total_factura)}</b><span>Recibida el ${dl(D10(a.recibido))}. Tenemos el aviso de Hacienda, pero no el XML de la factura, que es el que sirve para el crédito. ${esc(a.asunto||'')}</span></div>`).join(''):'<p class="note">No hay facturas aceptadas por Hacienda sin su XML.</p>'}</div></div>`;
  const rj=I.rechazadas||{},rd=I.rechazadas_detalle||[];
  if(num(rj.docs))h+=`<div class="g" data-c="imp">${table('Rechazadas por Hacienda',['Proveedor','Docs','Bruto','IVA'],rd.map(r=>[esc(r.emisor),fmt(r.docs),crc(r.bruto),crc(r.iva)]))}</div><p class="note">Hacienda rechazó estos comprobantes. No cuentan en el crédito ni en los totales de arriba: hay que pedir al proveedor que los emita de nuevo.</p>`;
  h+=`<div class="g" data-c="imp">${table('Compras según a nombre de quién están',['Clase','Docs','Bruto','IVA'],(I.clasificacion||[]).map(x=>[CLASE[x.clase]||esc(String(x.clase||'Sin clase').replace(/_/g,' ')),fmt(x.docs),crc(x.bruto),crc(x.iva)]))}</div>`;
  const im=I.iva_mensual||[];
  if(im.length)h+=`<div class="g" data-c="imp">${cols('IVA soportado por mes',im.map(x=>num(x.iva)),lbM(im.map(x=>x.mes)),'Eje vertical: colones. Eje horizontal: mes, del más antiguo (izquierda) al más reciente (derecha). Sin comprobantes rechazados. Las notas de crédito restan.',null,cc,true)}</div>`;
  const rc=(I.receptores||[]);
  if(rc.length)h+=`<div class="g" data-c="imp">${table('Receptores que aparecen en las facturas',['Receptor','Docs','Bruto','IVA'],rc.map(r=>[(()=>{const e=EMPCED[String(r.ced||'').replace(/\D/g,'')];return e?'<b>'+e+'</b>'+(/la bomba/i.test(r.nombre||'')?'':' <span style="color:var(--mute)">'+esc(r.nombre||'')+'</span>'):esc(r.nombre||'Sin nombre')})()+'<small>'+esc(r.ced)+'</small>',fmt(r.docs),crc(r.bruto),crc(r.iva)]))}</div>`;
  h+=`<p class="note">Es crédito potencial: la decisión final es del contador. El IVA de ventas todavía no está conectado${num((I.usd||{}).docs)?'. Además hay '+fmt(I.usd.docs)+' comprobantes en dólares (US$ '+fmtD(I.usd.total,2)+') que no se suman aquí':''}.</p>`;
  el.innerHTML=h;
}
function pintarAviso(){
  const a=$('ing-aviso'),hy=hoyCR();
  const hoyBloque=(v,s)=>`<div class="dayl">Hoy · <b>${fl(hy)}</b></div>`+kpis([{c:'ventas',l:'Ventas con tarjeta de hoy',v:v,s:s}]).replace('<div class="kpis">','<div class="kpis" style="grid-template-columns:minmax(0,1fr)">');
  if(EMP==='pollos'){a.innerHTML=hoyBloque('Sin fuente conectada','Todavía no hay una fuente de ventas para Pollos y Papea.')+`<div class="g" data-c="ventas"><div class="blk"><h2>Ingresos de Pollos La Bomba y Papea</h2><p class="note">Todavía no hay una fuente de ventas conectada. Aparecerán aquí cuando se defina de dónde salen.</p></div></div>`;$('tab-ingresos').hidden=true;}
  else{const _bk=Object.keys(B).sort(),_u=_bk[_bk.length-1];
    const _av=(_u&&_u===hy)?'':hoyBloque('Aún sin reporte del BCR','El banco reporta con un día de atraso, así que el comprobante de hoy llega mañana.'+(_u?' Lo último cargado es del '+fl(_u)+'.':''));
    a.innerHTML=_av+(EMP==='grupo'?`<p class="note" style="margin:0 0 18px">Hoy solo están conectados los cobros digitales de la Soda. Las ventas de Pollos y Papea se sumarán cuando se defina la fuente.</p>`:'');$('tab-ingresos').hidden=false;}
}
function pintarFin(){pintarPill();pintarAviso();pintarHoy();pintarGastos();pintarImpuestos();if(typeof precios!=='undefined')precios.ver();if(SEC==='comercial'&&typeof comercial!=='undefined')comercial.ver();if(SEC==='ingresos'&&typeof sinpe!=='undefined')sinpe.ver();if(typeof atender!=='undefined')atender.contar();}
function irSec(s){
  SEC=s;
  document.querySelectorAll('.tabs button').forEach(x=>x.setAttribute('aria-selected',x.dataset.sec===s));
  ['hoy','atender','ingresos','gastos','comercial','precios','impuestos','presencia','salud'].forEach(t=>$('sec-'+t).hidden=t!==s);
  window.scrollTo(0,0);if(s==='comercial'&&typeof comercial!=='undefined')comercial.ver();if(s==='ingresos'&&typeof sinpe!=='undefined')sinpe.ver();if(s==='precios'&&typeof precios!=='undefined')precios.ver();if(s==='atender'&&typeof atender!=='undefined')atender.ver();if(s==='salud')pintarSalud();if(typeof atender!=='undefined')atender.notas();
}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>irSec(b.dataset.sec));
document.querySelectorAll('.emp button').forEach(b=>b.onclick=()=>{EMP=b.dataset.emp;document.body.dataset.emp=EMP;document.querySelectorAll('.emp button').forEach(x=>x.setAttribute('aria-pressed',x===b));pintarFin();});
document.querySelectorAll('.subtabs button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.subtabs button').forEach(x=>x.setAttribute('aria-selected',x===b));['pedidos','paginas','redes'].forEach(t=>$('tab-'+t).hidden=b.dataset.sub!==t);});
$('pill').onclick=e=>{e.preventDefault();irSec('hoy');setTimeout(()=>{const x=$('por-revisar');if(x){x.scrollIntoView({behavior:'smooth',block:'start'});x.style.outline='2px solid var(--bad)';setTimeout(()=>x.style.outline='',2200);}},60);};
document.addEventListener('click',e=>{const a=e.target.closest('[data-go]');if(a){e.preventDefault();irSec(a.dataset.go);}});

/* ---- BCR: periodo vivo y historia ----
   Toda lectura de panel_metricas pide duplicado=false: las copias reenviadas de un mismo correo del BCR (ene 2026) quedan marcadas en la base y no se cuentan.
   Periodo vivo = serie diaria de bcr-diario (desde el 24 ago 2025). La historia (marca «hist|» en detalle, feb 2021 a 23 ago 2025, con huecos)
   NO entra a las cifras del año ni a los selectores: solo alimenta el comparativo con años anteriores, y se baja por mes, bajo demanda. */
const BCR_VIVO_DESDE='2025-08-24';
const HIST_ANOS=[2021,2022,2023,2024,2025];
const HIST_ATIPICOS=['2022-10-08','2022-10-09','2022-10-10','2023-03-08','2025-02-10','2025-05-15','2025-08-05']; // fuera de los promedios (dia atipico marcado)
const HIST_FALTAN=['2021-03-12','2021-06-02','2021-06-03','2021-06-23','2021-08-15','2022-01-01','2022-10-07','2022-12-25','2023-06-05','2025-02-11','2025-02-12','2025-02-13','2025-02-14','2025-08-04'];                 // sin comprobante en el buzon
const HIST_HUECOS=[['2024-07-23','2024-12-15','23 jul a 15 dic de 2024'],['2025-05-16','2025-07-14','16 may a 14 jul de 2025']]; // rangos sin ningun comprobante en el buzon (no se rellenan)
const HIST_PARCIAL={'2025-02-10':'parcial','2025-05-15':'parcial','2025-08-05':'suma el 4 y el 5'}; // rotulo de los dias fuera del promedio que no son atipicos de operacion
async function traerHist(mm){
  const out=[];
  for(const y of HIST_ANOS){
    const {data,error}=await sb.from('panel_metricas').select('fecha,metrica,valor').eq('fuente','bcr').eq('duplicado',false).like('detalle','hist|%')
      .in('metrica',['tarjeta_bruto','tarjeta_vouchers','tarjeta_neto']).gte('fecha',y+'-'+mm+'-01').lte('fecha',y+'-'+mm+'-'+String(new Date(y,Number(mm),0).getDate()).padStart(2,'0')).order('fecha').order('id').range(0,999);
    if(error) throw error;
    data.forEach(r=>out.push(r));
  }
  return out;
}
async function traer(){
  let all=[],from=0;
  for(;;){
    const {data,error}=await sb.from('panel_metricas').select('fecha,fuente,sitio,metrica,detalle,valor').gte('fecha',addd(HOYCR(),-14)).eq('duplicado',false).order('fecha').order('id').range(from,from+999);
    if(error) throw error;
    all=all.concat(data); if(data.length<1000) break; from+=1000;
  }
  return all;
}
async function traerBcr(){
  let all=[],from=0;
  for(;;){
    const {data,error}=await sb.from('panel_metricas').select('fecha,metrica,detalle,valor').eq('fuente','bcr').eq('duplicado',false).gte('fecha',BCR_VIVO_DESDE).not('detalle','like','hist|%').order('fecha').order('id').range(from,from+999);
    if(error) throw error;
    all=all.concat(data); if(data.length<1000) break; from+=1000;
  }
  return all;
}
let _cargando=false,_pend=null;
const FNOM={redes:'redes sociales',inv:'inventario',bz:'control de buzones',fin:'gastos e impuestos',bcr:'ingresos',met:'visitas y datos diarios',ped:'pedidos web'};
function fallos(){const k=Object.keys(FALLO).filter(x=>FALLO[x]&&x!=='fin');return k.length?`<p class="note" role="alert">No se pudo actualizar: ${k.map(x=>FNOM[x]||x).join(', ')}. Lo que se ve es lo último que se logró traer. ${reintTxt}</p>`:'';}
/* Cada fuente se trae sola y en paralelo; si una falla, las demás siguen y lo que falló se avisa (antes un fallo se tragaba en silencio y se veía «sin datos»). */
const FUENTES={
  async redes(){M=(await traerMeta()).filter(r=>r.fecha>=addd(HOYCR(),-60));},
  async inv(){INV=await traerInv();},
  async bz(){BZ=await traerBz();},
  async fin(){aplicarFin(await traerFin());},
  async bcr(){armarB(await traerBcr());},
  async met(){RALL=await traer();R=RALL.filter(r=>r.fecha>=addd(HOYCR(),-14));},
  async ped(){const l30=new Date(Date.now()-30*864e5).toISOString();
    const [p,c]=await Promise.all([traerTabla('pedidos','creado_en,sitio,items,total,direccion,cliente_telefono','id',l30),traerTabla('carritos','creado_en,actualizado_en,sitio,items,total,enviado','sesion',l30)]);
    PEDALL=p;CARALL=c;PED=p;},
};
const PINTA={
  redes(){if(FALLO.redes&&!M.length)$('tab-redes').innerHTML=reint('Redes sociales');else pintarRedes();},
  inv(){pintarHoy();},bz(){pintarHoy();},
  fin(){pintarFin();},
  bcr(){if(FALLO.bcr&&!Object.keys(B).length)$('tab-ingresos').innerHTML=reint('No se pudieron cargar los ingresos');else pintarIng();},
  met(){},
  ped(){if(FALLO.ped&&!PEDALL.length)$('tab-pedidos').innerHTML=reint('Pedidos web');else pintarPed(PED,CARALL);},
};
const TODAS=Object.keys(FUENTES);
async function cargar(lista){
  const l=lista&&lista.length?lista:TODAS;
  if(_cargando){_pend=[...new Set([...(_pend||[]),...l])];return;}   // lo pedido durante una carga no se pierde: se repite al terminar
  _cargando=true;try{await cargar2(l);}finally{_cargando=false;}
  if(_pend){const p=_pend;_pend=null;return cargar(p);}
}
async function cargar2(l){
  await Promise.all(l.map(async k=>{
    try{await FUENTES[k]();delete FALLO[k];}catch(e){FALLO[k]=1;if(k==='fin'){FIN_ERR=true;}}
    try{PINTA[k]();}catch(e){console.warn('pintar',k,e);}
  }));
  if(l.includes('met')||l.includes('redes')){try{pintarPag();}catch(e){$('tab-paginas').innerHTML=reint('No se pudieron cargar las visitas');}}
  try{pintarSalud();}catch(e){}
  pintarPill();pintarHoy();
  if(SEC==='ingresos'&&typeof sinpe!=='undefined')sinpe.ver(true);if(SEC==='comercial'&&typeof comercial!=='undefined')comercial.ver(true);   // el botón Actualizar y el tiempo real también refrescan SINPE y Comercial
}
document.addEventListener('click',e=>{if(e.target.closest('[data-reint]')){e.preventDefault();cargar();}});
/* Red de seguridad del ₡ en columna: toda celda o cifra cuyo contenido es solo «₡123» se parte en ₡ (borde izquierdo) y dígitos (alineados a la derecha) */
const CELDA=/^(\s*)(−?)₡([\d\u00A0]+(?:,\d+)?)\s*$/;
function alinearMon(root){
  (root||document).querySelectorAll('td,.v,.num,.t>i,.vl>b,.vl>i').forEach(el=>{
    const n=el.firstChild;if(!n||n.nodeType!==3||el.querySelector('.mon'))return;
    const m=CELDA.exec(n.nodeValue);if(!m)return;
    const w=document.createElement('span');w.className='mon';
    const a=document.createElement('span');a.className='crc';a.textContent='₡';
    const b=document.createElement('span');b.className='cif';b.textContent=m[2]+m[3];
    w.append(a,b);el.replaceChild(w,n);
  });
}
{let q=0;new MutationObserver(()=>{if(q)return;q=requestAnimationFrame(()=>{q=0;alinearMon();});}).observe(document.body,{childList:true,subtree:true});}

/* ---- Salud de los sistemas: estilo página de estado (banner, componentes, 30 días, incidentes) ---- */
const SALUD_N={'sitio-soda':'Página de la Soda','sitio-pollos':'Página de Pollos y Papea','facturador':'Facturador y menú web','panel':'Panel La Bomba','hacienda':'Hacienda (acceso al sistema)','cloudflare':'Cloudflare (aloja las páginas)','microsoft':'Microsoft 365 (correo)','meta':'Meta (WhatsApp, Facebook, Instagram)','base':'Base de datos','tareas':'Tareas automáticas','respaldos':'Respaldos de datos','neon':'Copia de seguridad en Neon','dixiapp':'Dixiapp','sinpe-recibir':'SINPE Móvil: teléfono que recibe los avisos'};
const SALUD_G=[['Computadoras de caja',['equipo:caja-soda','equipo:caja-pollos']],['Sistema La Bomba',['facturador','base','tareas','respaldos','neon','panel','dixiapp','sinpe-recibir']],['Páginas',['sitio-soda','sitio-pollos']],['Servicios externos',['hacienda','cloudflare','microsoft','meta']]];
const SALUD_E={ok:'Funcionando',aviso:'Con avisos',caido:'Sin respuesta',sin_datos:'Sin datos todavía'};
const SALUD_EV={caida_internet:'Se cayó el internet',caja_cerrada:'Se cerró la caja',pantalla_perdida:'Se perdió una pantalla',reparacion:'Reparación',error_facturador:'Error del facturador',otro:'Otro evento'};
let SALUD_ERR=false;
const sHora=t=>t?new Date(t).toLocaleString('es-CR',{timeZone:'America/Costa_Rica',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):'—';
const sHace=t=>{if(!t)return '—';const m=Math.max(0,Math.round((Date.now()-new Date(t))/60000));return m<2?'hace un momento':m<60?'hace '+m+' min':m<1440?'hace '+Math.round(m/60)+' h':'hace '+Math.round(m/1440)+' días';};
let SALUD_SEQ=0,SALUD_ULT=null;
async function pintarSalud(){
  const box=$('sal-base')||$('sec-salud');if(!box)return;
  const my=++SALUD_SEQ;
  let d;try{const {data,error}=await sb.rpc('panel_salud');if(error)throw error;d=data;SALUD_ERR=false;}
  catch(e){
    if(my!==SALUD_SEQ)return;
    SALUD_ERR=true;
    const msg=/no autorizado/i.test(String(e&&e.message))?'Tu sesión venció. Vuelve a entrar al panel para ver la salud de los sistemas.':'No se pudo actualizar ahora. Se reintenta sola cada minuto.';
    if(SALUD_ULT){box.innerHTML='<p class="note" role="status" style="color:var(--rojo,#B81622)">'+esc(msg)+' Lo que se ve abajo es de '+esc(sHace(SALUD_ULT.t))+'.</p>'+SALUD_ULT.h;}
    else box.innerHTML='<div class="blk" data-c="sistema"><h2>No se pudo cargar la salud de los sistemas</h2><p class="note">'+esc(msg)+'</p></div>';
    return;}
  if(my!==SALUD_SEQ)return;
  let pc=null;try{const r=await sb.rpc('panel_punto_de_caida');if(!r.error)pc=r.data;}catch(e){}
  if(my!==SALUD_SEQ)return;
  const eqs=(d.equipos||[]).filter(e=>EMP==='grupo'||e.empresa===EMP);
  const NM={};Object.keys(SALUD_N).forEach(k=>NM[k]=SALUD_N[k]);(d.equipos||[]).forEach(e=>NM['equipo:'+e.estacion]=e.nombre);
  const AH={};(d.ahora||[]).forEach(x=>AH[x.componente]=x);
  const DI={};(d.dias||[]).forEach(x=>{(DI[x.c]=DI[x.c]||{})[x.f]=x.e;});
  const visibles=k=>!k.startsWith('equipo:')||eqs.some(e=>'equipo:'+e.estacion===k);
  const todos=Object.keys(AH).filter(visibles);
  const nc=todos.filter(k=>AH[k].estado==='caido').length,na=todos.filter(k=>AH[k].estado==='aviso').length,ns=todos.filter(k=>AH[k].estado==='sin_datos').length;
  const est=(nc||d.vigilancia_detenida)?'caido':na?'aviso':'ok';
  const tit=nc?(nc===1?'Hay 1 componente sin respuesta':'Hay '+nc+' componentes sin respuesta'):na?(na===1?'Todo funciona, con 1 aviso':'Todo funciona, con '+na+' avisos'):'Todo funcionando';
  let h=`<div class="dayl">Estado de hoy · <b>${esc(sHora(d.hora))}</b></div><div class="sb"><i class="e-${est}"></i><b>${tit}</b><span>${ns?ns+(ns===1?' componente todavía sin datos':' componentes todavía sin datos')+' · ':''}Última revisión ${esc(sHace(d.ultima_revision))}</span></div>`;
  if(d.vigilancia_detenida)h=`<div class="sb" role="alert"><i class="e-caido"></i><b>La vigilancia no se ha ejecutado ${esc(sHace(d.ultima_revision))}</b><span>Lo que se muestra puede estar desactualizado. Se avisará por los canales de alerta.</span></div>`+h;
  const hoy=HOYCR(),dias=[...Array(30)].map((_,i)=>addd(hoy,i-29));
  const CONOCIDOS=new Set(SALUD_G.flatMap(g=>g[1]));const otros=Object.keys(AH).filter(k=>!CONOCIDOS.has(k)&&!k.startsWith('equipo:'));
  (otros.length?SALUD_G.concat([['Otros',otros]]):SALUD_G).forEach(([gt,ks])=>{
    const f=ks.filter(k=>AH[k]&&visibles(k));if(!f.length)return;
    h+=`<div class="g" data-c="sistema"><div class="blk"><h2>${esc(gt)}</h2><div class="sc">`+f.map(k=>{
      const a=AH[k],ms=a.ms!=null&&!k.startsWith('equipo:')?a.ms+' ms':a.ms!=null?'latencia '+a.ms+' ms':'';
      const barra=dias.map(x=>{const e=(DI[k]||{})[x]||'sin_datos';return `<s class="e-${e}" title="${esc(dl(x))}: ${esc(SALUD_E[e])}"></s>`;}).join('');
      return `<div class="sf"><div class="sft"><i class="e-${a.estado}"></i><b>${esc(NM[k]||k)}</b><em>${esc(SALUD_E[a.estado])}${ms?' · '+esc(ms):''}</em></div><div class="de">${esc(a.detalle||'')}</div><div class="dd" role="img" aria-label="Últimos 30 días de ${esc(NM[k]||k)}: ${dias.filter(x=>((DI[k]||{})[x])==='caido').length} días sin respuesta, ${dias.filter(x=>((DI[k]||{})[x])==='aviso').length} con avisos">${barra}</div><div class="ddl"><span>${esc(dl(dias[0]))}</span><span>Hoy</span></div></div>`;
    }).join('')+`</div></div></div>`;
  });
  h+=`<p class="note" style="margin:-8px 0 26px">Cada rayita es un día, de izquierda (más antiguo) a derecha (hoy). Verde: sin problemas. Ámbar: hubo avisos. Rojo: estuvo sin respuesta. Gris: sin datos.</p>`;
  // equipos
  if(eqs.length)h+=`<div class="g" data-c="sistema">${table('Computadoras de caja',['Equipo','Última vez que respondió','Pantallas conectadas','Cajas abiertas','Tiempo de respuesta','Versión del kit','Horario'],eqs.map(e=>[esc(e.nombre),e.creado_en?esc(sHace(e.creado_en)):'Sin señal todavía',e.pantallas!=null?String(e.pantallas):'—',e.ventanas!=null?String(e.ventanas):'—',e.latencia_ms!=null?e.latencia_ms+' ms':'—',esc(e.version_kit||'—'),e.horario_abre?esc(String(e.horario_abre).slice(0,5)+' a '+String(e.horario_cierra).slice(0,5)):'24 horas']),1)}</div>`;
  // punto de caída: último consecutivo emitido por empresa y documento (17 nov 2026)
  if(pc&&(pc.consecutivos||[]).length){
    const TD={'01':'Factura electrónica','02':'Nota de débito','03':'Nota de crédito','04':'Tiquete electrónico','08':'Factura de compra','09':'Factura de exportación'};
    const emp=s=>/CORPORACION DMA/i.test(s)?'Soda La Bomba':/3-102-111943/.test(s)?'Pollos La Bomba y Papea':s;
    h+=`<div class="g" data-c="sistema">${table('Último consecutivo emitido (si el sistema se cae, retoma desde aquí)',['Empresa','Documento','Terminal','Último número','Cuándo se emitió','Números salteados'],pc.consecutivos.map(c=>[esc(emp(c.sociedad)),esc(TD[c.tipo_doc]||('Tipo '+c.tipo_doc)),esc(String(parseInt(String(c.serie||'').slice(3,8),10)||'—')),esc(String(c.ultimo_numero_emitido)),esc(sHora(c.ultima_emision)),(c.faltantes||[]).length?esc(c.faltantes.join(', ')):'Ninguno']),1)}<p class="note">Para saber cuándo y por qué se cayó algo, mira «Incidentes» más abajo y compara su hora con la columna «Cuándo se emitió». Los correos enviados a Microsoft 365 sirven para cotejar estos números.</p></div>`;
  }
  // incidentes
  const inc=d.incidentes||[];
  h+=`<div class="g" data-c="sistema">`+(inc.length?table('Incidentes de los últimos 30 días',['Componente','Detectado','En atención','Resuelto','Quién'],inc.map(i=>[esc(NM[i.componente]||i.componente),esc(sHora(i.detectado_en)),i.atencion_en?esc(sHora(i.atencion_en)):'—',i.resuelto_en?esc(sHora(i.resuelto_en)):'Abierto',i.resuelto_en?(i.resuelto_por==='Claude'?'Resuelto por Claude':i.resuelto_por==='Emil'?'Resuelto por Emil':'Se resolvió solo'):'Esperando atención']),1):'<div class="blk"><h2>Incidentes de los últimos 30 días</h2><p class="note">Ninguno. Cuando un componente falle tres revisiones seguidas, aquí queda la hora en que se detectó, cuándo se atendió, cuándo se resolvió y quién lo resolvió.</p></div>')+`</div>`;
  const ev=d.eventos||[];
  if(!ev.length)h+=`<div class="g" data-c="sistema"><div class="blk"><h2>Eventos de las computadoras de caja (7 días)</h2><p class="note">Sin eventos en los últimos 7 días.</p></div></div>`;
  if(ev.length)h+=`<div class="g" data-c="sistema">${table('Eventos de las computadoras de caja (7 días)',['Cuándo','Equipo','Qué pasó','Detalle'],ev.slice(0,30).map(v=>[esc(sHora(v.creado_en)),esc(NM['equipo:'+v.estacion]||v.estacion),esc(SALUD_EV[v.tipo]||v.tipo),esc(v.detalle||'')]),1)}</div>`;
  h+=`<p class="note">Los avisos se enviarán a admin@dmalabomba.com, al teléfono y a la bandeja del facturador, solo a administradores. Las computadoras de caja muestran «Sin datos» hasta que se instale el kit con latido.</p>`;
  box.innerHTML=h;SALUD_ULT={t:d.hora,h:h};
  if(typeof equiposVista!=='undefined')equiposVista.ver(eqs,true);
}
setInterval(()=>{if(SEC==='salud'&&!document.hidden)pintarSalud();},60000);

// ---- Copia local: sin internet se ve lo ultimo que se trajo (solo lectura). Se borra al salir. ----
const IDB=()=>new Promise((ok,no)=>{try{const q=indexedDB.open('panel-copia',1);q.onupgradeneeded=()=>q.result.createObjectStore('c');q.onsuccess=()=>ok(q.result);q.onerror=()=>no(q.error);}catch(e){no(e);}});
async function cGet(k){try{const d=await IDB();return await new Promise((ok)=>{const r=d.transaction('c').objectStore('c').get(k);r.onsuccess=()=>ok(r.result||null);r.onerror=()=>ok(null);});}catch(e){return null;}}
async function cPut(k,v){try{const d=await IDB();await new Promise((ok)=>{const t=d.transaction('c','readwrite');t.objectStore('c').put({t:Date.now(),v},k);t.oncomplete=ok;t.onerror=ok;t.onabort=ok;});}catch(e){}}
async function cClear(){try{const d=await IDB();await new Promise((ok)=>{const t=d.transaction('c','readwrite');t.objectStore('c').clear();t.oncomplete=ok;t.onerror=ok;});}catch(e){}}
function avisoCon(t){const b=$('sinCon');if(!t){b.hidden=true;document.body.style.paddingTop='';return;}
  b.textContent='Sin conexión · datos de '+new Date(t).toLocaleString('es-CR',{timeZone:'America/Costa_Rica',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'});b.hidden=false;document.body.style.paddingTop='34px';}
let ultimaCopia=0;
function conCopia(nombre,fn,kf){return async(...a)=>{const k=nombre+':'+(kf?kf(...a):JSON.stringify(a));
  const dePrueba=async()=>{const c=await cGet(k);if(c){ultimaCopia=Math.min(ultimaCopia||c.t,c.t);avisoCon(ultimaCopia);return c.v;}throw new Error('sin copia');};
  if(!navigator.onLine)return dePrueba();
  try{const r=await fn(...a);cPut(k,r);return r;}catch(e){try{return await dePrueba();}catch(_){throw e;}}};}
traerMeta=conCopia('meta',traerMeta);traerTabla=conCopia('tabla',traerTabla,t=>t);traerFin=conCopia('fin',traerFin);traerInv=conCopia('inv',traerInv);traerBz=conCopia('bz',traerBz);traer=conCopia('traer',traer);traerBcr=conCopia('bcr',traerBcr);traerHist=conCopia('hist',traerHist);
addEventListener('online',()=>{ultimaCopia=0;avisoCon(0);});
addEventListener('offline',()=>{if(!$('app').hidden)avisoCon(ultimaCopia||Date.now());});
async function validar(session){
  $('espera').hidden=true;
  const yaEntro=localStorage.getItem('panel.entro')==='1';
  if(!navigator.onLine&&yaEntro){$('login').hidden=true;$('app').hidden=false;$('quien').textContent='';$('ini').textContent='DMA';avisoCon(ultimaCopia||Date.now());cargar();return;}
  if(!session){$('app').hidden=true;$('login').hidden=false;return;}
  $('espera').hidden=false;
  let ok,error;for(let i=0;i<4;i++){try{({data:ok,error}=await sb.rpc('es_panel'));}catch(e){error=e;}if(!error)break;await new Promise(r=>setTimeout(r,1500*(i+1)));}
  $('espera').hidden=true;
  if(error&&yaEntro){$('login').hidden=true;$('app').hidden=false;avisoCon(ultimaCopia||Date.now());cargar();return;}
  if(error||ok!==true){await sb.auth.signOut();$('app').hidden=true;$('login').hidden=false;$('err').textContent='Esta sesión no tiene acceso al panel.';return;}
  try{localStorage.setItem('panel.entro','1');}catch(e){}
  $('login').hidden=true;$('app').hidden=false;
  const em=session.user.email||'';$('quien').textContent=em;$('ini').textContent='DMA';
  cargar();if(window.panelAvisos)panelAvisos();
  if(!window._rt){let t=null;let cola=new Set();const rec=tb=>{(RT[tb]||TODAS).forEach(x=>cola.add(x));clearTimeout(t);t=setTimeout(()=>{const l=[...cola];cola=new Set();cargar(l).then(()=>{const e=$('envivo');if(e)e.textContent='Actualizado en vivo '+new Date().toLocaleTimeString('es-CR',{hour:'numeric',minute:'2-digit'});});},20000);};
    const RT={facturas_recibidas:['fin','inv','bz'],mensajes_hacienda:['fin','bz'],panel_metricas:['bcr','met','redes'],pedidos:['ped']};
    window._rt=sb.channel('panel-en-vivo');
    ['facturas_recibidas','mensajes_hacienda','panel_metricas','pedidos'].forEach(tb=>window._rt.on('postgres_changes',{event:'*',schema:'public',table:tb},()=>rec(tb)));
    window._rt.subscribe();}
}
const ACC=SUPA_URL+'/functions/v1/panel-acceso';
async function llamarAcceso(cuerpo){
  const r=await fetch(ACC,{method:'POST',headers:{'Content-Type':'application/json',apikey:SUPA_KEY,Authorization:'Bearer '+SUPA_KEY},body:JSON.stringify(cuerpo)});
  let j={};try{j=await r.json();}catch(e){}
  return j;
}
// PIN FINAL: el campo del PIN no tiene largo fijo ni se envia solo; nada en la pantalla dice cuantos digitos tiene. Se envia al dar Enter o tocar «Entrar».
$('pin').oninput=e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,32);};
// Aparato de confianza: el servidor entrega un token al entrar bien; con el, la espera de otros intentos no le llega a este aparato
const apaLeer=()=>{try{return localStorage.getItem('panel.aparato')||'';}catch(e){return '';}};
const apaGuardar=t=>{try{if(t)localStorage.setItem('panel.aparato',t);}catch(e){}};
$('fLogin').onsubmit=async ev=>{
  ev.preventDefault();const pin=$('pin').value;$('err').textContent='';
  if(!pin){$('err').textContent='Escriba su clave.';$('pin').focus();return;}
  const b=$('btnLogin');b.disabled=true;b.textContent='Verificando…';
  try{
    const j=await llamarAcceso({pin,aparato:apaLeer()});
    if(j.ok&&j.access_token){
      const {error}=await sb.auth.setSession({access_token:j.access_token,refresh_token:j.refresh_token});
      if(error)throw error;apaGuardar(j.aparato_token);$('pin').value='';
      const {data}=await sb.auth.getSession();validar(data.session);
    }else{$('err').textContent=j.error||'No se pudo entrar.';$('pin').value='';$('pin').focus();}
  }catch(e){$('err').textContent='No se pudo entrar. Intente de nuevo.';}
  b.disabled=false;b.textContent='Entrar';
};
$('btnPin').onclick=()=>{$('pinA').value='';$('pinN').value='';$('errPin').textContent='';$('dPin').hidden=false;$('pinA').focus();};
$('pinNo').onclick=()=>{$('dPin').hidden=true;};
['pinA','pinN'].forEach(i=>$(i).oninput=e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,4);});
$('fPin').onsubmit=async ev=>{
  ev.preventDefault();const a=$('pinA').value,n=$('pinN').value;
  if(!/^[0-9]{4}$/.test(a)||!/^[0-9]{4}$/.test(n)){$('errPin').textContent='Ambos PIN deben tener 4 números.';return;}
  const b=$('pinSi');b.disabled=true;
  const j=await llamarAcceso({accion:'cambiar',pin:a,nuevo:n,aparato:apaLeer()}).catch(()=>({}));
  b.disabled=false;
  if(j.ok){$('dPin').hidden=true;alert_ok();}else $('errPin').textContent=j.error||'No se pudo cambiar el PIN.';
};
function alert_ok(){const b=$('btnPin');b.textContent='Clave cambiada';setTimeout(()=>{b.textContent='Cambiar clave';},3000);}
if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('sw.js').catch(()=>{}));
$('btnAct').onclick=async()=>{const b=$('btnAct');b.disabled=true;b.textContent='Actualizando…';
  try{const {data:ss}=await sb.auth.getSession();const tk=ss&&ss.session?ss.session.access_token:SUPA_KEY;const HS={apikey:SUPA_KEY,Authorization:'Bearer '+tk};const H={headers:HS};/* las funciones reciben la sesión de la persona (antes facturas-recibidas recibía solo la llave pública y no traía nada) */const P={method:'POST',headers:{...HS,'Content-Type':'application/json'},body:'{}'};const F=SUPA_URL+'/functions/v1/';const rs=await Promise.allSettled([fetch(F+'facturas-recibidas',H),fetch(F+'bcr-diario?dias=4',P),fetch(F+'meta-diario?dias=3',P),fetch(F+'goatcounter-diario?dias=2',P)]);await cargar();
    const mal=rs.filter(x=>x.status==='rejected'||!x.value.ok).length;
    const d=new Date();b.textContent=(mal?'Actualizado con '+mal+(mal===1?' fuente sin respuesta':' fuentes sin respuesta')+' · ':'Actualizado ')+d.toLocaleTimeString('es-CR',{hour:'numeric',minute:'2-digit'});}
  catch(e){b.textContent='No se pudo actualizar';}
  setTimeout(()=>{b.disabled=false;},4000);};
$('btnSalir').onclick=async()=>{try{localStorage.removeItem('panel.entro');}catch(e){}await cClear();try{await sb.auth.signOut();}catch(e){}location.reload();};

// ===== Avisos al telefono (Hacienda rechazo) =====
(function(){
  const box=$('avisos');if(!box)return;
  const b64=v=>{const p='='.repeat((4-v.length%4)%4),r=(v+p).replace(/-/g,'+').replace(/_/g,'/'),x=atob(r),o=new Uint8Array(x.length);for(let i=0;i<x.length;i++)o[i]=x.charCodeAt(i);return o;};
  const ios=/iPhone|iPad|iPod/.test(navigator.userAgent),instalada=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
  const soporta='serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
  let msg='';
  function pinta(t,s,bots){box.hidden=false;box.innerHTML='';const a=document.createElement('div');a.className='tx';const b=document.createElement('b');b.textContent=t;const sp=document.createElement('span');sp.textContent=s;a.append(b,sp);box.append(a);
    if(bots&&bots.length){const w=document.createElement('div');w.className='bt';bots.forEach(([n,f,c])=>{const k=document.createElement('button');k.type='button';k.className=c||'out';k.textContent=n;k.onclick=f;w.append(k);});box.append(w);}}
  async function sub(){const r=await navigator.serviceWorker.ready;return r.pushManager.getSubscription();}
  async function estado(){
    if(!soporta){
      if(ios&&!instalada)return pinta('Avisos de Hacienda en el iPhone','Para recibirlos, primero abra el panel desde su pantalla de inicio: en Safari toque Compartir, luego «Agregar a pantalla de inicio», y abra el panel desde ese ícono.');
      return pinta('Avisos de Hacienda','Este navegador no puede recibir avisos. En el iPhone, use el panel instalado desde la pantalla de inicio.');}
    if(Notification.permission==='denied')return pinta('Avisos bloqueados','Este teléfono tiene los avisos del panel bloqueados. Para activarlos, abra Ajustes, Notificaciones, Panel La Bomba, y permítalos.');
    let s=null;try{s=await sub();}catch(e){}
    let activo=false;if(s&&navigator.onLine){try{const {data}=await sb.rpc('panel_push_estado',{p_endpoint:s.endpoint});activo=data===true;}catch(e){activo=!!s;}}else activo=!!s;
    if(activo)return pinta('Avisos de Hacienda activados en este teléfono',msg||'Le avisaremos aquí cuando Hacienda rechace un comprobante. El aviso no trae montos ni datos de clientes.',[['Enviar aviso de prueba',prueba,'out'],['Desactivar avisos',quitar,'out']]);
    pinta('Avisos de Hacienda en este teléfono',msg||'Active los avisos y le llegará una notificación cuando Hacienda rechace un comprobante.',[['Activar avisos en este teléfono',activar,'cta']]);
  }
  async function activar(){
    msg='';
    try{
      const p=await Notification.requestPermission();
      if(p!=='granted'){msg=p==='denied'?'':'No se activaron los avisos porque no se permitió la notificación.';return estado();}
      const {data:clave,error:e1}=await sb.rpc('panel_push_clave');if(e1||!clave)throw e1||new Error('sin clave');
      const reg=await navigator.serviceWorker.ready;
      let s=await reg.pushManager.getSubscription();
      if(!s)s=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64(clave)});
      const j=s.toJSON();
      const {error:e2}=await sb.rpc('panel_push_suscribir',{p_endpoint:j.endpoint,p_p256dh:j.keys.p256dh,p_auth:j.keys.auth,p_dispositivo:(ios?'iPhone':'Navegador')+(instalada?' (app instalada)':'')});
      if(e2)throw e2;
      msg='Listo: los avisos quedaron activados.';
    }catch(e){msg='No se pudieron activar los avisos. Intente de nuevo en un momento.';}
    estado();
  }
  async function quitar(){
    try{const s=await sub();if(s){await sb.rpc('panel_push_quitar',{p_endpoint:s.endpoint});await s.unsubscribe();}msg='Los avisos quedaron desactivados en este teléfono.';}catch(e){msg='No se pudieron desactivar los avisos. Intente de nuevo.';}
    estado();
  }
  async function prueba(){
    try{const {error}=await sb.rpc('panel_push_prueba');if(error)throw error;msg='Enviamos un aviso de prueba. Si no le llega en un minuto, desactive y vuelva a activar los avisos.';}catch(e){msg='No se pudo enviar la prueba.';}
    estado();
  }
  window.panelAvisos=estado;
})();
sb.auth.getSession().then(({data})=>validar(data.session));
sb.auth.onAuthStateChange(ev=>{if(ev==='SIGNED_OUT')validar(null);});

/* Apariencia: automática (sigue al aparato), clara u oscura; se recuerda solo en este navegador */
(function(){const b=$('btnTema');if(!b||!window.panelTema)return;const O=['','claro','oscuro'],N={'':'automática',claro:'clara',oscuro:'oscura'};
  const pinta=()=>{b.textContent='Apariencia: '+N[window.panelTema.leer()||''];};
  b.onclick=()=>{const i=(O.indexOf(window.panelTema.leer()||'')+1)%3;window.panelTema.guardar(O[i]);pinta();};pinta();})();

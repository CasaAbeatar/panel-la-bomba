/* ---- Atender: lo que llega al correo (pagos, estados, Hacienda, municipalidad) y hay que resolver ---- */
const atender=(()=>{
const CAT={hacienda:'Hacienda',municipalidad:'Municipalidad',pagos:'Pagos',banco:'Banco',proveedores:'Proveedores',empleados:'Empleados',salud:'Salud',seguros:'Seguros',sistema:'Sistema',seguridad:'Seguridad',otro:'Otro'};
const EMPN={soda:'Soda',pollos:'Pollos',grupo:'Grupo'};
const fmtN=n=>new Intl.NumberFormat('es-CR').format(n);
const GR={1:'Atender primero',2:'Atender pronto',3:'Revisar cuando pueda'};
let D=null,cargando=false,err=null;
async function traer(){
  if(cargando)return;cargando=true;
  try{const {data,error}=await sb.rpc('panel_atender_lista');if(error)throw error;D=data;err=null;}catch(e){err='No se pudo cargar la lista. Toque «Actualizar» para intentarlo otra vez.';}
  cargando=false;pintar();notas();if(typeof pintarGastos==='function'&&typeof GG!=='undefined'&&GG[EMP]){try{pintarGastos();pintarImpuestos();}catch(e){}}
}
function visibles(){return D?(D.items||[]).filter(x=>EMP==='grupo'||x.empresa===EMP||x.empresa==='grupo'):[];}
function pintarN(){const n=$('at-n');if(!n)return;const c=visibles().filter(x=>x.estado==='abierto').length+((D&&D.vivos)||[]).filter(x=>EMP==='grupo'||x.empresa===EMP||x.empresa==='grupo').length;n.textContent=c;n.hidden=!c;}
function card(x){
  const desp=x.estado==='despues';
  return `<div class="at-card" data-i="${x.importancia}" data-id="${x.id}">
    <div class="at-top"><span class="at-chip">${esc(CAT[x.categoria]||'Otro')}</span><span class="at-chip">${esc(EMPN[x.empresa]||'')}</span>${desp?'<span class="at-chip">Lo dejó para después</span>':''}</div>
    <h3>${esc(x.titulo)}</h3>${x.detalle?`<p>${esc(x.detalle)}</p>`:''}
    <div class="at-btns"><button type="button" class="main" data-ac="resuelto">Ya lo resolví</button>${desp?'<button type="button" data-ac="abierto">Volver a ponerlo arriba</button>':'<button type="button" data-ac="despues">Dejarlo para después</button>'}${x.enlace?`<a href="${esc(x.enlace)}" target="_blank" rel="noopener">Abrir</a>`:''}</div></div>`;
}
function pintar(){
  const el=$('sec-atender');if(!el)return;pintarN();
  if(!D){el.innerHTML=err?`<p class="note">${esc(err)}</p>`:'<p class="note">Cargando…</p>';return;}
  const it=visibles(),ab=it.filter(x=>x.estado==='abierto'),de=it.filter(x=>x.estado==='despues');
  const vv=(D.vivos||[]).filter(x=>EMP==='grupo'||x.empresa===EMP||x.empresa==='grupo');
  const viv=vv.map(x=>`<div class="at-vivo" data-i="${x.importancia}"><span>${esc(x.etiqueta)}${EMP==='grupo'&&x.empresa!=='grupo'?` <span class="at-chip">${esc(EMPN[x.empresa]||'')}</span>`:''}</span><span style="display:flex;gap:14px;align-items:center"><b>${fmtN(x.n)}</b>${x.enlace?`<a class="at-ir" href="${esc(x.enlace)}" target="_blank" rel="noopener">Ver</a>`:''}</span></div>`);
  let h=`<div class="dayl">Hoy · <b>${fl(hoyCR())}</b></div>
  <div class="g"><div class="blk"><h2>Para atender</h2><p style="margin:12px 0 4px;font-size:16px;line-height:1.4">${ab.length?`Hay <b>${ab.length}</b> asunto${ab.length>1?'s':''} del correo y de la operación por atender${ab.some(x=>x.importancia===1)?`, <b>${ab.filter(x=>x.importancia===1).length}</b> para atender primero`:''}.`:'No hay asuntos del correo por atender en este momento.'}</p>
  <p class="note">Aquí se juntan las solicitudes de pago, estados de cuenta y avisos de Hacienda, la Municipalidad, bancos y proveedores que llegan al correo. Cuando algo ya está resuelto, tóquelo y sale de la lista.</p></div></div>`;
  if(viv.length)h+=`<h2 class="at-h">En el sistema, ahora mismo</h2>${viv.join('')}`;
  [1,2,3].forEach(i=>{const g=ab.filter(x=>x.importancia===i);if(g.length)h+=`<h2 class="at-h">${GR[i]}</h2>${g.map(card).join('')}`;});
  if(de.length)h+=`<h2 class="at-h">Lo que dejó para después</h2>${de.map(card).join('')}`;
  const rs=D.resueltos||[];
  if(rs.length)h+=`<details style="margin-top:26px"><summary class="note" style="cursor:pointer;padding:10px 0">Resueltas hace poco (${rs.length})</summary>${rs.map(x=>`<div class="at-card"><div class="at-top"><span class="at-chip">${esc(CAT[x.categoria]||'Otro')}</span><span class="at-chip">${esc(EMPN[x.empresa]||'')}</span></div><h3>${esc(x.titulo)}</h3><div class="at-btns"><button type="button" data-id="${x.id}" data-ac="abierto">Volver a ponerlo arriba</button></div></div>`).join('')}</details>`;
  h+=`<div class="at-btns" style="margin-top:26px"><button type="button" data-ac="recargar">Actualizar</button></div>`;
  if(err)h+=`<p class="note">${esc(err)}</p>`;
  el.innerHTML=h;
}
document.addEventListener('click',async e=>{
  const b=e.target.closest('#sec-atender [data-ac]');if(!b)return;
  const ac=b.dataset.ac;if(ac==='recargar'){traer();return;}
  const id=+(b.dataset.id||b.closest('[data-id]').dataset.id);b.disabled=true;
  try{const {error}=await sb.rpc('panel_atender_marcar',{p_id:id,p_estado:ac});if(error)throw error;await traer();}
  catch(x){b.disabled=false;err='No se pudo guardar el cambio. Intente otra vez.';pintar();}
});
function nota(tema){
  if(!D)return '';
  const vv=(D.vivos||[]).filter(x=>EMP==='grupo'||x.empresa===EMP||x.empresa==='grupo');
  const t={gastos:/^(recibir|hac-precio|hac-cabys|hac-tarifa)/,impuestos:/^(hac-|receptor)/,precios:/^hac-precio/}[tema];
  const CT={gastos:['proveedores'],impuestos:['hacienda'],ingresos:['banco','pagos'],presencia:['otro'],precios:[]}[tema];if(!t&&!CT)return '';
  let n=t?vv.filter(x=>t.test(x.clave)).reduce((a,x)=>a+x.n,0):0;
  n+=visibles().filter(x=>x.estado==='abierto'&&(CT||[]).includes(x.categoria)).length;
  return n?`<a class="atlink" href="#" data-go="atender"><b>${fmtN(n)}</b> cosa${n>1?'s':''} de esta pestaña ${n>1?'esperan':'espera'} en el Asistente. Toque para verlas.</a>`:'';
}
function notas(){document.querySelectorAll('.atnota').forEach(el=>{const t=el.dataset.tema;el.innerHTML=nota(t);el.hidden=(typeof SEC==='undefined')||SEC!==t;});}
return {notas,ver(){if(!D)pintar();traer();},contar(){traer();},nota};
})();

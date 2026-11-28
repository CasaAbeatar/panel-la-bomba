/* ---- Salud: «Control desde aquí» para cada teléfono y cada computadora registrados (28 nov 2026). ----
   Nada está escrito para un equipo en particular: los bloques salen de la lista que entrega public.panel_control() (teléfonos de SINPE Móvil
   y computadoras de caja que existen en la base), así que un equipo nuevo aparece solo.
   Revisar ahora:
     - Teléfono: public.revisar_ahora('sinpe:<empresa>:<teléfono>') despierta al teléfono por Firebase y el teléfono responde con un latido (1 a 3 s).
     - Computadora: public.revisar_ahora('equipo:<estación>') espera el próximo latido de la computadora (avisa cada minuto).
     - El progreso sale de public.revisar_estado(id). Nada de esto abre alertas ni incidentes.
   Solo administrador: las tres funciones exigen la sesión del panel (es_panel()). Hora de Costa Rica. Todo texto externo se escapa con esc(). */
const controlVista=(()=>{
const URL_PANTALLA='https://pagos.dmalabomba.com/remoto/';
const URL_CRD='https://remotedesktop.google.com/access';
let CTL=null;                 // lo último que entregó panel_control()
const REV={};                 // estado por objetivo: {id,estado,msg,t0,fin}
let TODO=[];                  // objetivos de la última pasada de «Revisar todo ahora»
const NOMEMP={soda:'la Soda',pollos:'Pollos y Papea'};
const nomTel=t=>'Teléfono de '+(t.empresa==='soda'?'la Soda':'Pollos y Papea')+' (SINPE Móvil)';
const objTel=t=>'sinpe:'+t.empresa+':'+t.telefono;
const objEq=e=>'equipo:'+e.estacion;
const sec=s=>s==null?'':(s<10?String(Math.round(s*10)/10).replace('.',','):String(Math.round(s)));
const punto=e=>'<i class="e-'+e+'" aria-hidden="true"></i>';

function datos(c){CTL=c||CTL;}
function telDe(obj){return CTL&&(CTL.telefonos||[]).find(t=>objTel(t)===obj);}
function eqDe(obj){return CTL&&(CTL.equipos||[]).find(e=>objEq(e)===obj);}

/* texto del estado de un objetivo: lo que se está pidiendo ahora o, si no hay nada en curso, lo último que se pidió desde el panel */
function linea(obj){
  const r=REV[obj];
  if(r){
    const e=r.estado==='respondio'?'ok':r.estado==='pedida'?'aviso':r.estado==='no_posible'?'sin_datos':'caido';
    const extra=r.estado==='pedida'?' ('+Math.max(0,Math.round((Date.now()-r.t0)/1000))+' s)':r.hora?' · revisado a las '+esc(r.hora):'';
    return punto(e)+'<span>'+esc(r.msg)+extra+'</span>';
  }
  const x=(telDe(obj)||eqDe(obj)||{}).ultima;
  if(x&&x.creado_en){
    const cuando=sHace(x.creado_en);
    const txt=x.estado==='respondio'?'respondió en '+sec(x.segundos)+' s':x.estado==='sin_respuesta'?'no respondió':x.estado==='pedida'?'no llegó respuesta':'no fue posible';
    return punto(x.estado==='respondio'?'ok':x.estado==='pedida'||x.estado==='sin_respuesta'?'caido':'sin_datos')+'<span>Última revisión pedida desde aquí: '+txt+' ('+esc(cuando)+').</span>';
  }
  return '<span class="ctl-mute">Todavía no se ha pedido ninguna revisión desde aquí.</span>';
}
function pintarLinea(obj){
  document.querySelectorAll('[data-rv-estado]').forEach(el=>{if(el.getAttribute('data-rv-estado')===obj)el.innerHTML=linea(obj);});
  document.querySelectorAll('[data-rev]').forEach(b=>{
    if(b.getAttribute('data-obj')===obj){const ocup=REV[obj]&&REV[obj].estado==='pedida';b.disabled=!!ocup;b.setAttribute('aria-busy',ocup?'true':'false');}
  });
  pintarTodo();
}

/* ---- pedir y seguir ---- */
function seguir(obj,id,aviso){
  const r=REV[obj]={id,estado:'pedida',msg:aviso||'Pidiendo respuesta…',t0:Date.now(),fin:false,errores:0};
  pintarLinea(obj);
  const paso=async()=>{
    if(r.fin||REV[obj]!==r)return;
    try{
      const {data,error}=await sb.rpc('revisar_estado',{p_id:id});
      if(error)throw error;
      r.errores=0;r.estado=data.estado;r.msg=data.mensaje||r.msg;
      if(data.terminado){r.fin=true;r.hora=new Date().toLocaleTimeString('es-CR',{timeZone:'America/Costa_Rica',hour:'2-digit',minute:'2-digit',hour12:false});if(data.estado==='respondio'&&data.segundos!=null)r.seg=data.segundos;}
    }catch(e){
      r.errores++;
      if(/no autorizado|jwt/i.test(String(e&&e.message))){r.fin=true;r.estado='caido';r.msg='Tu sesión venció. Vuelve a entrar al panel.';}
      else if(r.errores>=4||Date.now()-r.t0>120000){r.fin=true;r.estado='caido';r.msg='Se perdió la conexión con la base antes de recibir la respuesta.';}
    }
    pintarLinea(obj);
    if(r.fin){if(r.estado==='respondio'){setTimeout(()=>{try{pintarSalud();}catch(e){}},500);}return;}
    setTimeout(paso,1100);
  };
  setTimeout(paso,700);
}
async function pedir(obj){
  const previo=REV[obj];if(previo&&previo.estado==='pedida')return;
  REV[obj]={estado:'pedida',msg:'Pidiendo respuesta…',t0:Date.now(),fin:false};pintarLinea(obj);
  let res;
  try{const {data,error}=await sb.rpc('revisar_ahora',{p_objetivo:obj});if(error)throw error;res=data;}
  catch(e){
    const venc=/no autorizado|jwt/i.test(String(e&&e.message));
    REV[obj]={estado:'caido',msg:venc?'Tu sesión venció. Vuelve a entrar al panel.':'No se pudo pedir la revisión ahora. Intenta de nuevo en un momento.',t0:Date.now(),fin:true};pintarLinea(obj);return;}
  if(res&&res.ok===false&&res.id&&res.motivo==='espera'){seguir(obj,res.id,res.mensaje);return;}   // se pidió hace unos segundos: se sigue esa misma
  if(!res||res.ok===false){REV[obj]={estado:res&&res.motivo==='tope'?'caido':'no_posible',msg:(res&&res.mensaje)||'No se pudo pedir la revisión.',t0:Date.now(),fin:true};pintarLinea(obj);return;}
  seguir(obj,res.id,res.mensaje);
}

/* ---- órdenes al teléfono (despiertan al teléfono para que llegue en segundos) ---- */
const ORD={
  reiniciar_servicio:{t:'Reiniciar el servicio de SINPE en el teléfono',d:'Cierra y vuelve a abrir el programa que reenvía los SMS. No apaga el teléfono.'},
  reenviar_historial:{t:'Reenviar los SMS que no salieron',d:'El teléfono vuelve a mandar los SMS de pago que quedaron pendientes.'},
  reiniciar_telefono:{t:'Reiniciar el teléfono',d:'Pide al teléfono que se reinicie. Durante 1 o 2 minutos no recibe SMS.',confirmar:true}
};
const CONF={};   // confirmación en dos toques
async function orden(obj,empresa,telefono,cmd){
  const clave=obj+'|'+cmd;
  if(ORD[cmd].confirmar&&!CONF[clave]){
    CONF[clave]=setTimeout(()=>{delete CONF[clave];pintarOrdenes();},7000);pintarOrdenes();return;}
  if(CONF[clave]){clearTimeout(CONF[clave]);delete CONF[clave];}
  REV[obj]={estado:'pedida',msg:'Enviando la orden «'+ORD[cmd].t+'» y despertando al teléfono…',t0:Date.now(),fin:false};pintarLinea(obj);pintarOrdenes();
  try{
    const {data,error}=await sb.rpc('sinpe_comando_crear',{p_empresa:empresa,p_cmd:cmd,p_telefono:telefono,p_nota:'Pedido desde el panel (Salud, Control desde aquí)',p_vence_min:null});
    if(error)throw error;
    if(!data||data.ok===false){REV[obj]={estado:'caido',msg:'No se pudo enviar la orden: '+(data&&data.error?data.error:'respuesta vacía')+'.',t0:Date.now(),fin:true};pintarLinea(obj);return;}
    if(data.revision_id){seguir(obj,data.revision_id,'Orden enviada. Despertando al teléfono…');}
    else{REV[obj]={estado:'respondio',msg:data.duplicado?'Esa orden ya estaba pendiente; el teléfono la recibe en su próximo latido (cada 15 min).':'Orden enviada. Este teléfono no se puede despertar desde aquí: la recibe en su próximo latido (cada 15 min).',t0:Date.now(),fin:true};pintarLinea(obj);}
  }catch(e){REV[obj]={estado:'caido',msg:/no autorizado|jwt/i.test(String(e&&e.message))?'Tu sesión venció. Vuelve a entrar al panel.':'No se pudo enviar la orden. Intenta de nuevo en un momento.',t0:Date.now(),fin:true};pintarLinea(obj);}
  pintarOrdenes();
}
function pintarOrdenes(){
  document.querySelectorAll('[data-cmd]').forEach(b=>{
    const clave=b.getAttribute('data-obj')+'|'+b.getAttribute('data-cmd'),cmd=b.getAttribute('data-cmd');
    b.textContent=CONF[clave]?'Tocar otra vez para confirmar: '+ORD[cmd].t.toLowerCase():ORD[cmd].t;
    b.classList.toggle('ctl-conf',!!CONF[clave]);
  });
}

/* ---- HTML de cada bloque ---- */
function tel(t){
  if(!t)return '';
  const obj=objTel(t),info=telDe(obj)||{};
  const nota=info.despertable===false?'<p class="ctl-n ctl-w">Este teléfono todavía no se puede despertar desde aquí. Responde solo en su latido, cada 15 minutos.</p>':'<p class="ctl-n">El teléfono responde en pocos segundos: se le manda un aviso de Firebase y contesta con un latido completo. Por unos segundos le aparece «Reconectando…». No abre alertas.</p>';
  const ordenes=Object.keys(ORD).map(c=>`<div class="ctl-fila"><button type="button" class="out ctl-btn" data-cmd="${c}" data-obj="${esc(obj)}" data-emp="${esc(t.empresa)}" data-tel="${esc(t.telefono)}">${esc(ORD[c].t)}</button><span>${esc(ORD[c].d)}</span></div>`).join('');
  const pant=info.pantalla_remota===false?'Este teléfono todavía no tiene el permiso de pantalla remota.':info.sesion_abierta?'Hay una sesión de pantalla remota abierta ahora.':'Se abre en otra pestaña. Pide el usuario y la clave del facturador de un administrador general. Al abrirla, el teléfono se despierta solo para que la imagen salga en segundos.';
  return `<div class="ctl" data-rv-box="${esc(obj)}"><h3 class="ctl-t">Control desde aquí</h3>${nota}
    <div class="ctl-b"><button type="button" class="out ctl-btn" data-rev="uno" data-obj="${esc(obj)}">Pedir al teléfono que responda ahora</button></div>
    <p class="ctl-e" data-rv-estado="${esc(obj)}" role="status" aria-live="polite">${linea(obj)}</p>
    <div class="ctl-b"><a class="out ctl-btn" href="${URL_PANTALLA}" target="_blank" rel="noopener" data-rev-pant="${esc(t.empresa)}">Abrir la pantalla del teléfono</a></div>
    <p class="ctl-n">${esc(pant)}</p>
    <details class="ctl-d"><summary>Otras órdenes al teléfono</summary>${ordenes}<p class="ctl-n">Cada orden despierta primero al teléfono para que se haga en segundos. Si el teléfono no se puede despertar, la recibe en su próximo latido.</p></details>
    <p class="ctl-n">Depuración inalámbrica (ADB): solo alcanza dentro de la red del local. Fuera de esa red, la vía es la pantalla remota. Se pide desde la pantalla remota con el usuario administrador general.</p></div>`;
}
function eq(e){
  if(!e)return '';
  const obj='equipo:'+e.estacion,info=eqDe(obj)||{};
  if(info.sin_kit===true||!e.creado_en)return `<div class="ctl" data-rv-box="${esc(obj)}"><h3 class="ctl-t">Control desde aquí</h3><p class="ctl-n ctl-w">Esta computadora todavía no tiene instalado el kit con latido, así que no se puede revisar desde aquí.</p>${crd(info)}</div>`;
  return `<div class="ctl" data-rv-box="${esc(obj)}"><h3 class="ctl-t">Control desde aquí</h3>
    <p class="ctl-n">La computadora avisa sola cada minuto. Esta revisión espera su próximo aviso (hasta 1 minuto) y muestra cuánto tardó. Si el último aviso es de hace menos de 20 segundos, lo da por respuesta.</p>
    <div class="ctl-b"><button type="button" class="out ctl-btn" data-rev="uno" data-obj="${esc(obj)}">Pedir a la computadora que responda ahora</button></div>
    <p class="ctl-e" data-rv-estado="${esc(obj)}" role="status" aria-live="polite">${linea(obj)}</p>
    ${crd(info)}</div>`;
}
function crd(info){
  const inst=info.crd_instalado===true?'Instalado'+(info.crd_texto?' ('+esc(String(info.crd_texto).replace(/^Chrome Remote Desktop Host\s*/i,'versión '))+')':''):info.crd_instalado===false?'No aparece instalado':'Todavía sin ficha de la computadora';
  return `<div class="ctl-crd"><h4 class="ctl-h">Escritorio remoto completo</h4>
    <dl class="eq-dl"><div><dt>Programa de Chrome Remote Desktop</dt><dd>${inst}</dd></div><div><dt>Vinculada a la cuenta de Google</dt><dd>El panel no puede saberlo</dd></div></dl>
    <div class="ctl-b"><a class="out ctl-btn" href="${URL_CRD}" target="_blank" rel="noopener">Abrir el escritorio remoto de Google</a></div>
    <p class="ctl-n">Ahí aparecen las computadoras ya vinculadas a la cuenta de Google. Para vincular una computadora, Emil inicia sesión una sola vez en ella con su cuenta de Google y le pone un PIN; el panel nunca ve la cuenta ni el PIN.</p>
    ${info.ordenes_listas===false?'<p class="ctl-n">Las órdenes firmadas (reparar, reiniciar la caja, actualizar el kit) todavía no están activas: falta la clave de firma y que el kit de la computadora las ejecute.</p>':''}</div>`;
}

/* ---- «Revisar todo ahora» (respeta Grupo, Soda o Pollos) ---- */
function objetivosVista(){
  if(!CTL)return [];
  const ok=emp=>EMP==='grupo'||emp===EMP;
  return (CTL.telefonos||[]).filter(t=>ok(t.empresa)).map(t=>({obj:objTel(t),nom:nomTel(t)}))
    .concat((CTL.equipos||[]).filter(e=>ok(e.empresa)).map(e=>({obj:objEq(e),nom:e.nombre})));
}
function todo(){
  const L=objetivosVista(),ocup=TODO.some(o=>REV[o]&&REV[o].estado==='pedida');
  const quien=EMP==='grupo'?'todos los teléfonos y todas las computadoras':'los teléfonos y las computadoras de '+(NOMEMP[EMP]||'esta empresa');
  return `<div class="ctl-top"><div class="ctl-tt"><b>Revisar todo ahora</b><span>Pide a ${esc(quien)} que respondan ya, sin esperar su aviso de rutina. Los teléfonos tardan unos segundos y las computadoras hasta 1 minuto.</span></div>
    <button type="button" class="out ctl-btn" data-rev="todo"${ocup||!L.length?' disabled':''}>Revisar todo ahora</button>
    <ul class="ctl-lista" data-rv-todo>${listaTodo()}</ul></div>`;
}
function listaTodo(){
  if(!TODO.length)return '';
  const nom={};objetivosVista().forEach(x=>nom[x.obj]=x.nom);
  return TODO.filter(o=>nom[o]).map(o=>`<li><b>${esc(nom[o])}</b><span>${linea(o)}</span></li>`).join('');
}
function pintarTodo(){
  document.querySelectorAll('[data-rv-todo]').forEach(ul=>{ul.innerHTML=listaTodo();});
  const ocup=TODO.some(o=>REV[o]&&REV[o].estado==='pedida');
  document.querySelectorAll('[data-rev="todo"]').forEach(b=>{b.disabled=ocup||!objetivosVista().length;});
}
async function pedirTodo(){
  TODO=objetivosVista().map(x=>x.obj);pintarTodo();
  await Promise.all(TODO.map(o=>pedir(o)));
}

document.addEventListener('click',ev=>{
  const b=ev.target.closest&&ev.target.closest('[data-rev],[data-cmd],[data-rev-pant]');if(!b)return;
  if(b.hasAttribute('data-cmd')){ev.preventDefault();orden(b.getAttribute('data-obj'),b.getAttribute('data-emp'),b.getAttribute('data-tel'),b.getAttribute('data-cmd'));return;}
  if(b.hasAttribute('data-rev-pant')){   // el enlace se abre solo; aquí solo se despierta al teléfono
    const emp=b.getAttribute('data-rev-pant');try{sb.rpc('revisar_ahora',{p_objetivo:'pantalla:'+emp}).then(()=>{},()=>{});}catch(e){}return;}
  if(b.getAttribute('data-rev')==='todo'){ev.preventDefault();pedirTodo();return;}
  ev.preventDefault();pedir(b.getAttribute('data-obj'));
});
return {datos,tel,eq,todo,pintarTodo};
})();

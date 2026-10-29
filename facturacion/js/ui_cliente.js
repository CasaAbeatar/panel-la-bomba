// Componentes de clientes reutilizables (los usa la pantalla Clientes y los puede usar Caja).
//
//   import { selectorCliente, abrirFormCliente } from './ui_cliente.js';
//
//   selectorCliente(app, { alElegir(cliente) { ... }, titulo? })
//     Abre una ventana con buscador grande (nombre, cédula, correo o teléfono) y la lista de clientes del local activo.
//     Al tocar "Elegir" llama alElegir(cliente) y cierra la ventana. Tiene el botón "Agregar cliente nuevo":
//     al guardar el cliente nuevo también se elige solo. Devuelve { cerrar }.
//     "cliente" es la fila completa de fact.clientes: { id, tipo_id, identificacion, nombre, nombre_comercial, correo, telefono,
//     provincia, canton, distrito, barrio, otras_senas, actividad_codigo, notas, ... }.
//
//   abrirFormCliente(app, cliente|null, { alGuardar(cliente), titulo? })
//     Abre el formulario completo para crear (cliente = null) o ver/editar un cliente. Devuelve { cerrar }.
import { h, modal, conBoton, debounce, TIPOS_ID, toast } from './util.js';
import { api, funcion } from './api.js';
import { UBICACIONES } from './data_ubicaciones.js';
import { cargarCss, aviso, campo, soloDigitos } from './ui_mant.js';

// Reglas de Hacienda (v4.4) para el número de identificación del receptor
export const REGLAS_ID = {
  '01': { min: 9, max: 9, ayuda: 'Cédula física: 9 números seguidos, sin guiones ni espacios. Ejemplo: 112340567.' },
  '02': { min: 10, max: 10, ayuda: 'Cédula jurídica: 10 números seguidos, sin guiones. Ejemplo: 3102765594.' },
  '03': { min: 11, max: 12, ayuda: 'DIMEX (residente extranjero): 11 o 12 números seguidos, sin guiones. Ejemplo: 155812345678.' },
  '04': { min: 10, max: 10, ayuda: 'NITE: 10 números seguidos, sin guiones.' },
  '05': { min: 1, max: 20, ayuda: 'Extranjero no domiciliado: el número de su documento, solo números (hasta 20).' },
  '06': { min: 1, max: 20, ayuda: 'No contribuyente: el número con que se le identifique, solo números (hasta 20).' },
};

export function errorIdentificacion(tipo, ident) {
  const r = REGLAS_ID[tipo];
  if (!r) return 'Elija el tipo de identificación.';
  if (!ident) return 'Escriba el número de identificación.';
  if (ident.length < r.min || ident.length > r.max) return r.ayuda.split(':')[0] + ' tiene ' + (r.min === r.max ? r.min : r.min + ' o ' + r.max) + ' números. Usted escribió ' + ident.length + '.';
  return '';
}

const RE_CORREO = /^[^\s@,;]+@[^\s@,;]+\.[^\s@,;]{2,}$/;
// Acepta uno o varios correos separados por coma, punto y coma o espacio
export function leerCorreos(texto) {
  const lista = String(texto || '').split(/[,;\s]+/).map((x) => x.trim().toLowerCase()).filter(Boolean);
  if (!lista.length) return { lista, error: 'Escriba el correo donde se enviará la factura.' };
  const malo = lista.find((c) => !RE_CORREO.test(c));
  if (malo) return { lista, error: 'El correo "' + malo + '" no parece válido. Revise que tenga @ y un punto después.' };
  return { lista, error: '' };
}

const pad2 = (x) => String(x ?? '').replace(/\D/g, '').padStart(2, '0').slice(-2);
const nombresOrdenados = (obj, i) => Object.entries(obj || {}).sort((a, b) => String(i ? a[1][0] : a[1]).localeCompare(String(i ? b[1][0] : b[1]), 'es'));

export function abrirFormCliente(app, cliente, { alGuardar, titulo } = {}) {
  cargarCss();
  const soc = app.soc;
  const c = cliente || {};
  const esNuevo = !c.id;
  const err = h('div.error-caja', { hidden: true, role: 'alert' });
  const mostrarError = (m, campoEl) => { err.textContent = m; err.hidden = !m; if (m) { err.scrollIntoView({ block: 'nearest' }); campoEl?.focus(); } };

  const tipo = h('select.campo', { 'aria-label': 'Tipo de identificación' }, Object.entries(TIPOS_ID).map(([k, v]) => h('option', { value: k, selected: (c.tipo_id || '01') === k }, v)));
  const ident = soloDigitos(h('input.campo', { type: 'text', inputmode: 'numeric', autocomplete: 'off', value: c.identificacion || '', 'aria-label': 'Número de identificación' }), 20);
  const ayudaId = h('small'), contador = h('small.contador');
  const avisoDup = h('div', { hidden: true });
  const avisoHac = h('div', { hidden: true });
  const nombre = h('input.campo', { type: 'text', autocomplete: 'off', value: c.nombre || '', 'aria-label': 'Nombre o razón social' });
  const comercial = h('input.campo', { type: 'text', autocomplete: 'off', value: c.nombre_comercial || '', 'aria-label': 'Nombre comercial' });
  const correo = h('input.campo', { type: 'text', inputmode: 'email', autocapitalize: 'none', autocomplete: 'off', value: c.correo || '', 'aria-label': 'Correo' });
  const telefono = h('input.campo', { type: 'tel', autocomplete: 'off', value: c.telefono || '', 'aria-label': 'Teléfono' });
  const actividad = soloDigitos(h('input.campo', { type: 'text', inputmode: 'numeric', autocomplete: 'off', value: c.actividad_codigo || '', placeholder: 'Opcional, 6 números', 'aria-label': 'Código de actividad económica' }), 6);
  const listaAct = h('div', { hidden: true });
  const notas = h('textarea.campo', { rows: 2, 'aria-label': 'Notas' }, c.notas || '');
  const barrio = h('input.campo', { type: 'text', autocomplete: 'off', value: c.barrio || '', 'aria-label': 'Barrio' });
  const senas = h('textarea.campo', { rows: 2, 'aria-label': 'Otras señas' }, c.otras_senas || '');
  const prov = h('select.campo', { 'aria-label': 'Provincia' });
  const cant = h('select.campo', { 'aria-label': 'Cantón' });
  const dist = h('select.campo', { 'aria-label': 'Distrito' });

  // Provincia > cantón > distrito (códigos oficiales)
  prov.append(h('option', { value: '' }, 'Sin indicar'), ...nombresOrdenados(Object.fromEntries(Object.entries(UBICACIONES).map(([k, v]) => [k, v[0]]))).map(([k, n]) => h('option', { value: k }, n)));
  const llenarCantones = (sel, selDist) => {
    const cs = UBICACIONES[prov.value]?.[1] || {};
    cant.replaceChildren(h('option', { value: '' }, prov.value ? 'Elija el cantón' : 'Primero elija la provincia'), ...nombresOrdenados(cs, 1).map(([k, v]) => h('option', { value: k }, v[0])));
    cant.value = sel && cs[sel] ? sel : '';
    llenarDistritos(selDist);
  };
  const llenarDistritos = (sel) => {
    const ds = UBICACIONES[prov.value]?.[1]?.[cant.value]?.[1] || {};
    dist.replaceChildren(h('option', { value: '' }, cant.value ? 'Elija el distrito' : 'Primero elija el cantón'), ...nombresOrdenados(ds).map(([k, n]) => h('option', { value: k }, n)));
    dist.value = sel && ds[sel] ? sel : '';
  };
  prov.value = UBICACIONES[String(c.provincia || '')] ? String(c.provincia) : '';
  llenarCantones(c.canton ? pad2(c.canton) : '', c.distrito ? pad2(c.distrito) : '');
  prov.addEventListener('change', () => llenarCantones());
  cant.addEventListener('change', () => llenarDistritos());

  // Ayuda del tipo de identificación y conteo de números
  const refrescarId = () => {
    const r = REGLAS_ID[tipo.value];
    ayudaId.textContent = r.ayuda;
    const n = ident.value.length, ok = n >= r.min && n <= r.max;
    contador.textContent = n ? (ok ? 'Largo correcto: ' + n + ' números' : 'Lleva ' + n + ' números (debe tener ' + (r.min === r.max ? r.min : r.min + ' o ' + r.max) + ')') : '';
    contador.className = 'contador ' + (n ? (ok ? 'ok' : 'mal') : '');
    btnHac.hidden = !['01', '02', '03', '04'].includes(tipo.value);
    btnHac.disabled = !ok;
  };

  // Buscar en Hacienda (función de borde facturador-cedula)
  const btnHac = h('button.btn', { type: 'button', onclick: () => buscarHacienda() }, 'Buscar en Hacienda');
  async function buscarHacienda() {
    avisoHac.hidden = true;
    const e = errorIdentificacion(tipo.value, ident.value);
    if (e) return mostrarError(e, ident);
    mostrarError('');
    await conBoton(btnHac, async () => {
      btnHac.textContent = 'Buscando…';
      let r;
      try { r = await funcion('facturador-cedula', { cedula: ident.value }); } catch { r = null; }
      avisoHac.hidden = false;
      if (!r || !r.nombre) {
        avisoHac.replaceChildren(aviso('ambar', 'No se pudo consultar a Hacienda. Escriba el nombre a mano; todo lo demás se puede llenar igual.'));
        return;
      }
      nombre.value = String(r.nombre).trim();
      const t = String(r.tipo ?? '');
      if (/^0[1-6]$/.test(t)) tipo.value = t; else if (/f[ií]sica/i.test(t)) tipo.value = '01'; else if (/jur[ií]dica/i.test(t)) tipo.value = '02';
      refrescarId();
      const acts = (Array.isArray(r.actividades) ? r.actividades : []).map((a) => ({ codigo: String(a.codigo ?? '').replace(/\D/g, '').padStart(6, '0').slice(0, 6), descripcion: String(a.descripcion ?? '') })).filter((a) => /^\d{6}$/.test(a.codigo) && a.codigo !== '000000');
      listaAct.hidden = true;
      if (acts.length === 1) actividad.value = acts[0].codigo;
      else if (acts.length > 1) {
        listaAct.hidden = false;
        listaAct.replaceChildren(h('div.etq', 'Hacienda tiene varias actividades. Toque la que corresponde:'),
          h('div.mt-resultados', acts.map((a) => h('button.mt-res', { type: 'button', onclick: () => { actividad.value = a.codigo; listaAct.hidden = true; } }, h('span.cod', a.codigo), h('span.desc', a.descripcion)))));
      }
      avisoHac.replaceChildren(aviso('verde', 'Datos traídos de Hacienda. Revíselos antes de guardar.' + (acts.length > 1 ? ' Falta elegir la actividad económica.' : '')));
    });
  }

  // Evitar duplicados: misma identificación en este local
  const revisarDuplicado = debounce(async () => {
    avisoDup.hidden = true;
    const id = ident.value;
    if (errorIdentificacion(tipo.value, id)) return;
    if (!esNuevo && id === c.identificacion) return;
    try {
      const lista = await api.clientes(soc.id, id);
      const otro = lista.find((x) => x.identificacion === id && x.id !== c.id);
      if (!otro || ident.value !== id) return;
      avisoDup.hidden = false;
      avisoDup.replaceChildren(aviso('rojo', h('strong', 'Este cliente ya existe: '), otro.nombre + '. No se pueden guardar dos con la misma identificación.',
        h('div.fila', h('button.btn', { type: 'button', onclick: () => { m.cerrar(); abrirFormCliente(app, otro, { alGuardar, titulo }); } }, 'Abrir el cliente que ya existe'))));
    } catch { /* si falla la revisión, el servidor igual avisa al guardar */ }
  }, 350);
  ident.addEventListener('input', () => { refrescarId(); avisoDup.hidden = true; revisarDuplicado(); });
  tipo.addEventListener('change', () => { refrescarId(); revisarDuplicado(); });

  async function guardar(cerrar) {
    mostrarError('');
    const eId = errorIdentificacion(tipo.value, ident.value);
    if (eId) return mostrarError(eId, ident);
    if (!nombre.value.trim()) return mostrarError('Escriba el nombre o la razón social.', nombre);
    const cr = leerCorreos(correo.value);
    if (cr.error) return mostrarError(cr.error, correo);
    const tel = telefono.value.replace(/\D/g, '');
    if (tel && (tel.length < 8 || tel.length > 20)) return mostrarError('El teléfono debe tener al menos 8 números.', telefono);
    if (actividad.value && !/^\d{6}$/.test(actividad.value)) return mostrarError('El código de actividad económica tiene 6 números (o déjelo vacío).', actividad);
    const btn = m.el.querySelector('.modal-pie .primario');
    await conBoton(btn, async () => {
      const r = await api.clienteGuardar({
        id: c.id || undefined, solo_nuevo: esNuevo, sociedad_id: soc.id, tipo_id: tipo.value, identificacion: ident.value,
        nombre: nombre.value.trim(), nombre_comercial: comercial.value.trim(), correo: cr.lista.join(', '), telefono: tel,
        provincia: prov.value, canton: cant.value, distrito: dist.value, barrio: barrio.value.trim(), otras_senas: senas.value.trim(),
        actividad_codigo: actividad.value, notas: notas.value.trim(),
      });
      toast(esNuevo ? 'Cliente agregado.' : 'Cliente guardado.');
      cerrar();
      alGuardar?.(r);
    });
  }

  const cuerpo = h('div.mt-form',
    err,
    h('fieldset', h('legend', 'Quién es'),
      h('div.col',
        campo('Tipo de identificación', tipo),
        h('div.col', { style: 'gap:.3rem' },
          h('label.etq', 'Número de identificación', ident, ayudaId, contador),
          avisoDup,
          h('div.fila', btnHac),
          avisoHac),
        campo('Nombre o razón social', nombre, 'Como aparece en Hacienda. Se guarda en mayúsculas.'),
        campo('Nombre comercial (si tiene)', comercial))),
    h('fieldset', h('legend', 'Cómo contactarlo'),
      h('div.col',
        campo('Correo para enviar la factura', correo, 'Puede escribir varios correos separados por coma. La factura llega a estos correos.'),
        campo('Teléfono (opcional)', telefono))),
    h('fieldset', h('legend', 'Actividad económica'),
      h('div.col', campo('Código de actividad económica (opcional)', actividad, 'Son 6 números. Si la factura es para una empresa que declara el IVA, Hacienda lo usa.'), listaAct)),
    h('fieldset', h('legend', 'Dirección (opcional)'),
      h('div.col',
        h('div.rejilla', campo('Provincia', prov), campo('Cantón', cant), campo('Distrito', dist)),
        campo('Barrio', barrio),
        campo('Otras señas', senas, 'Por ejemplo: 200 metros norte de la iglesia, portón negro.'))),
    h('fieldset', h('legend', 'Notas internas'),
      campo('Notas (solo las ve usted, no salen en la factura)', notas)),
    !esNuevo && c.creado_en ? h('small.tenue', 'Cliente agregado el ' + new Intl.DateTimeFormat('es-CR', { timeZone: 'America/Costa_Rica', dateStyle: 'long' }).format(new Date(c.creado_en)) + '.') : null);

  const m = modal({
    titulo: titulo || (esNuevo ? 'Agregar cliente' : 'Cliente: ' + (c.nombre || '')), contenido: cuerpo, ancho: 760,
    botones: [{ texto: 'Cancelar', clase: 'suave', onclick: (x) => x() }, { texto: esNuevo ? 'Guardar cliente' : 'Guardar cambios', clase: 'primario', onclick: (x) => guardar(x) }],
  });
  refrescarId();
  if (esNuevo) ident.focus();
  return m;
}

export function selectorCliente(app, { alElegir, titulo = 'Elegir cliente' } = {}) {
  cargarCss();
  const soc = app.soc;
  const q = h('input.mt-buscar', { type: 'search', placeholder: 'Buscar por nombre, cédula, correo o teléfono', autocomplete: 'off', 'aria-label': 'Buscar cliente' });
  const lista = h('div.mt-lista', { style: 'margin-top:.8rem' });
  let m, n = 0;
  const elegir = (cl) => { m.cerrar(); alElegir?.(cl); };
  const cargar = async () => {
    const mi = ++n;
    try {
      const r = await api.clientes(soc.id, q.value.trim());
      if (mi !== n) return;
      lista.replaceChildren(...(r.length ? r.map((cl) => h('div.mt-item',
        h('div.mt-datos', h('span.mt-nombre', cl.nombre), h('span.mt-sub', (TIPOS_ID[cl.tipo_id] || '') + ' ' + cl.identificacion + (cl.correo ? ' · ' + cl.correo : ''))),
        h('div.mt-btns', h('button.btn.primario', { type: 'button', onclick: () => elegir(cl) }, 'Elegir')))) : [h('div.vacio', q.value ? 'No hay clientes con eso. Puede agregarlo con el botón de abajo.' : 'Todavía no hay clientes guardados.')]));
    } catch (e) { if (mi === n) lista.replaceChildren(h('div.error-caja', e.message)); }
  };
  q.addEventListener('input', debounce(cargar, 250));
  m = modal({
    titulo, ancho: 680,
    contenido: h('div', q, lista, h('div.fila', { style: 'margin-top:1rem' },
      h('button.btn', { type: 'button', onclick: () => abrirFormCliente(app, null, { alGuardar: (cl) => { m.cerrar(); alElegir?.(cl); } }) }, 'Agregar cliente nuevo'))),
    botones: [{ texto: 'Cerrar', clase: 'suave', onclick: (x) => x() }],
  });
  q.focus();
  cargar();
  return m;
}

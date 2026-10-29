// Funciones de datos de Clientes, Productos y Usuarios que no estaban en api.js (se agregan aquí para no editarlo).
import { sb, ErrorApi } from './api.js';

async function rpc(nombre, args = {}) {
  const { data, error } = await sb.rpc(nombre, args);
  if (error) {
    let m = error.message || 'Error desconocido';
    if (/JWT|expired|not authenticated/i.test(m)) m = 'Su sesión venció. Recargue la página e ingrese de nuevo.';
    throw new ErrorApi(m);
  }
  return data;
}

export const apiM = {
  // Catálogo CABYS: por código (empieza con) o por texto. Devuelve [{codigo, descripcion, impuesto (0.13), tarifa (13)}], máximo 30
  cabysBuscar: (q) => rpc('fx_cabys_buscar', { p_q: q }),
  // De una lista de códigos, devuelve solo los que existen en el catálogo
  cabysVerificar: (codigos) => rpc('fx_cabys_verificar', { p_codigos: codigos }),
  // Cambio de precios en lote (atómico y con registro): cambios = [{id, precio}] con precio FINAL (IVA incluido)
  preciosLote: (soc, cambios, motivo = null) => rpc('fx_precios_lote', { p_soc: soc, p_cambios: cambios, p_motivo: motivo }),
  // Historial de cambios de productos (más reciente primero). producto opcional
  productoHistorial: (soc, producto = null, limite = 200) => rpc('fx_producto_historial', { p_soc: soc, p_producto: producto, p_limite: limite }),
};

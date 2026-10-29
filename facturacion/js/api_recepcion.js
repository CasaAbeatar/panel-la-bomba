// Datos del módulo Recepción (no se edita api.js). Funciones SQL de solo lectura: public.fx_recibidas y public.fx_recibida (ver sql/06_recepcion.sql).
// Responder (aceptar, parcial, rechazar) y revisar el correo usan funciones de borde con la sesión del usuario.
import { sb, ErrorApi, funcion } from './api.js';

async function rpc(nombre, args) {
  const { data, error } = await sb.rpc(nombre, args);
  if (error) {
    let m = error.message || 'Error desconocido';
    if (/JWT|expired|not authenticated/i.test(m)) m = 'Su sesión venció. Recargue la página e ingrese de nuevo.';
    else if (/failed to fetch|networkerror|load failed|timeout|canceling statement/i.test(m)) m = 'El servidor tardó demasiado o no hay conexión. Espere un momento e intente de nuevo.';
    throw new ErrorApi(m);
  }
  return data;
}

// modo: 'todas' (por periodo) | 'pendientes' (sin respuesta y dentro del plazo de 8 días hábiles; ignora el periodo) | 'vencidas' (sin respuesta y plazo vencido, dentro del periodo)
// Devuelve {hoy, conteo:{llegaron_hoy,pendientes_en_plazo,vencen_pronto,vencen_hoy,iva_en_riesgo,vencidas_recientes,vencidas_antiguas}, resumen:{n,total,iva,neto,sin_responder}, otras_cedulas, truncado, filas[]}
export const recibidas = (soc, desde, hasta, q = '', modo = 'todas') => rpc('fx_recibidas', { p_soc: soc, p_desde: desde, p_hasta: hasta, p_q: q, p_modo: modo });
// Detalle por clave de 50 dígitos: {factura, local, lineas[], mensajes[], requiere, propia, receptor_estado, receptor_en, hacienda_estado, vence, dias_restantes, pendiente}
export const recibida = (clave) => rpc('fx_recibida', { p_id: clave });
// Solo el contador de pendientes (para un aviso en otra pantalla)
export const contarPendientes = async (soc) => (await recibidas(soc, null, null, '', 'pendientes')).conteo;

// Respuesta al proveedor. Función de borde "facturador-receptor" (la construye otro módulo): POST {factura_id, accion:'aceptar'|'parcial'|'rechazar', motivo} -> {ok, estado}
// factura_id es la clave de 50 dígitos (facturas_recibidas no tiene otro identificador).
export async function responder(clave, accion, motivo = '') {
  try {
    return await funcion('facturador-receptor', { factura_id: clave, clave, accion, motivo });
  } catch (e) {
    if (/404|not found|NOT_FOUND|Function not found/i.test(e.message)) throw new ErrorApi('La respuesta automática a Hacienda todavía no está activada en el sistema. La factura sigue sin responder.');
    throw e;
  }
}

// Revisa los buzones de contabilidad (Microsoft Graph) y guarda las facturas nuevas. La función de borde "facturas-recibidas" exige sesión válida (verify_jwt) y por omisión lee los últimos 3 días.
export const revisarCorreo = () => funcion('facturas-recibidas', {});

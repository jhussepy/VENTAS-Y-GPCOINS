// ============================================================================
//  Estado de la ventana de portabilidad de una venta
//  Mira las líneas porta NO activadas con fecha de ventana y devuelve la más
//  relevante (la más próxima/vencida) con su estado.
// ============================================================================

// Devuelve { fecha, estado } o null.
// estado: 'vencida' (ya pasó y sigue sin activar) | 'proxima' (<= 48h) | 'programada'
export function ventanaRelevante(lineasMoviles = [], ahora = new Date()) {
  const cand = (lineasMoviles || [])
    .filter((l) => l.tipo === 'porta' && l.ventanaPorta && !l.activa)
    .map((l) => ({ raw: l.ventanaPorta, fecha: new Date(l.ventanaPorta) }))
    .filter((x) => !Number.isNaN(x.fecha.getTime()))
    .sort((a, b) => a.fecha - b.fecha);
  if (!cand.length) return null;
  const c = cand[0];
  const diffH = (c.fecha - ahora) / 3600000;
  let estado;
  if (diffH < 0) estado = 'vencida';
  else if (diffH <= 48) estado = 'proxima';
  else estado = 'programada';
  return { fecha: c.raw, estado };
}

// Formatea "YYYY-MM-DDTHH:mm" como "dd/mm HH:mm" sin desfase de zona horaria
export function fmtVentana(raw) {
  if (!raw) return '';
  const [fecha, hora = ''] = String(raw).split('T');
  const [y, m, d] = fecha.split('-');
  if (!y || !m || !d) return raw;
  return `${d}/${m} ${hora.slice(0, 5)}`.trim();
}

export const TONO_VENTANA = { vencida: 'red', proxima: 'gold', programada: 'neutral' };
export const ETIQUETA_VENTANA = { vencida: 'Ventana vencida', proxima: 'Ventana próxima', programada: 'Ventana' };

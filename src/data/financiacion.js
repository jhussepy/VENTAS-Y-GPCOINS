// ============================================================================
//  Financiación de terminales (configurador tipo Vodafone)
//  Precio total fijo por terminal → cuota = precio / meses
// ============================================================================

// Opciones de seguro móvil. 'extra' = € que suma a la cuota mensual.
export const SEGUROS = [
  { id: 'desprotegido', label: 'Desprotegido', extra: 0 },
  { id: 'protegido', label: 'Protegido', extra: 6 },
  { id: 'protegido_plus', label: 'Protegido Plus', extra: 10 },
];

// Plazos de financiación disponibles (meses) — 24 primero
export const PLAZOS = [24, 36];

// Catálogos comerciales (informativo)
export const CATALOGOS_FIN = [
  'Paquete_convergente',
  'Convergente_36M',
  'Convergente_24M',
  'Libre',
];

// Tipos de oferta (informativo)
export const OFERTAS_FIN = ['GENERAL', 'EMPLEADO', 'PROMOCIÓN', 'RENOVACIÓN'];

// Cálculo de financiación
export function calcFinanciacion({ precio, meses, contado = false, seguroExtra = 0 }) {
  const p = Number(precio) || 0;
  const extra = Number(seguroExtra) || 0;
  if (contado) {
    return { pagoInicial: p, cuota: extra, total: p };
  }
  const cuota = meses > 0 ? p / meses : 0;
  return { pagoInicial: 0, cuota: cuota + extra, total: p };
}

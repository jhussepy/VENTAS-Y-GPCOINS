// Campañas comerciales versionadas. Los identificadores legacy de mes se
// conservan mientras existan ventas guardadas como "junio"/"julio".
export const CAMPANAS = {
  'vodafone-captacion-2026-06-09': {
    id: 'vodafone-captacion-2026-06-09',
    nombre: 'Captación junio-septiembre 2026',
    inicio: '2026-06-01',
    fin: '2026-09-30',
    meses: [
      { id: 'junio', iso: '2026-06', etiqueta: 'JUNIO' },
      { id: 'julio', iso: '2026-07', etiqueta: 'JULIO' },
      // Vodafone mantiene en agosto/septiembre las condiciones vigentes en julio.
      { id: 'agosto', iso: '2026-08', etiqueta: 'AGOSTO', heredaDe: 'julio' },
      { id: 'septiembre', iso: '2026-09', etiqueta: 'SEPTIEMBRE', heredaDe: 'julio' },
    ],
  },
};

export const CAMPANA_ACTIVA_ID = 'vodafone-captacion-2026-06-09';
export const CAMPANA_ACTIVA = CAMPANAS[CAMPANA_ACTIVA_ID];

const isoMesDesdeFecha = (fecha) => {
  if (!fecha) return '';
  if (fecha instanceof Date && Number.isNaN(fecha.getTime())) return '';
  const iso = fecha instanceof Date ? fecha.toISOString().slice(0, 7) : String(fecha).slice(0, 7);
  return /^\d{4}-\d{2}$/.test(iso) ? iso : '';
};

// Convierte fechas de la campaña a sus IDs históricos. Fuera de ella devuelve
// YYYY-MM para no atribuir fechas de otras campañas a la campaña activa.
export function mesCampanaDesdeFecha(fecha, campana = CAMPANA_ACTIVA) {
  const iso = isoMesDesdeFecha(fecha);
  if (!iso) return campana.meses[0]?.id || '';
  return campana.meses.find((mes) => mes.iso === iso)?.id || iso;
}

// Mes que debe mostrar una campaña cerrada: el correspondiente a hoy si está
// incluido y, fuera del período, el extremo más cercano de esa campaña.
export function mesActivoCampanaDesdeFecha(fecha, campana = CAMPANA_ACTIVA) {
  const iso = isoMesDesdeFecha(fecha);
  const primero = campana.meses[0];
  const ultimo = campana.meses.at(-1);
  if (!iso || !primero || !ultimo) return primero?.id || '';
  const incluido = campana.meses.find((mes) => mes.iso === iso);
  if (incluido) return incluido.id;
  return iso < primero.iso ? primero.id : ultimo.id;
}

export function periodoDesdeCampana(campana = CAMPANA_ACTIVA) {
  return {
    id: campana.id,
    nombre: campana.nombre,
    inicio: campana.inicio,
    fin: campana.fin,
    meses: campana.meses.map((mes) => mes.id),
    etiquetas: Object.fromEntries(campana.meses.map((mes) => [mes.id, mes.etiqueta])),
  };
}

export const configuracionMesCampana = (mes, campana = CAMPANA_ACTIVA) => (
  campana.meses.find((item) => item.id === mes)
);

export const mesBaseCampana = (mes, campana = CAMPANA_ACTIVA) => (
  configuracionMesCampana(mes, campana)?.heredaDe || mes
);

export const isoMesCampana = (mes, campana = CAMPANA_ACTIVA) => (
  configuracionMesCampana(mes, campana)?.iso || ''
);

export const mesAnteriorCampana = (mes, campana = CAMPANA_ACTIVA) => {
  const indice = campana.meses.findIndex((item) => item.id === mes);
  if (indice > 0) return campana.meses[indice - 1].id;
  return campana.meses[1]?.id || mes;
};

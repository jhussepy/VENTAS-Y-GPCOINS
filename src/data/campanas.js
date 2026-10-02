// Campañas comerciales versionadas. Los identificadores legacy de mes se
// conservan mientras existan ventas guardadas como "junio"/"julio".
export const CAMPANAS = {
  'vodafone-captacion-2026-06-09': {
    id: 'vodafone-captacion-2026-06-09',
    nombre: 'Captación junio-octubre 2026',
    inicio: '2026-06-01',
    fin: '2026-10-31',
    meses: [
      { id: 'junio', iso: '2026-06', etiqueta: 'JUNIO' },
      { id: 'julio', iso: '2026-07', etiqueta: 'JULIO' },
      // Agosto y septiembre mantienen las condiciones vigentes en julio.
      { id: 'agosto', iso: '2026-08', etiqueta: 'AGOSTO', heredaDe: 'julio' },
      { id: 'septiembre', iso: '2026-09', etiqueta: 'SEPTIEMBRE', heredaDe: 'julio' },
      // Octubre replica exactamente septiembre. La herencia se resuelve de forma
      // transitiva: octubre → septiembre → julio (base efectiva de las tablas).
      { id: 'octubre', iso: '2026-10', etiqueta: 'OCTUBRE', heredaDe: 'septiembre' },
    ],
  },
};

export const CAMPANA_ACTIVA_ID = 'vodafone-captacion-2026-06-09';
export const CAMPANA_ACTIVA = CAMPANAS[CAMPANA_ACTIVA_ID];

const isoMesDesdeFecha = (fecha) => {
  if (!fecha) return '';
  if (fecha instanceof Date) {
    if (Number.isNaN(fecha.getTime())) return '';
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
  }
  const iso = String(fecha).slice(0, 7);
  return /^\d{4}-\d{2}$/.test(iso) ? iso : '';
};

const isoDiaDesdeFecha = (fecha) => {
  if (!fecha) return '';
  if (fecha instanceof Date) {
    if (Number.isNaN(fecha.getTime())) return '';
    return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
  }
  const iso = String(fecha).slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(iso) ? iso : '';
};

const NOMBRES_MESES = ['ENERO', 'FEBRERO', 'MARZO', 'ABRIL', 'MAYO', 'JUNIO', 'JULIO', 'AGOSTO', 'SEPTIEMBRE', 'OCTUBRE', 'NOVIEMBRE', 'DICIEMBRE'];

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
  campana.meses.find((item) => item.id === mes || item.iso === mes)
);

export const normalizarMesCampana = (mes, campana = CAMPANA_ACTIVA) => (
  configuracionMesCampana(mes, campana)?.id || mes
);

// Resuelve herencias encadenadas. Ej.: octubre → septiembre → julio.
export function mesBaseCampana(mes, campana = CAMPANA_ACTIVA) {
  let actual = normalizarMesCampana(mes, campana);
  const visitados = new Set();
  while (actual && !visitados.has(actual)) {
    visitados.add(actual);
    const siguiente = configuracionMesCampana(actual, campana)?.heredaDe;
    if (!siguiente) return actual;
    actual = normalizarMesCampana(siguiente, campana);
  }
  return actual || mes;
}

export const isoMesCampana = (mes, campana = CAMPANA_ACTIVA) => (
  configuracionMesCampana(mes, campana)?.iso || ''
);

export const mesAnteriorCampana = (mes, campana = CAMPANA_ACTIVA) => {
  const indice = campana.meses.findIndex((item) => item.id === mes);
  if (indice > 0) return campana.meses[indice - 1].id;
  return campana.meses[1]?.id || mes;
};


export function estadoCampanaEnFecha(fecha, campana = CAMPANA_ACTIVA) {
  const dia = isoDiaDesdeFecha(fecha);
  if (!dia) return 'sin-fecha';
  if (dia < campana.inicio) return 'por-iniciar';
  if (dia > campana.fin) return 'finalizada';
  return 'activa';
}

export const mesConfiguradoCampana = (mes, campana = CAMPANA_ACTIVA) => (
  campana.meses.some((item) => item.id === mes || item.iso === mes)
);

export function etiquetaMesCampana(mes, campana = CAMPANA_ACTIVA) {
  const configurado = campana.meses.find((item) => item.id === mes || item.iso === mes);
  if (configurado) return configurado.etiqueta;
  const match = /^(\d{4})-(\d{2})$/.exec(String(mes || ''));
  if (!match) return String(mes || '—').toUpperCase();
  const indice = Number(match[2]) - 1;
  return `${NOMBRES_MESES[indice] || match[2]} ${match[1]}`;
}

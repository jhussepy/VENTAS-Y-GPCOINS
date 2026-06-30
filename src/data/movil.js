// ============================================================================
//  Datos de líneas móviles: tarifas y operadores de origen (para portas)
// ============================================================================

// Tarifas móviles disponibles. til65=true marca la tarifa como línea ILIMITADA (TIL65).
export const TARIFAS_MOVIL = [
  { id: 'basica', label: 'Básica 2€', til65: false },
  { id: 'ilim60', label: 'Ilimitada 60GB', til65: false },
  { id: 'ilim160', label: 'Ilimitada 160GB', til65: false },
  { id: 'ilimtotal', label: 'Ilimitada Total (TIL65)', til65: true },
];

export const esTil65 = (tarifaId) => TARIFAS_MOVIL.find((t) => t.id === tarifaId)?.til65 || false;

// Operadores de origen para portabilidades
export const OPERADORES_PORTA = [
  'Movistar', 'O2', 'Vodafone', 'Lowi', 'Orange', 'Jazztel', 'Simyo', 'Yoigo',
  'MásMóvil', 'Pepephone', 'DIGI', 'Finetwork', 'SUOP', 'Parlem', 'Euskaltel',
  'R', 'Telecable', 'Virgin Telco', 'Guuk', 'Embou', 'Netllar', 'Hits Mobile',
  'Lyca Mobile', 'Lebara', 'Llamaya', 'Lobster', 'You Mobile', 'PTV Telecom',
  'Xenet', 'Ion Mobile', 'Aló', 'Lemonvil', 'Dragonet', 'Sarenet', 'Sewan',
  'Telsome', 'New Era', 'Alai', 'Yuptel', 'Legos', 'Jetnet', 'Fibritel',
  'Neotel', 'OnMóvil', 'OpenCable', 'Quattre', 'Citelia', 'Cube Móvil',
  'Siptize', 'Silbo', 'Grupalia Internet', 'Norvoz', 'MasIP', '7Play',
  'Avatel Móvil', 'Aire Networks', 'GMM', 'Truphone', 'Zinnia', 'Wewi',
  'Telyra', 'Evolutio', 'Populoos', 'Blaveo', 'RACCTEL+', 'Lidl Connect',
  'Barça Mobile', 'Española de Telefonía', 'Hocico Phone', 'People Phone',
  'CableMóvil',
];

// Resumen de contadores derivados de una lista de líneas móviles
export function resumenLineas(lm = []) {
  return {
    lineasVoz: lm.length,
    portasVoz: lm.filter((l) => l.tipo === 'porta').length,
    portasActivas: lm.filter((l) => l.tipo === 'porta' && l.activa).length,
    til65: lm.filter((l) => esTil65(l.tarifa)).length,
  };
}

// Crea una línea móvil vacía
export const lineaMovilVacia = () => ({
  tarifa: '',          // id de TARIFAS_MOVIL
  numero: '',          // número de teléfono
  tipo: 'nueva',       // 'nueva' | 'porta'
  operador: '',        // operador de origen (solo si porta)
  activa: false,       // porta ya activada (solo si porta)
});

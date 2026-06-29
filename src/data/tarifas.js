// ============================================================================
//  TARIFAS VODAFONE
//  A) Oferta Exclusivo 30% - Origen Contrato
//  B) Promo Flash 1 OTT
// ============================================================================

// Columnas de OTT (en orden de la tabla original)
export const OTT_COLS = [
  { key: 'sinTV',   label: 'Sin TV',        grupo: 'Promo 30%' },
  { key: 'prime',   label: 'Prime',         grupo: '1 OTT' },
  { key: 'netflix', label: 'Netflix',       grupo: '1 OTT' },
  { key: 'disney',  label: 'Disney+',       grupo: '1 OTT' },
  { key: 'disneyA', label: 'Disney+ C/Anunc.', grupo: '1 OTT' },
  { key: 'max',     label: 'Max',           grupo: '1 OTT' },
  { key: 'np',      label: 'N&P',           grupo: '2 OTT' },
  { key: 'nmx',     label: 'N&Mx',          grupo: '2 OTT' },
  { key: 'ndA',     label: 'N&D+ C/Anunc.', grupo: '2 OTT' },
  { key: 'nd',      label: 'N&D+',          grupo: '2 OTT' },
  { key: 'nmxp',    label: 'N&Mx&P',        grupo: '3 OTT' },
  { key: 'ndp',     label: 'N&D+&P',        grupo: '3 OTT' },
  { key: 'ndmx',    label: 'N&D+&Mx',       grupo: '3 OTT' },
  { key: 'nmxdp',   label: 'N&Mx&D+&P',     grupo: '4 OTT' },
];

// Cada fila: fibra, lineas (mono/multi), movil, promo (X3 meses?), precios[14]
const F = (fibra, lineas, movil, promo, p) => ({
  fibra, lineas, movil, promo,
  precios: Object.fromEntries(OTT_COLS.map((c, i) => [c.key, p[i]])),
});

export const TARIFAS_EXCLUSIVO = [
  // MULTILÍNEA - Fibra 600 / Internet Portátil
  F('Fibra 600 / Internet Portátil', 'Multilínea', '2× 60GB',      false, [36.10,43.09,45.09,48.10,43.10,47.10,52.08,56.09,52.09,57.09,60.09,61.09,65.09,68.09]),
  F('Fibra 600 / Internet Portátil', 'Multilínea', '2× 160GB',     false, [39.60,46.59,48.59,51.60,46.60,50.60,55.58,59.59,55.59,60.59,63.59,64.59,68.59,71.59]),
  F('Fibra 600 / Internet Portátil', 'Multilínea', '2× Ilimitada', false, [43.10,50.09,52.09,55.10,50.09,55.10,59.08,63.09,59.09,64.09,67.09,68.09,72.09,75.09]),
  // MULTILÍNEA - Fibra 1Gbps (T&P)
  F('Fibra 1Gbps (T&P)', 'Multilínea', '2× 60GB',      true,  [36.10,43.09,45.09,48.10,43.10,47.10,52.08,56.09,52.09,57.09,60.09,61.09,65.09,68.09]),
  F('Fibra 1Gbps (T&P)', 'Multilínea', '2× 60GB',      false, [43.10,50.09,52.09,55.10,50.10,54.10,59.08,63.09,59.09,64.09,67.09,68.09,72.09,75.09]),
  F('Fibra 1Gbps (T&P)', 'Multilínea', '2× 160GB',     true,  [39.60,46.59,48.59,51.60,46.60,50.60,55.58,59.59,55.59,60.59,63.59,64.59,68.59,71.59]),
  F('Fibra 1Gbps (T&P)', 'Multilínea', '2× 160GB',     false, [46.60,53.59,55.59,58.60,52.60,57.60,62.58,66.60,62.60,67.60,70.60,71.60,75.60,78.60]),
  F('Fibra 1Gbps (T&P)', 'Multilínea', '2× Ilimitada', true,  [43.10,50.09,52.09,55.10,50.10,55.10,59.08,63.09,59.09,64.09,67.09,68.09,72.09,75.09]),
  F('Fibra 1Gbps (T&P)', 'Multilínea', '2× Ilimitada', false, [50.10,57.09,59.09,62.10,57.10,61.10,66.08,70.09,66.09,71.09,74.09,75.09,79.09,82.09]),
  // MONOLÍNEA - Fibra 600 / Internet Portátil
  F('Fibra 600 / Internet Portátil', 'Monolínea', '60GB',      false, [30.10,37.09,39.09,42.10,37.10,41.10,46.08,50.09,46.09,51.09,54.09,55.09,59.09,62.09]),
  F('Fibra 600 / Internet Portátil', 'Monolínea', '160GB',     false, [33.60,40.59,42.59,45.60,40.60,44.60,49.58,53.59,49.59,54.59,57.59,58.59,62.59,65.59]),
  F('Fibra 600 / Internet Portátil', 'Monolínea', 'Ilimitada', false, [37.10,44.09,46.09,49.10,44.10,49.10,53.08,57.09,53.09,58.09,61.09,62.09,66.09,69.09]),
  // MONOLÍNEA - Fibra 1Gbps (T&P)
  F('Fibra 1Gbps (T&P)', 'Monolínea', '1× 60GB',      true,  [30.10,37.09,39.09,42.10,37.10,41.10,46.08,50.09,46.09,51.09,54.09,55.09,59.09,62.09]),
  F('Fibra 1Gbps (T&P)', 'Monolínea', '1× 60GB',      false, [37.10,44.09,46.09,49.10,44.10,48.10,53.08,57.09,53.09,58.09,61.09,62.09,66.09,69.09]),
  F('Fibra 1Gbps (T&P)', 'Monolínea', '1× 160GB',     true,  [33.60,40.59,42.59,45.60,40.60,44.60,49.58,53.59,49.59,54.59,57.59,58.59,62.59,65.59]),
  F('Fibra 1Gbps (T&P)', 'Monolínea', '1× 160GB',     false, [40.60,47.59,49.59,52.60,47.60,51.60,56.58,60.60,56.60,61.60,64.60,65.60,69.60,72.60]),
  F('Fibra 1Gbps (T&P)', 'Monolínea', '1× Ilimitada', true,  [37.10,44.09,46.09,49.10,44.10,49.10,53.08,57.09,53.09,58.09,61.09,62.09,66.09,69.09]),
  F('Fibra 1Gbps (T&P)', 'Monolínea', '1× Ilimitada', false, [44.10,51.09,53.09,56.10,51.10,55.10,60.08,64.09,60.09,65.09,68.09,69.09,73.09,76.09]),
];

// ---------------------------------------------------------------------------
//  Promo Flash 1 OTT  (Deco 4K + 100 canales, elige 1 OTT)
// ---------------------------------------------------------------------------
export const PROMO_FLASH = [
  {
    paquete: 'Fibra 600MB / Internet Portátil + Móvil X2 160GB',
    detalle: '600MB Fibra · 2 líneas móviles 160GB (después ilimitado 2Mbps) · Deco 4K +100 canales · OTT con anuncios',
    promo: false,
    precios: { prime: 49, netflix: 51, hbomax: 53, disney: 54 },
  },
  {
    paquete: 'Fibra 600MB / Internet Portátil + Móvil X2 Ilimitados',
    detalle: '600MB Fibra · 2 líneas móviles ilimitadas · Deco 4K +100 canales · OTT con anuncios',
    promo: false,
    precios: { prime: 54, netflix: 56, hbomax: 58, disney: 59 },
  },
  {
    paquete: 'Fibra 1GB + Móvil X2 160GB',
    detalle: '1GB Fibra · 2 líneas móviles 160GB (después ilimitado 2Mbps) · Deco 4K +100 canales · OTT con anuncios',
    promo: true,
    precios: { prime: 49, netflix: 51, hbomax: 53, disney: 54 },           // X3 meses
    preciosNormal: { prime: 59, netflix: 61, hbomax: 63, disney: 64 },     // después
  },
  {
    paquete: 'Fibra 1GB + Móvil X2 Ilimitados',
    detalle: '1GB Fibra · 2 líneas móviles ilimitadas · Deco 4K +100 canales · OTT con anuncios',
    promo: true,
    precios: { prime: 54, netflix: 56, hbomax: 58, disney: 59 },           // X3 meses
    preciosNormal: { prime: 64, netflix: 66, hbomax: 68, disney: 69 },     // después
  },
];

export const FLASH_OTT = [
  { key: 'prime', label: 'Prime' },
  { key: 'netflix', label: 'Netflix' },
  { key: 'hbomax', label: 'HBO Max' },
  { key: 'disney', label: 'Disney+' },
];

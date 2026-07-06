// ============================================================================
//  CALCULADORA DE COMISIÓN — solo Vodafone (moneda: Sol peruano S/)
//  Mecánica de "vallas" retroactiva: según cuántas unidades vendes de cada
//  categoría (FIJO y MÓVIL, por separado) alcanzas una valla, y esa valla fija
//  el precio por unidad de TODAS las unidades de esa categoría. Si no llegas a
//  la 1ª valla, esa categoría no paga comisión (0).
// ============================================================================

export const MONEDA = 'S/';
export const fmtSol = (n) => `S/ ${(Number(n) || 0).toLocaleString('es-PE', { maximumFractionDigits: 2 })}`;

// Subtipos por categoría (Bajo / Medio / Alto valor)
export const SUBTIPOS = {
  fijo: [
    { id: 'BV', label: 'Bajo valor' },
    { id: 'MV', label: 'Medio valor' },
    { id: 'AV', label: 'Alto valor' },
  ],
  movil: [
    { id: 'BA', label: 'Bajo valor' },
    { id: 'MV', label: 'Medio valor' },
    { id: 'AV', label: 'Alto valor' },
  ],
};

// Precio por unidad (S/) según la valla alcanzada (índice 0=1ª … 3=4ª) y subtipo
export const TARIFA_COMISION = {
  fijo: {
    BV: [25, 31, 36, 43],
    MV: [35, 50, 63, 72],
    AV: [43, 69, 89, 102],
  },
  movil: {
    BA: [16, 24, 34, 44],
    MV: [21, 31, 48, 68],
    AV: [26, 38, 57, 85],
  },
};

// Unidades necesarias para alcanzar cada valla (1ª, 2ª, 3ª, 4ª)
export const UMBRALES_VALLA = {
  fijo: [6, 11, 16, 23],
  movil: [13, 24, 34, 42],
};

import { mesDesdeFecha } from './engine.js';

export const ETIQUETA_CATEGORIA = { fijo: 'Fijo', movil: 'Móvil' };

// --- Clasificación de una venta Vodafone en subtipos de comisión ------------
// Fibra por velocidad; línea móvil por tarifa (ver data/movil.js).
export const FIJO_POR_VELOCIDAD = {
  'Fibra 300 MB': 'BV',
  'Fibra 600 MB': 'MV',
  'Fibra 1 GB': 'AV',
};
export const MOVIL_POR_TARIFA = {
  basica: 'BA',        // Básica 2€
  ilim60: 'MV',        // Ilimitada 60GB
  ilim160: 'AV',       // Ilimitada 160GB
  ilimtotal: 'AV',     // Ilimitada Total (TIL65)
};

// Cuenta las unidades por subtipo desde las ventas Vodafone del mes.
// `estadoActivo(v)` decide si la venta (fibra) cuenta.
//
// IMPORTANTE — meses:
//  · La FIBRA cuenta en el mes propio de la venta (v.mes).
//  · La LÍNEA MÓVIL porta cuenta en el mes en que ACTIVA su portabilidad
//    (mes de la ventana), no en el de la venta: una porta vendida en junio que
//    activa en julio suma a la comisión de julio. Solo cuentan las portas ya
//    activadas (l.activa) y se excluyen las canceladas por el cliente (M1).
//  · La LÍNEA MÓVIL nueva cuenta en el mes de la venta si está activa.
//
// Devuelve { fijo: {BV,MV,AV}, movil: {BA,MV,AV} }.
export function contarDesdeVentas(ventas = [], mes, estadoActivo = () => true) {
  const fijo = { BV: 0, MV: 0, AV: 0 };
  const movil = { BA: 0, MV: 0, AV: 0 };
  for (const v of ventas) {
    // Fibra: mes propio de la venta y activa
    if (v.mes === mes && estadoActivo(v) && v.convergencia && v.velocidad) {
      const b = FIJO_POR_VELOCIDAD[v.velocidad];
      if (b) fijo[b] += 1;
    }
    // Líneas móviles
    for (const l of v.lineasMoviles || []) {
      const b = MOVIL_POR_TARIFA[l.tarifa];
      if (!b) continue;
      if (l.tipo === 'porta') {
        if (l.incidenciaPorta === 'cancelada_m1' || !l.activa) continue;
        const mLinea = l.ventanaPorta ? mesDesdeFecha(l.ventanaPorta) : v.mes;
        if (mLinea === mes) movil[b] += 1;
      } else if (v.mes === mes && estadoActivo(v)) {
        movil[b] += 1; // línea nueva: activa con la venta, en su mes
      }
    }
  }
  return { fijo, movil };
}

// Índice de la valla alcanzada con `total` unidades (0..3), o -1 si no llega a
// la 1ª valla.
export function vallaAlcanzada(total, umbrales) {
  let idx = -1;
  for (let i = 0; i < umbrales.length; i += 1) {
    if ((Number(total) || 0) >= umbrales[i]) idx = i;
  }
  return idx;
}

// Unidades que faltan para la siguiente valla (o null si ya está en la última)
export function faltanParaSiguiente(total, umbrales) {
  const t = Number(total) || 0;
  for (let i = 0; i < umbrales.length; i += 1) {
    if (t < umbrales[i]) return { valla: i, faltan: umbrales[i] - t };
  }
  return null; // ya en la 4ª (máxima)
}

// Comisión de una categoría ('fijo' | 'movil') dado el recuento por subtipo.
// Devuelve { total, valla, importe, detalle: { [sub]: { n, precio, importe } } }.
export function comisionCategoria(cat, counts = {}) {
  const subtipos = SUBTIPOS[cat].map((s) => s.id);
  const total = subtipos.reduce((a, s) => a + (Number(counts[s]) || 0), 0);
  const valla = vallaAlcanzada(total, UMBRALES_VALLA[cat]);
  const detalle = {};
  let importe = 0;
  for (const s of subtipos) {
    const n = Number(counts[s]) || 0;
    const precio = valla >= 0 ? (TARIFA_COMISION[cat][s]?.[valla] || 0) : 0;
    const sub = n * precio;
    detalle[s] = { n, precio, importe: sub };
    importe += sub;
  }
  return { total, valla, importe, detalle };
}

// Comisión total = fijo + móvil
export function comisionTotal(fijo = {}, movil = {}) {
  const rFijo = comisionCategoria('fijo', fijo);
  const rMovil = comisionCategoria('movil', movil);
  return { fijo: rFijo, movil: rMovil, importe: rFijo.importe + rMovil.importe };
}

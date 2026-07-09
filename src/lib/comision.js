// ============================================================================
//  CALCULADORA DE COMISIÓN — solo Vodafone (moneda: Sol peruano S/)
//  Mecánica de "vallas" retroactiva con RAPPEL de clientes: cada categoría
//  (FIJO, MÓVIL y CLIENTES) alcanza su propia valla según sus unidades. Pero
//  el precio que se PAGA en Fijo y Móvil es el de la valla más BAJA entre las
//  tres (hay que llegar a todas para cobrar según la valla más alta). Si
//  cualquiera de las tres no llega ni a la 1ª valla, no se paga comisión.
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
    BV: [30, 34, 38, 43],
    MV: [41, 55, 66, 72],
    AV: [51, 77, 94, 102],
  },
  movil: {
    BA: [19, 27, 36, 44],
    MV: [25, 34, 51, 68],
    AV: [31, 43, 60, 85],
  },
};

// Unidades necesarias para alcanzar cada valla (1ª, 2ª, 3ª, 4ª)
export const UMBRALES_VALLA = {
  fijo: [6, 11, 16, 23],
  movil: [13, 24, 34, 42],
};

// Umbrales de clientes nuevos por valla (referencia informativa; el objetivo
// de "clientes nuevos" en sí se sigue en Llaves/Incentivos, no aquí)
export const UMBRALES_CLIENTES = [7, 11, 16, 22];

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
// Devuelve { fijo: {BV,MV,AV}, movil: {BA,MV,AV}, clientes, sinClasificar }.
// `clientes` = ventas activas del mes marcadas como "cliente nuevo" (mismo
// criterio que la llave de clientes nuevos en Llaves/Incentivos).
// `sinClasificar` = líneas móviles activas del mes que NO se pudieron clasificar
// por valor (sin tarifa registrada, o ventas con contadores manuales sin
// detalle de líneas): se cuentan aparte para avisar y que se añadan a mano.
export function contarDesdeVentas(ventas = [], mes, estadoActivo = () => true) {
  const fijo = { BV: 0, MV: 0, AV: 0 };
  const movil = { BA: 0, MV: 0, AV: 0 };
  let clientes = 0;
  let sinClasificar = 0;
  for (const v of ventas) {
    // Fibra: mes propio de la venta y activa
    if (v.mes === mes && estadoActivo(v) && v.convergencia && v.velocidad) {
      const b = FIJO_POR_VELOCIDAD[v.velocidad];
      if (b) fijo[b] += 1;
    }
    if (v.mes === mes && estadoActivo(v) && v.clienteNuevo) clientes += 1;
    // Líneas móviles
    const lm = v.lineasMoviles || [];
    if (lm.length > 0) {
      for (const l of lm) {
        // ¿La línea activa en el mes indicado?
        let enMes = false;
        if (l.tipo === 'porta') {
          if (l.incidenciaPorta === 'cancelada_m1' || !l.activa) continue;
          const mLinea = l.ventanaPorta ? mesDesdeFecha(l.ventanaPorta) : v.mes;
          enMes = mLinea === mes;
        } else {
          enMes = v.mes === mes && estadoActivo(v); // nueva: activa con la venta
        }
        if (!enMes) continue;
        const b = MOVIL_POR_TARIFA[l.tarifa];
        if (b) movil[b] += 1;
        else sinClasificar += 1; // línea activa pero sin tarifa reconocible
      }
    } else if (v.mes === mes && estadoActivo(v)) {
      // Sin detalle de líneas: contadores manuales (activas pero sin tarifa)
      const portasAct = Math.min(Number(v.portasActivas) || 0, Number(v.portasVoz) || 0);
      const nuevas = Math.max(0, (Number(v.lineasVoz) || 0) - (Number(v.portasVoz) || 0));
      sinClasificar += portasAct + nuevas;
    }
  }
  return { fijo, movil, clientes, sinClasificar };
}

// Prorratea los umbrales de valla por un factor (días trabajados / días del
// mes). Ej. factor 0.5 → la 1ª valla de 6 pasa a 3. Mínimo 1 unidad por valla.
export function prorratearUmbrales(umbrales, factor) {
  const f = Math.max(0, Math.min(1, Number(factor) || 0));
  return umbrales.map((u) => Math.max(1, Math.round(u * f)));
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

// Total de unidades de una categoría ('fijo' | 'movil') dado el recuento por subtipo.
export function totalCategoria(cat, counts = {}) {
  return SUBTIPOS[cat].reduce((a, s) => a + (Number(counts[s.id]) || 0), 0);
}

// Comisión de una categoría ('fijo' | 'movil') dado el recuento por subtipo,
// pagando al precio de `vallaPago` (la valla EFECTIVA tras aplicar el rappel
// de clientes, no necesariamente la propia de esta categoría).
// Devuelve { total, valla, importe, detalle: { [sub]: { n, precio, importe } } }.
export function comisionCategoria(cat, counts = {}, vallaPago) {
  const subtipos = SUBTIPOS[cat].map((s) => s.id);
  const total = subtipos.reduce((a, s) => a + (Number(counts[s]) || 0), 0);
  const detalle = {};
  let importe = 0;
  for (const s of subtipos) {
    const n = Number(counts[s]) || 0;
    const precio = vallaPago >= 0 ? (TARIFA_COMISION[cat][s]?.[vallaPago] || 0) : 0;
    const sub = n * precio;
    detalle[s] = { n, precio, importe: sub };
    importe += sub;
  }
  return { total, valla: vallaPago, importe, detalle };
}

// Comisión total = fijo + móvil, con RAPPEL de clientes como gate.
// `umbrales` = { fijo:[...], movil:[...], clientes:[...] } (permite cuotas
// prorrateadas por días trabajados).
//
// Mecánica: cada categoría (fijo, móvil, clientes) alcanza su PROPIA valla
// según sus propias unidades. Pero el precio que se paga en fijo y móvil es
// el de la valla más BAJA de las tres (hay que llegar a las tres para cobrar
// la valla más alta). Si alguna no llega ni a la 1ª, no se paga comisión.
export function comisionTotal(fijo = {}, movil = {}, clientes = 0, umbrales = { ...UMBRALES_VALLA, clientes: UMBRALES_CLIENTES }) {
  const vFijo = vallaAlcanzada(totalCategoria('fijo', fijo), umbrales.fijo);
  const vMovil = vallaAlcanzada(totalCategoria('movil', movil), umbrales.movil);
  const vClientes = vallaAlcanzada(Number(clientes) || 0, umbrales.clientes);
  const vallaPago = Math.min(vFijo, vMovil, vClientes);

  const rFijo = comisionCategoria('fijo', fijo, vallaPago);
  const rMovil = comisionCategoria('movil', movil, vallaPago);
  return {
    fijo: { ...rFijo, propia: vFijo },
    movil: { ...rMovil, propia: vMovil },
    clientes: { total: Number(clientes) || 0, valla: vClientes },
    vallaPago,
    importe: rFijo.importe + rMovil.importe,
  };
}

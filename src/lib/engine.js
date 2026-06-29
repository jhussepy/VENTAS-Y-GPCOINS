// ============================================================================
//  MOTOR DE CÁLCULO — GP Coins, puntos de ranking y progreso de llaves
// ============================================================================
import {
  CATALOGO, INCENTIVOS, ORDEN_INCENTIVOS, PUNTOS_CONVERGENCIA, PERIODO,
  ptsDe, gpDe, convPts,
} from '../data/incentivos.js';
import { estadoDe } from './estados.js';

// Estructura de una venta (campos opcionales, todos los contadores por defecto 0)
export const ventaVacia = () => ({
  id: crypto.randomUUID(),
  nombre: '',
  apellido: '',
  dni: '',                 // DNI / NIE del cliente
  telefono: '',            // teléfono de contacto
  email: '',               // email del cliente
  direccion: '',           // dirección de instalación
  pedido: '',              // nº de pedido / contrato
  fechaVenta: '',
  fechaInstalacion: '',
  mes: 'junio',            // junio | julio (se autodetecta de la fecha)
  // Fibra / convergencia
  convergencia: '',        // '' | '3P' | '4P'
  velocidad: '',           // '' | 'Fibra 300 MB' | 'Fibra 600 MB' | 'Fibra 1 GB'
  clienteNuevo: false,     // cuenta para llave "clientes nuevos"
  fibraActiva: false,      // cuenta para llave Fibra (neba o fibra)
  // Terminal / dispositivo
  marca: '',               // '' | 'xiaomi' | 'samsung' | 'honor' | 'motorola' | 'jbl'
  sap: '',                 // código SAP del dispositivo
  cantidad: 1,             // unidades del dispositivo
  // Contadores de llaves
  portasVoz: 0,            // portas de voz solicitadas (total)
  portasActivas: 0,        // portas que ya se han activado (≤ portasVoz)
  lineasVoz: 0,            // total líneas de voz (denominador del %)
  til65: 0,                // líneas TIL65
  secureNet: 0,            // activaciones Secure Net
  // Estado de la venta (pendiente | activa | baja | cancelada)
  estado: 'pendiente',
  instalacionActiva: false, // se mantiene sincronizado: true solo si estado === 'activa'
  fechaBaja: '',            // fecha de baja (si estado = baja/cancelada)
  motivoBaja: '',           // motivo de baja
  notas: '',
});

export const mesDesdeFecha = (fecha) => {
  if (!fecha) return 'junio';
  const m = new Date(fecha).getMonth(); // 0=ene, 5=junio, 6=julio
  if (m === 5) return 'junio';
  if (m === 6) return 'julio';
  return 'junio'; // fallback: siempre devolvemos 'junio' o 'julio', nunca null
};

// --- ¿La fecha cae dentro del período válido del incentivo? -------------------
export const dentroDePeriodo = (fecha) => {
  if (!fecha) return false;
  // Normalizamos a YYYY-MM-DD para comparar como cadenas ISO (orden lexicográfico)
  const f = fecha instanceof Date
    ? fecha.toISOString().slice(0, 10)
    : String(fecha).slice(0, 10);
  return f >= PERIODO.inicio && f <= PERIODO.fin;
};

const buscarProducto = (marca, sap) => {
  const cat = CATALOGO[marca];
  if (!cat) return null;
  return cat.productos.find((p) => p.sap === sap) || null;
};

// --- Cálculo de puntos de ranking del incentivo Cliente Nuevo (fibra) -------
export function puntosClienteNuevo(ventas, mes) {
  let total = 0;
  for (const v of ventas) {
    if (v.mes !== mes) continue;
    if (!v.convergencia || !v.velocidad) continue;
    const row = PUNTOS_CONVERGENCIA.find(
      (r) => r.tipo === v.convergencia && r.velocidad === v.velocidad
    );
    if (row) total += convPts(row, mes);
  }
  return total;
}

// --- Puntos de ranking por dispositivos (Xiaomi, Motorola) ------------------
export function puntosDispositivos(ventas, marca, mes) {
  let total = 0;
  for (const v of ventas) {
    if (v.mes !== mes || v.marca !== marca) continue;
    const prod = buscarProducto(marca, v.sap);
    if (prod) total += ptsDe(prod, mes) * (v.cantidad || 1);
  }
  return total;
}

// --- GP Coins directos al monedero (Samsung, Honor, JBL, Motorola directos) --
export function gpDirectos(ventas, marca, mes) {
  let total = 0;
  for (const v of ventas) {
    if (v.mes !== mes || v.marca !== marca) continue;
    const prod = buscarProducto(marca, v.sap);
    if (prod && prod[`gp_${mes}`]) total += gpDe(prod, mes) * (v.cantidad || 1);
  }
  return total;
}

// --- Unidades vendidas por modelo y por familia (para topes de stock) -------
export function unidadesVendidas(ventas, marca, mes) {
  const porModelo = {};
  const porFamilia = {};
  for (const v of ventas) {
    if (v.mes !== mes || v.marca !== marca) continue;
    const prod = buscarProducto(marca, v.sap);
    if (!prod) continue;
    const c = v.cantidad || 1;
    porModelo[v.sap] = (porModelo[v.sap] || 0) + c;
    if (prod.familia) porFamilia[prod.familia] = (porFamilia[prod.familia] || 0) + c;
  }
  return { porModelo, porFamilia };
}

// --- Progreso de una llave concreta -----------------------------------------
export function valorLlave(ventas, incentivoId, llaveId, mes) {
  const delMes = ventas.filter((v) => v.mes === mes);
  switch (llaveId) {
    case 'clientes34': // clientes nuevos 3P y 4P
      return delMes.filter((v) => v.clienteNuevo && (v.convergencia === '3P' || v.convergencia === '4P')).length;
    case 'clientes': // clientes nuevos genéricos
      return delMes.filter((v) => v.clienteNuevo).length;
    case 'portas': {
      const portas = delMes.reduce((a, v) => a + (Number(v.portasVoz) || 0), 0);
      const lineas = delMes.reduce((a, v) => a + (Number(v.lineasVoz) || 0), 0);
      return lineas > 0 ? Math.round((portas / lineas) * 100) : 0;
    }
    case 'til65':
      return delMes.reduce((a, v) => a + (Number(v.til65) || 0), 0);
    case 'secureNet':
      return delMes.reduce((a, v) => a + (Number(v.secureNet) || 0), 0);
    case 'fibra':
      return delMes.filter((v) => v.fibraActiva).length;
    case 'disp': {
      const inc = INCENTIVOS[incentivoId];
      const marca = inc.catalogo;
      return delMes.filter((v) => v.marca === marca).reduce((a, v) => a + (v.cantidad || 1), 0);
    }
    default:
      return 0;
  }
}

// --- Detalle de portas de voz del mes (portas, líneas y % redondeado) --------
export function portasDetalle(ventas, mes) {
  const delMes = ventas.filter((v) => v.mes === mes);
  const portas = delMes.reduce((a, v) => a + (Number(v.portasVoz) || 0), 0);
  const lineas = delMes.reduce((a, v) => a + (Number(v.lineasVoz) || 0), 0);
  const pct = lineas > 0 ? Math.round((portas / lineas) * 100) : 0;
  return { portas, lineas, pct };
}

// --- Estado completo de un incentivo ----------------------------------------
export function estadoIncentivo(ventas, incentivoId, mes) {
  const inc = INCENTIVOS[incentivoId];
  const llaves = inc.llaves.map((ll) => {
    const valor = valorLlave(ventas, incentivoId, ll.id, mes);
    const cumple = valor >= ll.objetivo;
    const pct = Math.min(100, Math.round((valor / ll.objetivo) * 100));
    return { ...ll, valor, cumple, pct };
  });
  const clasifica = llaves.every((l) => l.cumple);

  let puntos = 0;
  let gp = 0;
  if (incentivoId === 'clienteNuevo') {
    puntos = puntosClienteNuevo(ventas, mes);
  } else if (inc.mecanica === 'ranking') {
    puntos = puntosDispositivos(ventas, inc.catalogo, mes);
  } else if (inc.mecanica === 'directo') {
    gp = gpDirectos(ventas, inc.catalogo, mes);
  } else if (inc.mecanica === 'mixta') {
    puntos = puntosDispositivos(ventas, inc.catalogo, mes);
    gp = gpDirectos(ventas, inc.catalogo, mes);
  }

  return { incentivoId, nombre: inc.nombre, mecanica: inc.mecanica, llaves, clasifica, puntos, gp };
}

// --- Resumen global ----------------------------------------------------------
export function resumenGlobal(ventas, mes) {
  const estados = ORDEN_INCENTIVOS.map((id) => estadoIncentivo(ventas, id, mes));
  const delMes = ventas.filter((v) => v.mes === mes);

  // GP Coins directos asegurados (Samsung, Honor, JBL, Motorola directos)
  const gpDirectosTotal = estados.reduce((a, e) => a + e.gp, 0);

  // GP Coins potenciales de ranking: si clasifica, premio del 1er tramo como tope teórico
  let gpPotencialRanking = 0;
  for (const e of estados) {
    const inc = INCENTIVOS[e.incentivoId];
    if (inc.premios.length && e.clasifica) {
      gpPotencialRanking += inc.premios[0].gpcoins; // mejor escenario (1er puesto)
    }
  }

  // Portabilidades móviles: total solicitadas, activas y pendientes
  const portasTotales = delMes.reduce((a, v) => a + (Number(v.portasVoz) || 0), 0);
  const portasActivas = delMes.reduce(
    (a, v) => a + Math.min(Number(v.portasActivas) || 0, Number(v.portasVoz) || 0), 0
  );
  const portasPendientes = Math.max(0, portasTotales - portasActivas);

  return {
    estados,
    totalVentas: delMes.length,
    instalacionesActivas: delMes.filter((v) => estadoDe(v) === 'activa').length,
    clientesNuevos: delMes.filter((v) => v.clienteNuevo).length,
    portasTotales,
    portasActivas,
    portasPendientes,
    gpDirectosTotal,
    gpPotencialRanking,
    incentivosClasificados: estados.filter((e) => e.clasifica).length,
  };
}

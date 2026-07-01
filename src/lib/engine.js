// ============================================================================
//  MOTOR DE CÁLCULO — GP Coins, puntos de ranking y progreso de llaves
// ============================================================================
import {
  CATALOGO, INCENTIVOS, ORDEN_INCENTIVOS, PUNTOS_CONVERGENCIA, PERIODO,
  ptsDe, gpDe, udsDe, convPts,
} from '../data/incentivos.js';
import { estadoDe } from './estados.js';
import { nuevoId } from './id.js';

// Estructura de una venta (campos opcionales, todos los contadores por defecto 0)
export const ventaVacia = () => ({
  id: nuevoId(),
  nombre: '',
  apellido: '',
  dni: '',                 // DNI / NIE del cliente
  telefono: '',            // teléfono de contacto
  email: '',               // email del cliente
  direccion: '',           // dirección de instalación
  pedido: '',              // ID Smart (antes "nº de pedido / contrato")
  idWeb: '',               // ID Web
  fechaVenta: '',
  fechaInstalacion: '',
  mes: 'junio',            // junio | julio (se autodetecta de la fecha)
  // Fibra / convergencia
  convergencia: '',        // '' | '3P' (Fibra+Fijo+Móvil) | '4P' (+TV)
  velocidad: '',           // '' | 'Fibra 300 MB' | 'Fibra 600 MB' | 'Fibra 1 GB'
  tv: '',                  // contenido TV (solo aplica en 4P)
  clienteNuevo: false,     // cuenta para llave "clientes nuevos"
  fibraActiva: false,      // cuenta para llave Fibra (neba o fibra)
  // Terminal / dispositivo
  marca: '',               // '' | 'xiaomi' | 'samsung' | 'honor' | 'motorola' | 'jbl'
  sap: '',                 // código SAP del dispositivo
  dispositivoEntregado: false, // ¿el cliente ya recibió el dispositivo? (gating de puntos/GP)
  incidenciaEntrega: '',   // '' | 'cliente_ausente' | 'rechaza_terminal' | 'otro' (si la entrega no se completó)
  cantidad: 1,             // unidades del dispositivo
  // Líneas móviles detalladas (tarifa, número, nueva/porta, operador, activa)
  lineasMoviles: [],
  // Contadores de llaves (se autocalculan desde lineasMoviles si las hay)
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
  // Leemos el mes directamente de la cadena YYYY-MM-DD para evitar desfases de zona horaria
  const s = fecha instanceof Date ? fecha.toISOString().slice(0, 10) : String(fecha);
  const m = Number(s.slice(5, 7)); // 1=ene … 6=junio, 7=julio
  if (m === 6) return 'junio';
  if (m === 7) return 'julio';
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
    if (estadoDe(v) !== 'activa') continue; // solo ventas activadas puntúan
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
    if (estadoDe(v) !== 'activa') continue; // solo ventas activadas puntúan
    if (!v.dispositivoEntregado) continue;  // solo si el cliente recibió el dispositivo
    const prod = buscarProducto(marca, v.sap);
    if (prod) total += ptsDe(prod, mes) * (v.cantidad || 1);
  }
  return total;
}

// --- GP Coins directos al monedero (Samsung, Honor, JBL, Motorola directos) --
// Solo cuentan ventas ACTIVADAS y se respeta el tope de stock (uds) por
// familia o por modelo según `stockPor` del catálogo.
export function gpDirectos(ventas, marca, mes) {
  const cat = CATALOGO[marca];
  if (!cat) return 0;

  // Unidades activadas por SAP en el mes
  const unidadesPorSap = {};
  for (const v of ventas) {
    if (v.mes !== mes || v.marca !== marca) continue;
    if (estadoDe(v) !== 'activa') continue;
    if (!v.dispositivoEntregado) continue; // GP solo si el cliente recibió el dispositivo
    if (!v.sap) continue;
    unidadesPorSap[v.sap] = (unidadesPorSap[v.sap] || 0) + (v.cantidad || 1);
  }

  let total = 0;

  if (cat.stockPor === 'familia') {
    // Agrupamos por familia y capamos las unidades de la familia a su stock (uds)
    const grupos = {};
    for (const prod of cat.productos) {
      const u = unidadesPorSap[prod.sap] || 0;
      if (u === 0) continue;
      const fam = prod.familia || prod.sap;
      if (!grupos[fam]) grupos[fam] = { cap: 0, saps: [] };
      // El tope de la familia es el mayor uds entre sus miembros (robusto si difieren)
      grupos[fam].cap = Math.max(grupos[fam].cap, udsDe(prod, mes));
      grupos[fam].saps.push({ gp: gpDe(prod, mes), unidades: u });
    }
    for (const fam in grupos) {
      const g = grupos[fam];
      // Acreditamos primero las de mayor GP dentro del tope de la familia
      g.saps.sort((a, b) => b.gp - a.gp);
      let restante = g.cap > 0 ? g.cap : Infinity;
      for (const s of g.saps) {
        const aplica = Math.min(s.unidades, restante);
        total += aplica * s.gp;
        restante -= aplica;
        if (restante <= 0) break;
      }
    }
  } else {
    // Stock por modelo (o sin límite): capamos cada modelo a su propio uds
    for (const prod of cat.productos) {
      const u = unidadesPorSap[prod.sap] || 0;
      if (u === 0 || !gpDe(prod, mes)) continue;
      const uds = udsDe(prod, mes);
      const unidades = uds > 0 ? Math.min(u, uds) : u; // sin uds definido → sin tope
      total += unidades * gpDe(prod, mes);
    }
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
  // Las llaves exigen "venta Y activación": solo cuentan las ventas en estado Activa
  const activas = delMes.filter((v) => estadoDe(v) === 'activa');
  switch (llaveId) {
    case 'clientes34': // clientes nuevos 3P y 4P
      return activas.filter((v) => v.clienteNuevo && (v.convergencia === '3P' || v.convergencia === '4P')).length;
    case 'clientes': // clientes nuevos genéricos
      return activas.filter((v) => v.clienteNuevo).length;
    case 'portas': {
      // Las portas cuentan por su propia activación y en el MES de su ventana de
      // portabilidad (independiente del estado y del mes de la venta).
      const { portas, lineas } = portasPorMes(ventas, mes);
      return lineas > 0 ? Math.round((portas / lineas) * 100) : 0;
    }
    case 'til65':
      // Según bases: TIL65 cuenta en activaciones de cliente nuevo 3P o 4P
      return activas
        .filter((v) => v.clienteNuevo && (v.convergencia === '3P' || v.convergencia === '4P'))
        .reduce((a, v) => a + (Number(v.til65) || 0), 0);
    case 'secureNet':
      return activas.reduce((a, v) => a + (Number(v.secureNet) || 0), 0);
    case 'fibra':
      return activas.filter((v) => v.fibraActiva).length;
    case 'disp': {
      const inc = INCENTIVOS[incentivoId];
      const marca = inc.catalogo;
      // Solo dispositivos válidos del catálogo y ya ENTREGADOS al cliente
      return activas
        .filter((v) => v.marca === marca && v.dispositivoEntregado && buscarProducto(marca, v.sap))
        .reduce((a, v) => a + (v.cantidad || 1), 0);
    }
    default:
      return 0;
  }
}

// --- Portas atribuidas al mes en que se activan (no al de la venta) ----------
// Cada línea porta con "fecha ventana portabilidad" cuenta en el mes de esa
// ventana; el resto (líneas nuevas y ventas sin detalle) van al mes de la venta.
// Devuelve { portas (activas), solicitadas, lineas } del mes indicado.
export function portasPorMes(ventas, mes) {
  let portas = 0; let solicitadas = 0; let lineas = 0;
  for (const v of ventas) {
    const lm = v.lineasMoviles || [];
    if (lm.length > 0) {
      for (const l of lm) {
        // El cliente canceló el proceso (ES M1): esa porta nunca se activará,
        // así que no debe seguir contando como "pendiente" indefinidamente.
        if (l.tipo === 'porta' && l.incidenciaPorta === 'cancelada_m1') continue;
        const mLinea = (l.tipo === 'porta' && l.ventanaPorta) ? mesDesdeFecha(l.ventanaPorta) : v.mes;
        if (mLinea !== mes) continue;
        lineas += 1;
        if (l.tipo === 'porta') {
          solicitadas += 1;
          if (l.activa) portas += 1;
        }
      }
    } else {
      // Sin detalle de líneas: usamos los contadores manuales, atribuidos al mes de la venta
      if (v.mes !== mes) continue;
      lineas += Number(v.lineasVoz) || 0;
      solicitadas += Number(v.portasVoz) || 0;
      portas += Math.min(Number(v.portasActivas) || 0, Number(v.portasVoz) || 0);
    }
  }
  return { portas, solicitadas, lineas };
}

// --- Portas "importadas" de otro mes: la venta se cerró en otro mes distinto
// al de la ventana de portabilidad que cuenta en el mes activo. Útil para
// avisar "estas portas vienen de ventas de otro mes".
export function portasCruzadas(ventas, mes) {
  const out = [];
  for (const v of ventas) {
    for (const l of v.lineasMoviles || []) {
      if (l.tipo !== 'porta' || !l.ventanaPorta) continue;
      // Una porta cancelada por el cliente (ES M1) nunca se activará: no aporta
      // nada avisar de que "viene de otro mes", así que no ensucia el aviso.
      if (l.incidenciaPorta === 'cancelada_m1') continue;
      const mVentana = mesDesdeFecha(l.ventanaPorta);
      if (mVentana === mes && v.mes !== mes) {
        out.push({ venta: v, linea: l, mesVenta: v.mes });
      }
    }
  }
  return out;
}

// --- Estado de entrega del terminal ------------------------------------------
// El terminal no puede entregarse hasta que la línea portada esté activa y
// hayan pasado 48h desde su ventana de portabilidad. Durante la entrega puede
// haber incidencias (cliente ausente, rechaza el terminal, etc.).
export const HORAS_ESPERA_ENTREGA = 48;

export const ETIQUETAS_ENTREGA = {
  entregado: { label: 'Entregado', tone: 'green' },
  cliente_ausente: { label: 'Cliente ausente', tone: 'red' },
  rechaza_terminal: { label: 'Rechaza terminal', tone: 'red' },
  otro: { label: 'Incidencia en entrega', tone: 'red' },
  pendiente: { label: 'Pendiente de entrega', tone: 'gold' },
  esperando_porta: { label: 'Esperando activación de porta', tone: 'gold' },
  esperando_48h: { label: `En espera (48h tras porta)`, tone: 'gold' },
  lista: { label: 'Lista para entregar', tone: 'neutral' },
};

// El terminal va ligado a UNA línea (la principal), no a cualquier porta de la
// venta. Si ninguna línea está marcada como principal, se asume la única
// línea existente (compatibilidad con ventas de una sola línea); con varias
// líneas y ninguna marcada, no hay forma de saber cuál bloquea la entrega.
export function lineaPrincipal(lineasMoviles = []) {
  if (!lineasMoviles.length) return null;
  const marcada = lineasMoviles.find((l) => l.principal);
  if (marcada) return marcada;
  return lineasMoviles.length === 1 ? lineasMoviles[0] : null;
}

// Devuelve la clave de estado (ver ETIQUETAS_ENTREGA) o null si la venta no lleva terminal
export function estadoEntregaTerminal(venta, ahora = new Date()) {
  if (!venta.marca) return null;
  if (venta.dispositivoEntregado) return 'entregado';
  if (venta.incidenciaEntrega) return venta.incidenciaEntrega;

  const principal = lineaPrincipal(venta.lineasMoviles);
  if (!principal || principal.tipo !== 'porta') return 'pendiente'; // sin porta principal que bloquee

  if (!principal.activa || !principal.ventanaPorta) return 'esperando_porta';

  const listaDesde = new Date(new Date(principal.ventanaPorta).getTime() + HORAS_ESPERA_ENTREGA * 3600000);
  return ahora >= listaDesde ? 'lista' : 'esperando_48h';
}

// --- Detalle de portas de voz del mes (portas activas, líneas y % redondeado) -
// El % de la llave se calcula sobre portas ACTIVADAS (no solo solicitadas).
export function portasDetalle(ventas, mes) {
  const { portas, solicitadas, lineas } = portasPorMes(ventas, mes);
  const pct = lineas > 0 ? Math.round((portas / lineas) * 100) : 0;
  return { portas, solicitadas, lineas, pct };
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

  // GP Coins de ranking:
  //  - gpPotencialRanking: ya asegurados si cerrara hoy (solo incentivos clasificados)
  //  - gpPotencialMax: mejor escenario teórico (1er puesto en TODOS los incentivos con premio)
  let gpPotencialRanking = 0;
  let gpPotencialMax = 0;
  for (const e of estados) {
    const inc = INCENTIVOS[e.incentivoId];
    if (inc.premios.length) {
      gpPotencialMax += inc.premios[0].gpcoins;
      if (e.clasifica) gpPotencialRanking += inc.premios[0].gpcoins;
    }
  }

  // Portabilidades móviles: cuentan por su propia activación y en el mes de su
  // ventana de portabilidad (independiente del mes/estado de la venta)
  const pm = portasPorMes(ventas, mes);
  const portasTotales = pm.solicitadas;
  const portasActivas = pm.portas;
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
    gpPotencialMax,
    incentivosClasificados: estados.filter((e) => e.clasifica).length,
  };
}

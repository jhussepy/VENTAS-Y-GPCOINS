// ============================================================================
//  LOWI — seguimiento de ventas (independiente de Vodafone / GP Coins)
//  Lowi no genera GP Coins: aquí solo registramos ventas y su estado.
// ============================================================================

import { ESTADOS, ORDEN_ESTADOS, MOTIVOS_BAJA } from './estados.js';
import { nuevoId } from './id.js';

// Estados compartidos (se re-exportan con el nombre histórico ESTADOS_LOWI)
export const ESTADOS_LOWI = ESTADOS;
export { ORDEN_ESTADOS, MOTIVOS_BAJA };

// Tipos de producto de Lowi
export const PRODUCTOS_LOWI = {
  fibra: 'Solo fibra',
  movil: 'Solo móvil',
  fibra_movil: 'Fibra + móvil',
};

// Velocidades de fibra en Lowi
export const VELOCIDADES_LOWI = ['Fibra 300 Mb', 'Fibra 600 Mb', 'Fibra 1 Gb'];

// Tarifas móviles propias de Lowi (por GB)
export const TARIFAS_MOVIL_LOWI = [
  { id: '10gb', label: '10 GB' },
  { id: '50gb', label: '50 GB' },
  { id: '100gb', label: '100 GB' },
  { id: '150gb', label: '150 GB' },
  { id: '300gb', label: '300 GB' },
];

// Contenidos de TV de Lowi (complemento)
export const TV_LOWI = ['Lowi TV', 'Pack Deportes', 'Netflix', 'Disney+', 'HBO Max', 'Prime'];

// Estructura de una venta de Lowi (todos los campos con valores por defecto)
export const ventaLowiVacia = () => ({
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
  producto: '',            // '' | 'fibra' | 'movil' | 'fibra_movil'
  velocidad: '',           // velocidad de fibra (si aplica)
  tv: '',                  // contenido TV de Lowi (opcional)
  lineasMoviles: [],       // detalle de líneas (tarifa, número, nueva/porta, operador, activa)
  lineas: 0,               // nº de líneas móviles (se autocalcula si hay detalle)
  cuota: 0,                // cuota mensual del cliente (€)
  estado: 'pendiente',     // pendiente | activa | baja | cancelada
  fechaBaja: '',           // fecha en la que se dio de baja
  motivoBaja: '',          // motivo (solo si estado = baja/cancelada)
  notas: '',
});

// Mes (YYYY-MM) de una venta a partir de su fecha de venta
export const mesLowi = (fecha) => (fecha ? String(fecha).slice(0, 7) : '');

// Mes efectivo de una venta: prioriza la fecha de instalación (activación)
// sobre la de venta, ya que el seguimiento se hace por activaciones del mes.
export const mesEfectivoLowi = (v) => mesLowi(v?.fechaInstalacion || v?.fechaVenta);

// Etiqueta legible de un mes YYYY-MM (ej. "junio 2026")
const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const etiquetaMesLowi = (ym) => {
  if (!ym) return 'Sin fecha';
  const [a, m] = ym.split('-');
  const nombre = NOMBRES_MES[Number(m) - 1] || m;
  return `${nombre.charAt(0).toUpperCase()}${nombre.slice(1)} ${a}`;
};

// Resumen global de ventas de Lowi
export function resumenLowi(ventas) {
  const total = ventas.length;
  const porEstado = { pendiente: 0, activa: 0, baja: 0, cancelada: 0 };
  let facturacionActiva = 0;

  // Portabilidad móvil (de las líneas de ventas activas)
  let portasTotales = 0;
  let portasActivas = 0;

  for (const v of ventas) {
    const e = porEstado[v.estado] != null ? v.estado : 'pendiente';
    porEstado[e] += 1;
    if (e === 'activa') {
      facturacionActiva += Number(v.cuota) || 0;
    }
    // Las portas cuentan por su propia activación, igual que en Vodafone:
    // independientemente de si la venta (fibra/alta) ya está activa o no.
    // Si el cliente canceló el proceso (ES M1), esa porta nunca se activará
    // y no debe seguir contando como pendiente.
    for (const l of v.lineasMoviles || []) {
      if (l.tipo === 'porta' && l.incidenciaPorta !== 'cancelada_m1') {
        portasTotales += 1;
        if (l.activa) portasActivas += 1;
      }
    }
  }

  // Tasa de activación: activas sobre las que llegaron a instalarse (activas + bajas)
  const instaladas = porEstado.activa + porEstado.baja;
  const tasaActivacion = instaladas > 0 ? (porEstado.activa / instaladas) * 100 : 0;
  // Tasa de baja: bajas sobre instaladas
  const tasaBaja = instaladas > 0 ? (porEstado.baja / instaladas) * 100 : 0;
  const portasPendientes = Math.max(0, portasTotales - portasActivas);

  return { total, porEstado, facturacionActiva, tasaActivacion, tasaBaja, portasTotales, portasActivas, portasPendientes };
}

// Resumen de contadores derivados de una lista de líneas móviles de Lowi
export function resumenLineasLowi(lm = []) {
  return {
    lineas: lm.length,
    portas: lm.filter((l) => l.tipo === 'porta').length,
    portasActivas: lm.filter((l) => l.tipo === 'porta' && l.activa).length,
  };
}

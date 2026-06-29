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

// Velocidades habituales de fibra en Lowi
export const VELOCIDADES_LOWI = ['Fibra 300 MB', 'Fibra 600 MB', 'Fibra 1 GB'];

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
  lineas: 0,               // nº de líneas móviles
  cuota: 0,                // cuota mensual del cliente (€)
  estado: 'pendiente',     // pendiente | activa | baja | cancelada
  fechaBaja: '',           // fecha en la que se dio de baja
  motivoBaja: '',          // motivo (solo si estado = baja/cancelada)
  notas: '',
});

// Mes (YYYY-MM) de una venta a partir de su fecha de venta
export const mesLowi = (fecha) => (fecha ? String(fecha).slice(0, 7) : '');

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

  for (const v of ventas) {
    const e = porEstado[v.estado] != null ? v.estado : 'pendiente';
    porEstado[e] += 1;
    if (e === 'activa') facturacionActiva += Number(v.cuota) || 0;
  }

  // Tasa de activación: activas sobre las que llegaron a instalarse (activas + bajas)
  const instaladas = porEstado.activa + porEstado.baja;
  const tasaActivacion = instaladas > 0 ? (porEstado.activa / instaladas) * 100 : 0;
  // Tasa de baja: bajas sobre instaladas
  const tasaBaja = instaladas > 0 ? (porEstado.baja / instaladas) * 100 : 0;

  return { total, porEstado, facturacionActiva, tasaActivacion, tasaBaja };
}

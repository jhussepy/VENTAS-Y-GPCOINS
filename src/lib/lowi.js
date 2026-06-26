// ============================================================================
//  LOWI — seguimiento de ventas (independiente de Vodafone / GP Coins)
//  Lowi no genera GP Coins: aquí solo registramos ventas y su estado.
// ============================================================================

// Estados posibles de una venta de Lowi
export const ESTADOS_LOWI = {
  pendiente: { id: 'pendiente', label: 'Pendiente', tone: 'gold', desc: 'Contratada, aún sin instalar' },
  activa: { id: 'activa', label: 'Activa', tone: 'green', desc: 'Instalada y funcionando' },
  baja: { id: 'baja', label: 'Dada de baja', tone: 'red', desc: 'El cliente canceló tras activarse' },
  cancelada: { id: 'cancelada', label: 'Cancelada', tone: 'neutral', desc: 'Se cayó el pedido antes de instalar' },
};

export const ORDEN_ESTADOS = ['pendiente', 'activa', 'baja', 'cancelada'];

// Tipos de producto de Lowi
export const PRODUCTOS_LOWI = {
  fibra: 'Solo fibra',
  movil: 'Solo móvil',
  fibra_movil: 'Fibra + móvil',
};

// Velocidades habituales de fibra en Lowi
export const VELOCIDADES_LOWI = ['Fibra 300 MB', 'Fibra 600 MB', 'Fibra 1 GB'];

// Motivos de baja frecuentes (para analizar después)
export const MOTIVOS_BAJA = [
  'Precio / competencia',
  'Mala cobertura',
  'Avería / incidencias',
  'Mudanza',
  'Atención al cliente',
  'No usaba el servicio',
  'Otro',
];

// Estructura de una venta de Lowi (todos los campos con valores por defecto)
export const ventaLowiVacia = () => ({
  id: crypto.randomUUID(),
  nombre: '',
  apellido: '',
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

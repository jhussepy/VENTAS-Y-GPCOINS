// ============================================================================
//  Estados de una venta (compartidos por Vodafone y Lowi)
// ============================================================================

export const ESTADOS = {
  pendiente: { id: 'pendiente', label: 'Pendiente', tone: 'gold', color: '#FFB81C', desc: 'Contratada, aún sin instalar' },
  activa: { id: 'activa', label: 'Activa', tone: 'green', color: '#10B981', desc: 'Instalada y funcionando' },
  baja: { id: 'baja', label: 'Dada de baja', tone: 'red', color: '#E60000', desc: 'El cliente canceló tras activarse' },
  cancelada: { id: 'cancelada', label: 'Cancelada', tone: 'neutral', color: '#6B7280', desc: 'Se cayó el pedido antes de instalar' },
};

export const ORDEN_ESTADOS = ['pendiente', 'activa', 'baja', 'cancelada'];

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

// Devuelve el estado de una venta con compatibilidad hacia atrás:
// las ventas antiguas (sin campo 'estado') se deducen de instalacionActiva.
export const estadoDe = (v) => v?.estado || (v?.instalacionActiva ? 'activa' : 'pendiente');

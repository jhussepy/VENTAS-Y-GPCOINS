// ============================================================================
//  AGENDADOS — clientes que piden que se les llame otro día/hora para cerrar
//  la contratación. Lista compartida entre Vodafone y Lowi (un mismo agente
//  puede tener agendados de ambos mundos mezclados en su agenda).
// ============================================================================
import { nuevoId } from './id.js';

export const ESTADOS_AGENDA = {
  pendiente: { id: 'pendiente', label: 'Pendiente', tone: 'gold', color: '#FFB81C' },
  sin_respuesta: { id: 'sin_respuesta', label: 'Sin respuesta', tone: 'red', color: '#E60000' },
  reagendado: { id: 'reagendado', label: 'Reagendado', tone: 'neutral', color: '#6B7280' },
  convertido: { id: 'convertido', label: 'Convertido en venta', tone: 'green', color: '#10B981' },
  descartado: { id: 'descartado', label: 'Descartado', tone: 'neutral', color: '#6B7280' },
};

export const ORDEN_ESTADOS_AGENDA = ['pendiente', 'sin_respuesta', 'reagendado', 'convertido', 'descartado'];

export const agendadoVacio = () => ({
  id: nuevoId(),
  nombre: '',
  apellido: '',
  dni: '',            // DNI / NIE
  cif: '',            // CIF o ID (empresas / identificador interno)
  telefono: '',       // número de contacto
  fechaLlamada: '',   // YYYY-MM-DD
  hora: '',           // HH:mm
  estado: 'pendiente',
  observaciones: '',
  usuario: '',        // quién agendó la llamada (nombre/email del agente)
  operador: 'vodafone', // 'vodafone' | 'lowi'
});

// Combina fechaLlamada + hora en un Date (o null si no hay fecha válida)
export function fechaHoraAgendado(a) {
  if (!a?.fechaLlamada) return null;
  const d = new Date(`${a.fechaLlamada}T${a.hora || '00:00'}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

// ¿La llamada ya venció y sigue sin gestionarse? (para resaltarla en rojo)
export function estaAtrasado(a, ahora = new Date()) {
  if (!a || a.estado !== 'pendiente') return false;
  const d = fechaHoraAgendado(a);
  return !!d && d < ahora;
}

// Orden ascendente por fecha+hora; los que no tienen fecha van al final
export function ordenarAgendados(lista) {
  return [...lista].sort((a, b) => {
    const da = fechaHoraAgendado(a);
    const db = fechaHoraAgendado(b);
    if (!da && !db) return 0;
    if (!da) return 1;
    if (!db) return -1;
    return da - db;
  });
}

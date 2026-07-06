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
  intentos: 0,        // nº de veces que se ha intentado llamar
  ultimoIntento: '',  // fecha/hora del último intento (YYYY-MM-DDTHH:mm)
});

// Fecha/hora local actual como "YYYY-MM-DDTHH:mm" (para registrar un intento)
export function ahoraLocalISO(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

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

// Fecha local YYYY-MM-DD (sin desfase de zona horaria)
const isoLocal = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// ¿La llamada está programada para hoy?
export function esDeHoy(a, ahora = new Date()) {
  return !!a?.fechaLlamada && a.fechaLlamada.slice(0, 10) === isoLocal(ahora);
}

// Siguiente día hábil (lunes-viernes) a partir de `desde` — para "reagendar
// rápido": se trabaja de lunes a viernes, así que un viernes salta al lunes.
export function siguienteDiaHabil(desde = new Date()) {
  const d = new Date(desde.getFullYear(), desde.getMonth(), desde.getDate());
  do { d.setDate(d.getDate() + 1); } while (d.getDay() === 0 || d.getDay() === 6);
  return isoLocal(d);
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

import { describe, it, expect } from 'vitest';
import { estaAtrasado, ordenarAgendados, fechaHoraAgendado } from './agendados.js';

const ahora = new Date('2026-07-10T12:00:00');

describe('fechaHoraAgendado', () => {
  it('combina fecha y hora en un Date', () => {
    const d = fechaHoraAgendado({ fechaLlamada: '2026-07-10', hora: '15:30' });
    expect(d.getHours()).toBe(15);
    expect(d.getMinutes()).toBe(30);
  });

  it('devuelve null si no hay fecha', () => {
    expect(fechaHoraAgendado({ fechaLlamada: '', hora: '10:00' })).toBeNull();
  });

  it('usa 00:00 si falta la hora', () => {
    const d = fechaHoraAgendado({ fechaLlamada: '2026-07-10', hora: '' });
    expect(d.getHours()).toBe(0);
  });
});

describe('estaAtrasado', () => {
  it('marca atrasado si la fecha/hora ya pasó y sigue pendiente', () => {
    const a = { estado: 'pendiente', fechaLlamada: '2026-07-09', hora: '10:00' };
    expect(estaAtrasado(a, ahora)).toBe(true);
  });

  it('no marca atrasado si aún no ha llegado la hora', () => {
    const a = { estado: 'pendiente', fechaLlamada: '2026-07-11', hora: '10:00' };
    expect(estaAtrasado(a, ahora)).toBe(false);
  });

  it('no marca atrasado si ya no está pendiente (aunque la fecha haya pasado)', () => {
    const a = { estado: 'convertido', fechaLlamada: '2026-07-09', hora: '10:00' };
    expect(estaAtrasado(a, ahora)).toBe(false);
  });

  it('no marca atrasado si no hay fecha', () => {
    expect(estaAtrasado({ estado: 'pendiente', fechaLlamada: '' }, ahora)).toBe(false);
  });
});

describe('ordenarAgendados', () => {
  it('ordena ascendente por fecha+hora', () => {
    const lista = [
      { id: 'b', fechaLlamada: '2026-07-12', hora: '09:00' },
      { id: 'a', fechaLlamada: '2026-07-10', hora: '18:00' },
      { id: 'c', fechaLlamada: '2026-07-10', hora: '09:00' },
    ];
    const ord = ordenarAgendados(lista);
    expect(ord.map((x) => x.id)).toEqual(['c', 'a', 'b']);
  });

  it('deja los que no tienen fecha al final', () => {
    const lista = [
      { id: 'sin-fecha', fechaLlamada: '' },
      { id: 'con-fecha', fechaLlamada: '2026-07-10', hora: '09:00' },
    ];
    const ord = ordenarAgendados(lista);
    expect(ord.map((x) => x.id)).toEqual(['con-fecha', 'sin-fecha']);
  });
});

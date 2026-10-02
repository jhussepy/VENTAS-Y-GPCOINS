import { describe, expect, it } from 'vitest';
import { fechaHoraLocalISO, fechaLocalISO } from './fecha.js';

describe('fecha local para campos de calendario', () => {
  it('formatea YYYY-MM-DD usando el calendario local', () => {
    const d = new Date(2026, 9, 2, 17, 8);
    expect(fechaLocalISO(d)).toBe('2026-10-02');
    expect(fechaHoraLocalISO(d)).toBe('2026-10-02T17:08');
  });

  it('no depende de la fecha UTC de toISOString', () => {
    const fechaCercaDeMedianoche = {
      getFullYear: () => 2026,
      getMonth: () => 9,
      getDate: () => 2,
      getHours: () => 0,
      getMinutes: () => 30,
      toISOString: () => '2026-10-01T22:30:00.000Z',
    };
    expect(fechaCercaDeMedianoche.toISOString().slice(0, 10)).toBe('2026-10-01');
    expect(fechaLocalISO(fechaCercaDeMedianoche)).toBe('2026-10-02');
    expect(fechaHoraLocalISO(fechaCercaDeMedianoche)).toBe('2026-10-02T00:30');
  });
});

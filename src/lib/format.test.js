import { describe, it, expect } from 'vitest';
import { fmtNum, fmtEur, fmtFecha } from './format.js';

describe('fmtNum', () => {
  it('formatea con separador de miles español', () => {
    expect(fmtNum(1234567)).toBe('1.234.567');
  });
  it('trata null/undefined como 0', () => {
    expect(fmtNum(null)).toBe('0');
    expect(fmtNum(undefined)).toBe('0');
  });
});

describe('fmtEur', () => {
  it('formatea como euros', () => {
    // El símbolo puede ir con espacio no separable; comprobamos las partes
    const s = fmtEur(25);
    expect(s).toMatch(/25/);
    expect(s).toMatch(/€/);
  });
  it('null → 0 €', () => {
    expect(fmtEur(null)).toMatch(/0/);
  });
});

describe('fmtFecha', () => {
  it('convierte YYYY-MM-DD a dd/mm/yyyy sin desfase horario', () => {
    expect(fmtFecha('2026-07-01')).toBe('01/07/2026');
    expect(fmtFecha('2026-06-18T10:00')).toBe('18/06/2026');
  });
  it('vacío → guion', () => {
    expect(fmtFecha('')).toBe('—');
    expect(fmtFecha(null)).toBe('—');
  });
  it('cadena no reconocible se devuelve tal cual', () => {
    expect(fmtFecha('sin fecha')).toBe('sin fecha');
  });
});

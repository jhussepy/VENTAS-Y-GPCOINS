import { describe, it, expect } from 'vitest';
import { dniValido, telefonoValido, emailValido, avisosContacto } from './validacion.js';

describe('dniValido', () => {
  it('acepta un DNI correcto', () => {
    expect(dniValido('12345678Z')).toBe(true); // 12345678 % 23 = 14 → Z
    expect(dniValido('00000000T')).toBe(true);
  });
  it('acepta un NIE correcto (X/Y/Z)', () => {
    expect(dniValido('X1234567L')).toBe(true); // 01234567 % 23 = 3 → L
  });
  it('rechaza letra de control incorrecta', () => {
    expect(dniValido('12345678A')).toBe(false);
  });
  it('rechaza formatos inválidos', () => {
    expect(dniValido('1234567Z')).toBe(false); // solo 7 dígitos
    expect(dniValido('ABCDEFGHZ')).toBe(false);
  });
  it('vacío se considera válido (campo opcional)', () => {
    expect(dniValido('')).toBe(true);
    expect(dniValido(null)).toBe(true);
  });
  it('ignora minúsculas y espacios', () => {
    expect(dniValido(' 12345678z ')).toBe(true);
  });
});

describe('telefonoValido', () => {
  it('acepta 9 dígitos empezando por 6/7/8/9', () => {
    expect(telefonoValido('612345678')).toBe(true);
    expect(telefonoValido('912345678')).toBe(true);
  });
  it('admite espacios, guiones y prefijo +34', () => {
    expect(telefonoValido('+34 612-345-678')).toBe(true);
  });
  it('rechaza longitudes o prefijos inválidos', () => {
    expect(telefonoValido('12345678')).toBe(false); // 8 dígitos
    expect(telefonoValido('512345678')).toBe(false); // empieza por 5
  });
  it('vacío = válido (opcional)', () => {
    expect(telefonoValido('')).toBe(true);
  });
});

describe('emailValido', () => {
  it('acepta un email básico', () => {
    expect(emailValido('cliente@correo.com')).toBe(true);
  });
  it('rechaza sin arroba o sin dominio', () => {
    expect(emailValido('clientecorreo.com')).toBe(false);
    expect(emailValido('cliente@correo')).toBe(false);
  });
  it('vacío = válido (opcional)', () => {
    expect(emailValido('')).toBe(true);
  });
});

describe('avisosContacto', () => {
  it('no avisa si todo es válido o está vacío', () => {
    expect(avisosContacto({ dni: '12345678Z', telefono: '612345678', email: '' })).toEqual([]);
  });
  it('acumula un aviso por cada dato inválido', () => {
    const a = avisosContacto({ dni: '12345678A', telefono: '123', email: 'malo' });
    expect(a).toHaveLength(3);
  });
});

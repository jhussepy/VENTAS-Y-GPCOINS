import { describe, it, expect } from 'vitest';
import { mesDesdeFecha, ventaVacia } from './engine.js';
import { dniValido, telefonoValido, emailValido } from './validacion.js';
import { resumenLowi, mesLowi, ventaLowiVacia } from './lowi.js';

describe('mesDesdeFecha', () => {
  it('clasifica junio y julio correctamente (getMonth base 0)', () => {
    expect(mesDesdeFecha('2026-06-15')).toBe('junio');
    expect(mesDesdeFecha('2026-07-01')).toBe('julio');
  });
  it('por defecto junio si no hay fecha', () => {
    expect(mesDesdeFecha('')).toBe('junio');
  });
});

describe('validación de DNI', () => {
  it('acepta DNI válidos', () => {
    expect(dniValido('12345678Z')).toBe(true);
    expect(dniValido('87654321X')).toBe(true);
  });
  it('rechaza DNI con letra incorrecta', () => {
    expect(dniValido('12345678A')).toBe(false);
  });
  it('acepta NIE válido', () => {
    expect(dniValido('X0000000T')).toBe(true);
  });
  it('campo vacío se considera válido (opcional)', () => {
    expect(dniValido('')).toBe(true);
  });
});

describe('validación de teléfono', () => {
  it('acepta móviles/fijos españoles', () => {
    expect(telefonoValido('600111222')).toBe(true);
    expect(telefonoValido('+34 600 111 222')).toBe(true);
    expect(telefonoValido('912345678')).toBe(true);
  });
  it('rechaza números mal formados', () => {
    expect(telefonoValido('12345')).toBe(false);
    expect(telefonoValido('500111222')).toBe(false);
  });
});

describe('validación de email', () => {
  it('acepta y rechaza correctamente', () => {
    expect(emailValido('a@b.com')).toBe(true);
    expect(emailValido('malformado')).toBe(false);
    expect(emailValido('')).toBe(true);
  });
});

describe('resumenLowi', () => {
  it('cuenta estados y facturación activa', () => {
    const v = [
      { ...ventaLowiVacia(), estado: 'activa', cuota: 30 },
      { ...ventaLowiVacia(), estado: 'activa', cuota: 20 },
      { ...ventaLowiVacia(), estado: 'baja', cuota: 40 },
      { ...ventaLowiVacia(), estado: 'pendiente', cuota: 25 },
    ];
    const r = resumenLowi(v);
    expect(r.total).toBe(4);
    expect(r.porEstado.activa).toBe(2);
    expect(r.facturacionActiva).toBe(50);
    // instaladas = activas(2) + bajas(1) = 3 → tasa activación 2/3
    expect(Math.round(r.tasaActivacion)).toBe(67);
  });
});

describe('mesLowi', () => {
  it('extrae YYYY-MM de la fecha', () => {
    expect(mesLowi('2026-06-15')).toBe('2026-06');
    expect(mesLowi('')).toBe('');
  });
});

describe('ventaVacia', () => {
  it('incluye los campos de contacto nuevos', () => {
    const v = ventaVacia();
    expect(v).toHaveProperty('dni');
    expect(v).toHaveProperty('telefono');
    expect(v).toHaveProperty('email');
    expect(v).toHaveProperty('direccion');
    expect(v).toHaveProperty('pedido');
  });
});

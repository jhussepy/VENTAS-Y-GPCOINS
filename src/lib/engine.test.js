import { describe, it, expect } from 'vitest';
import { mesDesdeFecha, ventaVacia, resumenGlobal, portasDetalle } from './engine.js';
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
  it('no se desfasa por zona horaria en límites de mes', () => {
    expect(mesDesdeFecha('2026-06-30')).toBe('junio');
    expect(mesDesdeFecha('2026-07-01')).toBe('julio');
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

describe('portabilidad en resumenGlobal', () => {
  it('agrega portas totales, activas y pendientes (con clamp)', () => {
    const ventas = [
      { ...ventaVacia(), mes: 'junio', portasVoz: 3, portasActivas: 2 },
      { ...ventaVacia(), mes: 'junio', portasVoz: 1, portasActivas: 5 }, // activas > solicitadas → clamp a 1
    ];
    const r = resumenGlobal(ventas, 'junio');
    expect(r.portasTotales).toBe(4);
    expect(r.portasActivas).toBe(3); // 2 + min(5,1)=1
    expect(r.portasPendientes).toBe(1);
  });
});

describe('portasDetalle usa portas activas para el %', () => {
  it('el porcentaje se calcula sobre activas, no solicitadas', () => {
    const ventas = [
      { ...ventaVacia(), mes: 'junio', portasVoz: 4, portasActivas: 0, lineasVoz: 4 },
    ];
    const d = portasDetalle(ventas, 'junio');
    expect(d.portas).toBe(0);        // activas
    expect(d.solicitadas).toBe(4);   // solicitadas aparte
    expect(d.lineas).toBe(4);
    expect(d.pct).toBe(0);           // 0 activas → 0%
  });
});

describe('gpPotencialMax', () => {
  it('existe y es el techo teórico (>= asegurado por ranking)', () => {
    const r = resumenGlobal([], 'junio');
    expect(r.gpPotencialMax).toBeGreaterThanOrEqual(r.gpPotencialRanking);
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

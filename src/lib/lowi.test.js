import { describe, it, expect } from 'vitest';
import { resumenLowi, resumenLineasLowi, mesLowi, mesEfectivoLowi, etiquetaMesLowi } from './lowi.js';

describe('resumenLowi', () => {
  it('cuenta por estado y suma la facturación solo de las activas', () => {
    const ventas = [
      { estado: 'activa', cuota: 30, lineasMoviles: [] },
      { estado: 'activa', cuota: 20, lineasMoviles: [] },
      { estado: 'pendiente', cuota: 99, lineasMoviles: [] },
      { estado: 'baja', cuota: 15, lineasMoviles: [] },
    ];
    const r = resumenLowi(ventas);
    expect(r.total).toBe(4);
    expect(r.porEstado).toEqual({ pendiente: 1, activa: 2, baja: 1, cancelada: 0 });
    expect(r.facturacionActiva).toBe(50); // solo las activas
  });

  it('tasa de activación y baja sobre instaladas (activa+baja), sin dividir por cero', () => {
    expect(resumenLowi([]).tasaActivacion).toBe(0);
    const r = resumenLowi([
      { estado: 'activa', lineasMoviles: [] },
      { estado: 'activa', lineasMoviles: [] },
      { estado: 'activa', lineasMoviles: [] },
      { estado: 'baja', lineasMoviles: [] },
    ]);
    expect(r.tasaActivacion).toBe(75); // 3 de 4 instaladas
    expect(r.tasaBaja).toBe(25);
  });

  it('portas: cuenta activas y excluye canceladas por el cliente (ES M1)', () => {
    const r = resumenLowi([{
      estado: 'activa', cuota: 0,
      lineasMoviles: [
        { tipo: 'porta', activa: true },
        { tipo: 'porta', activa: false },
        { tipo: 'porta', activa: false, incidenciaPorta: 'cancelada_m1' },
        { tipo: 'nueva' },
      ],
    }]);
    expect(r.portasTotales).toBe(2); // la cancelada M1 no cuenta
    expect(r.portasActivas).toBe(1);
    expect(r.portasPendientes).toBe(1);
  });

  it('estado desconocido cuenta como pendiente', () => {
    const r = resumenLowi([{ estado: 'raro', lineasMoviles: [] }]);
    expect(r.porEstado.pendiente).toBe(1);
  });
});

describe('resumenLineasLowi', () => {
  it('cuenta líneas, portas y portas activas excluyendo M1', () => {
    const r = resumenLineasLowi([
      { tipo: 'porta', activa: true },
      { tipo: 'porta', activa: false },
      { tipo: 'porta', activa: true, incidenciaPorta: 'cancelada_m1' },
      { tipo: 'nueva' },
    ]);
    expect(r.lineas).toBe(3); // la M1 se excluye del total
    expect(r.portas).toBe(2);
    expect(r.portasActivas).toBe(1);
  });
});

describe('mes de una venta Lowi', () => {
  it('mesLowi toma el YYYY-MM de la fecha', () => {
    expect(mesLowi('2026-07-15')).toBe('2026-07');
    expect(mesLowi('')).toBe('');
  });
  it('mesEfectivoLowi prioriza la instalación sobre la venta', () => {
    expect(mesEfectivoLowi({ fechaVenta: '2026-06-20', fechaInstalacion: '2026-07-02' })).toBe('2026-07');
    expect(mesEfectivoLowi({ fechaVenta: '2026-06-20', fechaInstalacion: '' })).toBe('2026-06');
  });
  it('etiquetaMesLowi da nombre legible', () => {
    expect(etiquetaMesLowi('2026-07')).toBe('Julio 2026');
    expect(etiquetaMesLowi('')).toBe('Sin fecha');
  });
});

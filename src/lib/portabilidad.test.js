import { describe, it, expect } from 'vitest';
import { ventanaRelevante, fmtVentana } from './portabilidad.js';
import { mesesImplicados, portasDeVenta } from './engine.js';

const ahora = new Date('2026-06-30T12:00:00');

describe('ventanaRelevante', () => {
  it('devuelve null si no hay portas con ventana', () => {
    expect(ventanaRelevante([], ahora)).toBeNull();
    expect(ventanaRelevante([{ tipo: 'nueva', ventanaPorta: '2026-07-01T02:00' }], ahora)).toBeNull();
  });

  it('ignora portas ya activadas', () => {
    expect(ventanaRelevante([{ tipo: 'porta', activa: true, ventanaPorta: '2026-07-01T02:00' }], ahora)).toBeNull();
  });

  it('marca vencida cuando la fecha ya pasó', () => {
    const r = ventanaRelevante([{ tipo: 'porta', activa: false, ventanaPorta: '2026-06-29T02:00' }], ahora);
    expect(r.estado).toBe('vencida');
  });

  it('marca proxima dentro de 48h', () => {
    const r = ventanaRelevante([{ tipo: 'porta', activa: false, ventanaPorta: '2026-07-01T02:00' }], ahora);
    expect(r.estado).toBe('proxima');
  });

  it('marca programada a más de 48h', () => {
    const r = ventanaRelevante([{ tipo: 'porta', activa: false, ventanaPorta: '2026-07-10T02:00' }], ahora);
    expect(r.estado).toBe('programada');
  });

  it('elige la ventana más temprana entre varias', () => {
    const r = ventanaRelevante([
      { tipo: 'porta', activa: false, ventanaPorta: '2026-07-10T02:00' },
      { tipo: 'porta', activa: false, ventanaPorta: '2026-07-01T02:00' },
    ], ahora);
    expect(r.fecha).toBe('2026-07-01T02:00');
  });
});

describe('fmtVentana', () => {
  it('formatea sin desfase de zona horaria', () => {
    expect(fmtVentana('2026-07-01T02:00')).toBe('01/07 02:00');
  });
  it('vacío si no hay valor', () => {
    expect(fmtVentana('')).toBe('');
  });
});

describe('mesesImplicados', () => {
  it('incluye solo el mes propio sin portas', () => {
    const m = mesesImplicados({ mes: 'junio', lineasMoviles: [] });
    expect([...m]).toEqual(['junio']);
  });

  it('añade el mes de la ventana de portabilidad de otro mes', () => {
    const m = mesesImplicados({
      mes: 'junio',
      lineasMoviles: [{ tipo: 'porta', ventanaPorta: '2026-07-02T02:00' }],
    });
    expect(m.has('junio')).toBe(true);
    expect(m.has('julio')).toBe(true);
  });

  it('ignora portas canceladas (ES M1)', () => {
    const m = mesesImplicados({
      mes: 'junio',
      lineasMoviles: [{ tipo: 'porta', ventanaPorta: '2026-07-02T02:00', incidenciaPorta: 'cancelada_m1' }],
    });
    expect(m.has('julio')).toBe(false);
  });
});

describe('portasDeVenta', () => {
  it('marca otroMes cuando la ventana cae fuera del mes de la venta', () => {
    const p = portasDeVenta({
      mes: 'junio',
      lineasMoviles: [
        { tipo: 'porta', ventanaPorta: '2026-07-02T02:00', activa: false },
        { tipo: 'nueva' },
      ],
    });
    expect(p).toHaveLength(1);
    expect(p[0].mes).toBe('julio');
    expect(p[0].otroMes).toBe(true);
  });
});

import { describe, expect, it } from 'vitest';
import { fusionar } from './mutations.js';

describe('fusión concurrente de líneas móviles', () => {
  it('conserva cambios de sesiones distintas en líneas diferentes', () => {
    const before = [
      { id: 'linea-1', tarifa: 'basica', numero: '600000001', activa: false },
      { id: 'linea-2', tarifa: 'ilim60', numero: '600000002', activa: false },
    ];
    const after = before.map(linea => linea.id === 'linea-1' ? { ...linea, activa: true } : linea);
    const current = before.map(linea => linea.id === 'linea-2' ? { ...linea, activa: true } : linea);

    expect(fusionar(current, before, after, true, 'ventas/venta-1.lineasMoviles')).toEqual([
      { id: 'linea-1', tarifa: 'basica', numero: '600000001', activa: true },
      { id: 'linea-2', tarifa: 'ilim60', numero: '600000002', activa: true },
    ]);
  });

  it('combina cambios en campos distintos de la misma línea', () => {
    const before = [{ id: 'linea-1', tarifa: 'basica', numero: '600000001', activa: false }];
    const after = [{ ...before[0], tarifa: 'ilim60' }];
    const current = [{ ...before[0], activa: true }];

    expect(fusionar(current, before, after, true, 'ventas/venta-1.lineasMoviles')).toEqual([
      { id: 'linea-1', tarifa: 'ilim60', numero: '600000001', activa: true },
    ]);
  });

  it('mantiene el aviso si dos sesiones cambian el mismo campo de la misma línea', () => {
    const before = [{ id: 'linea-1', tarifa: 'basica', activa: false }];
    const after = [{ ...before[0], tarifa: 'ilim60' }];
    const current = [{ ...before[0], tarifa: 'ilim160' }];

    expect(() => fusionar(current, before, after, true, 'ventas/venta-1.lineasMoviles'))
      .toThrow(/Conflicto en ventas\/venta-1\.lineasMoviles\/linea-1\.tarifa/);
  });

  it('continúa detectando conflictos al borrar una línea que otra sesión modificó', () => {
    const before = [{ id: 'linea-1', tarifa: 'basica', activa: false }];
    const after = [];
    const current = [{ ...before[0], activa: true }];

    expect(() => fusionar(current, before, after, true, 'ventas/venta-1.lineasMoviles'))
      .toThrow(/Conflicto/);
  });
});

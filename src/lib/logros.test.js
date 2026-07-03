import { describe, it, expect } from 'vitest';
import { rachaVentas, calcularLogros, focoDelDia } from './logros.js';

describe('rachaVentas', () => {
  const hoy = new Date('2026-07-15T12:00:00');

  it('0 si no hay ventas', () => {
    expect(rachaVentas([], hoy)).toBe(0);
  });

  it('cuenta días consecutivos terminando hoy', () => {
    const ventas = [
      { fechaVenta: '2026-07-15' }, { fechaVenta: '2026-07-14' }, { fechaVenta: '2026-07-13' },
    ];
    expect(rachaVentas(ventas, hoy)).toBe(3);
  });

  it('varias ventas el mismo día cuentan como un solo día', () => {
    const ventas = [
      { fechaVenta: '2026-07-15' }, { fechaVenta: '2026-07-15' }, { fechaVenta: '2026-07-14' },
    ];
    expect(rachaVentas(ventas, hoy)).toBe(2);
  });

  it('sigue contando si la última venta fue ayer (no hoy)', () => {
    const ventas = [{ fechaVenta: '2026-07-14' }, { fechaVenta: '2026-07-13' }];
    expect(rachaVentas(ventas, hoy)).toBe(2);
  });

  it('se rompe si la última venta fue anteayer', () => {
    const ventas = [{ fechaVenta: '2026-07-13' }, { fechaVenta: '2026-07-12' }];
    expect(rachaVentas(ventas, hoy)).toBe(0);
  });

  it('un hueco corta la racha', () => {
    const ventas = [{ fechaVenta: '2026-07-15' }, { fechaVenta: '2026-07-13' }]; // falta el 14
    expect(rachaVentas(ventas, hoy)).toBe(1);
  });
});

describe('calcularLogros', () => {
  it('marca cumplido y calcula el porcentaje', () => {
    const logros = calcularLogros({ totalVentas: 12, portasActivas: 2, clientesNuevos: 5, gpDirectosTotal: 0, incentivosClasificados: 0, instalacionesActivas: 3 }, 3);
    const diez = logros.find((l) => l.id === 'diez');
    const portas = logros.find((l) => l.id === 'portas');
    const clientes = logros.find((l) => l.id === 'clientes');
    expect(diez.cumplido).toBe(true);
    expect(portas.cumplido).toBe(false);
    expect(portas.pct).toBe(40); // 2/5
    expect(clientes.cumplido).toBe(true);
  });

  it('la insignia de racha usa el valor de racha, no el resumen', () => {
    const logros = calcularLogros({}, 7);
    expect(logros.find((l) => l.id === 'racha7').cumplido).toBe(true);
  });

  it('usa el objetivo personalizado cuando hay override', () => {
    const logros = calcularLogros({ totalVentas: 3 }, 0, { diez: 3 });
    const diez = logros.find((l) => l.id === 'diez');
    expect(diez.objetivo).toBe(3);
    expect(diez.cumplido).toBe(true);
  });

  it('ignora overrides inválidos (0, negativos) y usa el valor por defecto', () => {
    const logros = calcularLogros({}, 0, { diez: 0, portas: -5 });
    expect(logros.find((l) => l.id === 'diez').objetivo).toBe(10);
    expect(logros.find((l) => l.id === 'portas').objetivo).toBe(5);
  });
});

describe('focoDelDia', () => {
  it('elige la llave a la que menos le falta', () => {
    const resumen = {
      totalVentas: 4,
      estados: [
        { nombre: 'Cliente Nuevo', llaves: [
          { id: 'clientes34', tipo: 'cantidad', valor: 5, objetivo: 6, cumple: false }, // falta 1
          { id: 'secureNet', tipo: 'cantidad', valor: 1, objetivo: 6, cumple: false },   // falta 5
        ] },
      ],
    };
    const f = focoDelDia(resumen);
    expect(f.tipo).toBe('objetivo');
    expect(f.titulo).toContain('falta 1');
    expect(f.texto).toContain('clientes nuevos 3P/4P');
  });

  it('mensaje motivador si no hay llaves pendientes', () => {
    expect(focoDelDia({ totalVentas: 8, estados: [] }).tipo).toBe('ok');
  });

  it('mensaje de arranque si no hay ventas', () => {
    expect(focoDelDia({ totalVentas: 0, estados: [] }).tipo).toBe('vacio');
  });
});

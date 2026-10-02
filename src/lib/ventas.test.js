import { describe, expect, it } from 'vitest';
import { ventaVacia } from './engine.js';
import {
  analizarVentaParaGuardar,
  errorVentaParaGuardar,
  filtrarVentas,
  mesesSeguimientoVentas,
} from './ventas.js';
import { CATALOGO } from '../data/incentivos.js';

describe('lógica de la página Ventas', () => {
  it('valida nombre y apellido sin depender de la UI', () => {
    expect(errorVentaParaGuardar({ nombre: 'Ana', apellido: 'Prueba' })).toBe('');
    expect(errorVentaParaGuardar({ nombre: 'Ana', apellido: '   ' })).toMatch(/nombre y apellido/i);
    expect(errorVentaParaGuardar(null)).toMatch(/nombre y apellido/i);
  });

  it('filtra por mes implicado, estado y búsqueda de cliente', () => {
    const ventaCruzada = {
      ...ventaVacia(),
      id: 'cruzada',
      nombre: 'Ana',
      apellido: 'Prueba',
      dni: '12345678Z',
      mes: 'junio',
      estado: 'activa',
      lineasMoviles: [{
        id: 'l1',
        tipo: 'porta',
        activa: true,
        ventanaPorta: '2026-07-05T02:00',
      }],
    };
    const otra = {
      ...ventaVacia(),
      id: 'otra',
      nombre: 'Luis',
      apellido: 'Test',
      mes: 'julio',
      estado: 'pendiente',
    };

    expect(filtrarVentas([ventaCruzada, otra], {
      filtroMes: 'julio',
      filtroEstado: 'activa',
      busqueda: '12345678z',
    })).toEqual([ventaCruzada]);
  });

  it('detecta meses de seguimiento fuera de la campaña sin duplicados', () => {
    const ventas = [
      { ...ventaVacia(), mes: '2026-10' },
      { ...ventaVacia(), mes: '2026-10' },
      { ...ventaVacia(), mes: '2026-11' },
      { ...ventaVacia(), mes: 'septiembre' },
    ];
    expect(mesesSeguimientoVentas(ventas)).toEqual(['2026-10', '2026-11']);
  });

  it('avisa de meses sin reglas comerciales posteriores a septiembre', () => {
    const venta = {
      ...ventaVacia(),
      nombre: 'Ana',
      apellido: 'Prueba',
      fechaVenta: '2026-10-02',
      mes: '2026-10',
    };
    const resultado = analizarVentaParaGuardar(venta, []);
    expect(resultado.mesSinReglas).toBe(true);
    expect(resultado.avisos.join(' ')).toMatch(/fuera del período/i);
    expect(resultado.avisos.join(' ')).toMatch(/OCTUBRE 2026 no tiene reglas/i);
  });

  it('calcula el aviso de stock con el mes de entrega, no con el mes de venta', () => {
    const prod = CATALOGO.samsung.productos[0];
    const base = {
      ...ventaVacia(),
      marca: 'samsung',
      sap: prod.sap,
      estado: 'activa',
      dispositivoEntregado: true,
    };
    const existente = {
      ...base,
      id: 'existente',
      mes: 'julio',
      fechaEntrega: '2026-07-01',
      cantidad: 29,
    };
    const nueva = {
      ...base,
      id: 'nueva',
      nombre: 'Ana',
      apellido: 'Prueba',
      mes: 'junio',
      fechaVenta: '2026-06-28',
      fechaEntrega: '2026-07-02',
      cantidad: 1,
    };

    const resultado = analizarVentaParaGuardar(nueva, [existente]);
    expect(resultado.mesStock).toBe('julio');
    expect(resultado.avisos.join(' ')).toMatch(/tope de 30 uds \(30\)/i);
    expect(resultado.avisos.join(' ')).toMatch(/en julio/i);
  });

  it('una venta pendiente o sin entregar no consume stock de incentivo', () => {
    const prod = CATALOGO.samsung.productos[0];
    const pendientes = [{
      ...ventaVacia(),
      id: 'pendiente',
      marca: 'samsung',
      sap: prod.sap,
      mes: 'julio',
      estado: 'pendiente',
      dispositivoEntregado: false,
      cantidad: 30,
    }];
    const nueva = {
      ...ventaVacia(),
      id: 'nueva',
      nombre: 'Ana',
      apellido: 'Prueba',
      marca: 'samsung',
      sap: prod.sap,
      mes: 'julio',
      estado: 'activa',
      dispositivoEntregado: true,
      fechaEntrega: '2026-07-02',
      cantidad: 1,
    };
    expect(analizarVentaParaGuardar(nueva, pendientes).avisos.join(' ')).not.toMatch(/Aviso de stock/i);
  });
});

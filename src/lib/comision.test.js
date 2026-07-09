import { describe, it, expect } from 'vitest';
import {
  vallaAlcanzada, faltanParaSiguiente, comisionCategoria, comisionTotal, totalCategoria,
  contarDesdeVentas, prorratearUmbrales, UMBRALES_VALLA, UMBRALES_CLIENTES,
} from './comision.js';

describe('vallaAlcanzada', () => {
  it('devuelve -1 si no llega a la 1ª valla', () => {
    expect(vallaAlcanzada(5, UMBRALES_VALLA.fijo)).toBe(-1); // <6
  });
  it('1ª valla al alcanzar el umbral', () => {
    expect(vallaAlcanzada(6, UMBRALES_VALLA.fijo)).toBe(0);
    expect(vallaAlcanzada(10, UMBRALES_VALLA.fijo)).toBe(0);
  });
  it('sube de valla al pasar cada umbral', () => {
    expect(vallaAlcanzada(11, UMBRALES_VALLA.fijo)).toBe(1);
    expect(vallaAlcanzada(16, UMBRALES_VALLA.fijo)).toBe(2);
    expect(vallaAlcanzada(23, UMBRALES_VALLA.fijo)).toBe(3);
    expect(vallaAlcanzada(100, UMBRALES_VALLA.fijo)).toBe(3); // no hay 5ª
  });
});

describe('faltanParaSiguiente', () => {
  it('indica cuántas faltan para la próxima valla', () => {
    expect(faltanParaSiguiente(4, UMBRALES_VALLA.fijo)).toEqual({ valla: 0, faltan: 2 });
    expect(faltanParaSiguiente(6, UMBRALES_VALLA.fijo)).toEqual({ valla: 1, faltan: 5 });
  });
  it('null si ya está en la última valla', () => {
    expect(faltanParaSiguiente(23, UMBRALES_VALLA.fijo)).toBeNull();
  });
});

describe('comisionCategoria (paga a la valla indicada, ya decidida externamente)', () => {
  it('paga 0 si la valla de pago es -1', () => {
    const r = comisionCategoria('fijo', { BV: 3, MV: 1, AV: 0 }, -1);
    expect(r.valla).toBe(-1);
    expect(r.importe).toBe(0);
  });

  it('aplica el precio de la valla de pago a todas las unidades (retroactivo)', () => {
    // 2ª valla (idx 1): BV=34, MV=55, AV=77
    const r = comisionCategoria('fijo', { BV: 4, MV: 4, AV: 4 }, 1);
    expect(r.detalle.BV).toEqual({ n: 4, precio: 34, importe: 136 });
    expect(r.detalle.MV).toEqual({ n: 4, precio: 55, importe: 220 });
    expect(r.detalle.AV).toEqual({ n: 4, precio: 77, importe: 308 });
    expect(r.importe).toBe(664);
  });

  it('móvil usa sus propios precios por subtipo', () => {
    // 1ª valla (idx 0): BA=19, MV=25, AV=31
    const r = comisionCategoria('movil', { BA: 13, MV: 0, AV: 0 }, 0);
    expect(r.importe).toBe(13 * 19);
  });
});

describe('prorratearUmbrales (días trabajados)', () => {
  it('reduce los umbrales al factor indicado (mín. 1)', () => {
    expect(prorratearUmbrales(UMBRALES_VALLA.fijo, 0.5)).toEqual([3, 6, 8, 12]); // 6/11/16/23 ×0.5
    expect(prorratearUmbrales(UMBRALES_VALLA.movil, 0.5)).toEqual([7, 12, 17, 21]); // 13/24/34/42 ×0.5
  });
  it('con factor 1 deja los umbrales completos', () => {
    expect(prorratearUmbrales(UMBRALES_VALLA.fijo, 1)).toEqual(UMBRALES_VALLA.fijo);
  });
  it('con la cuota reducida se alcanza valla con menos unidades', () => {
    const umbrales = prorratearUmbrales(UMBRALES_VALLA.fijo, 0.5); // 1ª valla = 3
    const valla = vallaAlcanzada(3, umbrales);
    expect(valla).toBe(0); // con 3 fijos ya clasifica (cuota media)
    const r = comisionCategoria('fijo', { BV: 3, MV: 0, AV: 0 }, valla);
    expect(r.importe).toBe(3 * 30);
  });
});

describe('comisionTotal (rappel de clientes: se paga a la valla más baja de las tres)', () => {
  it('si las tres llegan a la misma valla, se paga a esa valla', () => {
    // fijo 12 → valla 1 · móvil 24 → valla 1 · clientes 11 → valla 1
    const r = comisionTotal({ BV: 4, MV: 4, AV: 4 }, { BA: 24, MV: 0, AV: 0 }, 11);
    expect(r.vallaPago).toBe(1);
    expect(r.fijo.propia).toBe(1);
    expect(r.movil.propia).toBe(1);
    expect(r.clientes.valla).toBe(1);
    expect(r.importe).toBe(4 * 34 + 4 * 55 + 4 * 77 + 24 * 27);
  });

  it('móvil por detrás arrastra la valla de pago de fijo hacia abajo', () => {
    // fijo 12 → valla propia 1 · móvil 13 → valla propia 0 · clientes 11 → valla 1
    const r = comisionTotal({ BV: 4, MV: 4, AV: 4 }, { BA: 13, MV: 0, AV: 0 }, 11);
    expect(r.fijo.propia).toBe(1);
    expect(r.movil.propia).toBe(0);
    expect(r.vallaPago).toBe(0); // se paga como si fuera la 1ª valla, no la 2ª
    expect(r.fijo.valla).toBe(0);
    expect(r.importe).toBe(4 * 30 + 4 * 41 + 4 * 51 + 13 * 19);
  });

  it('clientes por detrás de fijo y móvil también arrastra la valla de pago', () => {
    // fijo 23 → valla propia 3 · móvil 42 → valla propia 3 · clientes 7 → valla propia 0
    const r = comisionTotal({ BV: 23, MV: 0, AV: 0 }, { BA: 42, MV: 0, AV: 0 }, 7);
    expect(r.fijo.propia).toBe(3);
    expect(r.movil.propia).toBe(3);
    expect(r.clientes.valla).toBe(0);
    expect(r.vallaPago).toBe(0);
  });

  it('si clientes no alcanza ni la 1ª valla, no se paga comisión aunque fijo/móvil sí lleguen', () => {
    const r = comisionTotal({ BV: 23, MV: 0, AV: 0 }, { BA: 42, MV: 0, AV: 0 }, 3); // clientes < 7
    expect(r.clientes.valla).toBe(-1);
    expect(r.vallaPago).toBe(-1);
    expect(r.importe).toBe(0);
  });
});

describe('totalCategoria', () => {
  it('suma las unidades de todos los subtipos', () => {
    expect(totalCategoria('fijo', { BV: 4, MV: 4, AV: 4 })).toBe(12);
    expect(totalCategoria('movil', { BA: 13, MV: 0, AV: 0 })).toBe(13);
  });
});

describe('contarDesdeVentas', () => {
  const activa = (v) => v.estado === 'activa';
  const ventas = [
    // fibra 600 (MV fijo) + porta básica activada (BA) + línea nueva ilimtotal (AV)
    { mes: 'julio', estado: 'activa', convergencia: '3P', velocidad: 'Fibra 600 MB',
      lineasMoviles: [{ tipo: 'porta', tarifa: 'basica', activa: true }, { tipo: 'nueva', tarifa: 'ilimtotal' }] },
    // fibra 1GB (AV fijo), pero pendiente → no cuenta
    { mes: 'julio', estado: 'pendiente', convergencia: '4P', velocidad: 'Fibra 1 GB', lineasMoviles: [] },
    // fibra 300 (BV) de otro mes → no cuenta
    { mes: 'junio', estado: 'activa', convergencia: '3P', velocidad: 'Fibra 300 MB', lineasMoviles: [] },
  ];

  it('cuenta fibra por velocidad y móvil por tarifa, solo activas del mes', () => {
    const { fijo, movil } = contarDesdeVentas(ventas, 'julio', activa);
    expect(fijo).toEqual({ BV: 0, MV: 1, AV: 0 });
    expect(movil).toEqual({ BA: 1, MV: 0, AV: 1 });
  });

  it('cuenta clientes nuevos activos del mes (rappel)', () => {
    const v = [
      { mes: 'julio', estado: 'activa', clienteNuevo: true, lineasMoviles: [] },
      { mes: 'julio', estado: 'activa', clienteNuevo: false, lineasMoviles: [] },
      { mes: 'julio', estado: 'pendiente', clienteNuevo: true, lineasMoviles: [] }, // no activa → no cuenta
      { mes: 'junio', estado: 'activa', clienteNuevo: true, lineasMoviles: [] }, // otro mes → no cuenta
    ];
    const { clientes } = contarDesdeVentas(v, 'julio', activa);
    expect(clientes).toBe(1);
  });

  it('la línea móvil cuenta en el mes de su porta; la fibra en el de la venta', () => {
    // Venta de JUNIO con porta que activa en JULIO
    const v = [{ mes: 'junio', estado: 'activa', convergencia: '3P', velocidad: 'Fibra 1 GB',
      lineasMoviles: [{ tipo: 'porta', tarifa: 'ilim60', activa: true, ventanaPorta: '2026-07-05T02:00' }] }];
    // En JULIO: la fibra NO (es de junio), pero la línea móvil SÍ
    const jul = contarDesdeVentas(v, 'julio', activa);
    expect(jul.fijo).toEqual({ BV: 0, MV: 0, AV: 0 });
    expect(jul.movil).toEqual({ BA: 0, MV: 1, AV: 0 });
    // En JUNIO: la fibra SÍ, la línea móvil NO (activa en julio)
    const jun = contarDesdeVentas(v, 'junio', activa);
    expect(jun.fijo).toEqual({ BV: 0, MV: 0, AV: 1 });
    expect(jun.movil).toEqual({ BA: 0, MV: 0, AV: 0 });
  });

  it('reporta líneas activas sin tarifa (o con contadores manuales) como sin clasificar', () => {
    const v = [
      // línea activa sin tarifa → no se puede clasificar
      { mes: 'julio', estado: 'activa', convergencia: '', velocidad: '',
        lineasMoviles: [{ tipo: 'nueva', tarifa: '' }] },
      // venta con contadores manuales: 2 portas activas + 1 línea nueva
      { mes: 'julio', estado: 'activa', convergencia: '3P', velocidad: 'Fibra 300 MB',
        lineasMoviles: [], portasVoz: 2, portasActivas: 2, lineasVoz: 3 },
    ];
    const r = contarDesdeVentas(v, 'julio', activa);
    expect(r.movil).toEqual({ BA: 0, MV: 0, AV: 0 });
    expect(r.sinClasificar).toBe(1 + 3); // 1 sin tarifa + (2 portas + 1 nueva) manuales
  });

  it('no cuenta portas sin activar ni canceladas por el cliente (ES M1)', () => {
    const v = [{ mes: 'julio', estado: 'activa', convergencia: '', velocidad: '',
      lineasMoviles: [
        { tipo: 'porta', tarifa: 'ilim60', activa: false },
        { tipo: 'porta', tarifa: 'basica', activa: true, incidenciaPorta: 'cancelada_m1' },
      ] }];
    const { movil } = contarDesdeVentas(v, 'julio', activa);
    expect(movil).toEqual({ BA: 0, MV: 0, AV: 0 });
  });
});

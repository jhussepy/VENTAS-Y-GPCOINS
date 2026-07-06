import { describe, it, expect } from 'vitest';
import { vallaAlcanzada, faltanParaSiguiente, comisionCategoria, comisionTotal, contarDesdeVentas, UMBRALES_VALLA } from './comision.js';

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

describe('comisionCategoria', () => {
  it('paga 0 si no se alcanza la 1ª valla', () => {
    const r = comisionCategoria('fijo', { BV: 3, MV: 1, AV: 0 }); // total 4 < 6
    expect(r.valla).toBe(-1);
    expect(r.importe).toBe(0);
  });

  it('aplica el precio de la valla alcanzada a todas las unidades (retroactivo)', () => {
    // total 12 fijo → 2ª valla (idx 1): BV=31, MV=50, AV=69
    const r = comisionCategoria('fijo', { BV: 4, MV: 4, AV: 4 });
    expect(r.valla).toBe(1);
    expect(r.detalle.BV).toEqual({ n: 4, precio: 31, importe: 124 });
    expect(r.detalle.MV).toEqual({ n: 4, precio: 50, importe: 200 });
    expect(r.detalle.AV).toEqual({ n: 4, precio: 69, importe: 276 });
    expect(r.importe).toBe(600);
  });

  it('móvil usa sus propios umbrales y precios', () => {
    // total 13 móvil → 1ª valla (idx 0): BA=16, MV=21, AV=26
    const r = comisionCategoria('movil', { BA: 13, MV: 0, AV: 0 });
    expect(r.valla).toBe(0);
    expect(r.importe).toBe(13 * 16);
  });
});

describe('comisionTotal', () => {
  it('suma fijo + móvil', () => {
    const r = comisionTotal({ BV: 4, MV: 4, AV: 4 }, { BA: 13, MV: 0, AV: 0 });
    expect(r.importe).toBe(600 + 13 * 16);
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

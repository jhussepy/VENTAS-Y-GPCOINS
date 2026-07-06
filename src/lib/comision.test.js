import { describe, it, expect } from 'vitest';
import { vallaAlcanzada, faltanParaSiguiente, comisionCategoria, comisionTotal, UMBRALES_VALLA } from './comision.js';

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

import { describe, expect, it } from 'vitest';
import { crearBackup, validarBackup } from './backup.js';
const entrada = () => ({ campo: 'ventas', registro: { id: 'venta-1', nombre: 'Ana', apellido: 'Prueba', lineasMoviles: [] }, eliminadoEn: '2026-09-21T10:30:00.000Z' });
const copia = papelera => crearBackup({ personal: { papelera } });

describe('validación de papelera dentro de las copias', () => {
  it.each([
    ['entrada vacía', {}],
    ['entrada nula', null],
    ['entrada array', []],
    ['colección desconocida', { ...entrada(), campo: 'precios' }],
    ['colección manipulada', { ...entrada(), campo: '__proto__' }],
    ['registro ausente', { ...entrada(), registro: undefined }],
    ['registro nulo', { ...entrada(), registro: null }],
    ['registro array', { ...entrada(), registro: [] }],
    ['registro sin ID', { ...entrada(), registro: {} }],
    ['ID no válido', { ...entrada(), registro: { id: 'a/b' } }],
    ['nombre que no se puede mostrar', { ...entrada(), registro: { id: 'a', nombre: {} } }],
    ['fecha ausente', { ...entrada(), eliminadoEn: undefined }],
    ['fecha numérica', { ...entrada(), eliminadoEn: 123 }],
    ['fecha inválida', { ...entrada(), eliminadoEn: 'ayer' }],
    ['día imposible', { ...entrada(), eliminadoEn: '2026-02-30T10:30:00.000Z' }],
    ['cantidad inválida', { ...entrada(), registro: { id: 'a', cantidad: -1 } }],
  ])('rechaza %s antes de restaurar', (_nombre, item) => {
    expect(() => validarBackup(copia({ x: item }))).toThrow(/papelera/i);
  });
  it.each([null, [], 'incorrecta', 23])('rechaza un contenedor de papelera inválido: %j', valor => {
    expect(() => validarBackup(copia(valor))).toThrow(/papelera/i);
  });
  it.each(['ventas', 'ventasLowi', 'agendados'])('conserva íntegra la entrada válida de %s', campo => {
    const item = { ...entrada(), campo };
    if (campo === 'agendados') delete item.registro.lineasMoviles;
    expect(validarBackup(copia({ x: item })).personal.papelera.x).toEqual(item);
  });
  it('conserva compatibilidad con copias sin papelera y con papelera vacía', () => {
    expect(validarBackup(crearBackup({})).personal).toEqual({});
    expect(validarBackup(copia({})).personal.papelera).toEqual({});
    const legacy = { ...crearBackup({}), version: 1 }; delete legacy.personal;
    expect(validarBackup(legacy).personal).toEqual({});
  });
  it('una copia legacy no puede introducir una papelera inválida', () => {
    expect(() => validarBackup({ ...copia({ x: {} }), version: 1 })).toThrow(/papelera/i);
  });
});

import { describe, expect, it } from 'vitest';
import { crearBackup, validarBackup } from './backup.js';
import { ventaVacia } from './engine.js';
import { ventaLowiVacia, resumenLineasLowi } from './lowi.js';
import { agendadoVacio } from './agendados.js';
import { lineaMovilVacia } from '../data/movil.js';

// Use the application's producers, not the validation schema, to detect omissions.
const registros = [
  ['ventas', ventaVacia], ['ventasLowi', () => ({ ...ventaLowiVacia(), ...resumenLineasLowi([]) })], ['agendados', agendadoVacio],
  ['tarifas', () => ({ id: 'tarifa-1', concepto: 'Fibra', descripcion: '600 Mb', precio: 29.9, promo: '3 meses' })],
];
const papelera = (campo, registro) => ({ campo, registro, eliminadoEn: '2026-09-22T10:00:00.000Z' });
const copia = (campo, registro, eliminada = false) => crearBackup(eliminada
  ? { personal: { papelera: { x: papelera(campo, registro) } } } : { [campo]: [registro] });
const restaurar = (campo, registro, eliminada) => validarBackup(copia(campo, registro, eliminada));

for (const [campo, crear] of registros) {
  describe(`esquema de ${campo}`, () => {
    for (const eliminada of campo === 'tarifas' ? [false] : [false, true]) {
      const origen = eliminada ? 'papelera' : 'colección activa';
      it(`conserva todos los campos actuales y los registros antiguos mínimos (${origen})`, () => {
        for (const registro of [crear(), { id: 'legacy' }]) {
          const out = restaurar(campo, registro, eliminada);
          expect(eliminada ? out.personal.papelera.x.registro : out[campo][0]).toEqual(registro);
        }
      });
      it(`rechaza objetos en cada campo producido por la aplicación (${origen})`, () => {
        for (const key of Object.keys(crear())) {
          expect(() => restaurar(campo, { ...crear(), [key]: { mal: true } }, eliminada), key).toThrow();
        }
      });
      it(`rechaza tipos incorrectos sin convertirlos ni vaciar campos (${origen})`, () => {
        for (const [key, value] of Object.entries(crear())) {
          const malos = typeof value === 'string' ? [null, [], 123, false]
            : typeof value === 'number' ? [null, [], '2', false, -1, NaN, Infinity]
              : typeof value === 'boolean' ? [null, [], 'false', 0] : [null, ''];
          for (const mal of malos) expect(() => restaurar(campo, { ...crear(), [key]: mal }, eliminada), key).toThrow();
        }
      });
      it(`rechaza campos desconocidos en lugar de omitir su validación (${origen})`, () => {
        expect(() => restaurar(campo, { ...crear(), futuro: { mal: true } }, eliminada)).toThrow(/futuro/);
      });
    }
  });
}

for (const campo of ['ventas', 'ventasLowi']) {
  describe(`líneas móviles de ${campo}`, () => {
    for (const eliminada of [false, true]) {
      it(`valida cada campo anidado; papelera=${eliminada}`, () => {
        const linea = { id: 'linea-1', ...lineaMovilVacia() };
        for (const [key, value] of Object.entries(linea)) {
          const malos = typeof value === 'boolean' ? [{}, [], null, 'false', 0] : [{}, [], null, 123, false];
          for (const mal of malos) {
            expect(() => restaurar(campo, { id: 'venta-1', lineasMoviles: [{ ...linea, [key]: mal }] }, eliminada), key).toThrow();
          }
        }
      });
      it(`conserva líneas actuales y antiguas sin ID; papelera=${eliminada}`, () => {
        const registro = { id: 'venta-1', lineasMoviles: [
          { id: 'linea-1', ...lineaMovilVacia(), numero: '600111222', ventanaPorta: '2026-09-22T02:00' },
          { tarifa: '50gb', numero: '600111333', tipo: 'porta', operador: 'Orange', activa: true },
        ] };
        const out = restaurar(campo, registro, eliminada);
        expect(eliminada ? out.personal.papelera.x.registro : out[campo][0]).toEqual(registro);
      });
      it(`rechaza elementos que no son registros; papelera=${eliminada}`, () => {
        for (const linea of [null, [], 'texto', 0, true]) {
          expect(() => restaurar(campo, { id: 'venta-1', lineasMoviles: [linea] }, eliminada)).toThrow(/lineasMoviles/);
        }
      });
    }
  });
}

it.each([
  ['ventas', { tv: { mal: true } }, /tv/],
  ['ventasLowi', { tv: { mal: true } }, /tv/],
  ['agendados', { ventaId: {} }, /ventaId/],
  ['ventas', { lineasMoviles: [{ numero: {} }] }, /lineasMoviles\[0\].numero/],
  ['ventas', { lineasMoviles: [{ futuro: {} }] }, /futuro/],
  ['ventas', { lineasMoviles: [{ id: 'repetida' }, { id: 'repetida' }] }, /duplicado/],
  ['ventas', { lineasMoviles: [{ ventanaPorta: '2026-02-30T02:00' }] }, /ventanaPorta/],
  ['ventas', { lineasMoviles: [{ ventanaPorta: '2026-09-22T99:99' }] }, /ventanaPorta/],
  ['agendados', { ultimoIntento: '2026-09-22T99:99' }, /ultimoIntento/],
  ['agendados', { hora: '25:60' }, /hora/],
  ['ventasLowi', { producto: '__proto__' }, /producto/],
  ['ventas', { marca: 'constructor' }, /marca/],
])('indica la ruta del dato inválido de %s: %j', (campo, campos, mensaje) => {
  expect(() => restaurar(campo, { id: 'a', ...campos }, false)).toThrow(mensaje);
  expect(() => restaurar(campo, { id: 'a', ...campos }, true)).toThrow(mensaje);
});
it('conserva una agenda convertida, fechas locales y textos libres', () => {
  const agenda = { ...agendadoVacio(), ventaId: 'venta-1', ultimoIntento: '2026-09-22T10:30', hora: '10:30' };
  const venta = { ...ventaVacia(), tv: 'Mi pack antiguo', velocidad: 'Fibra anterior', fechaVenta: '2026-09-22' };
  const out = validarBackup(crearBackup({ ventas: [venta], agendados: [agenda] }));
  expect(out.ventas).toEqual([venta]); expect(out.agendados).toEqual([agenda]);
});

it.each([1, 2])('conserva una copia v%s completa al exportar y volver a validar', version => {
  const datos = Object.fromEntries(registros.map(([campo, crear]) => [campo, [crear()]]));
  datos.personal = { papelera: Object.fromEntries(['ventas', 'ventasLowi', 'agendados'].map(campo => [campo, papelera(campo, datos[campo][0])])) };
  const backup = JSON.parse(JSON.stringify({ ...crearBackup(datos), version }));
  const original = structuredClone(backup);
  const out = validarBackup(backup);
  for (const campo of Object.keys(datos)) expect(out[campo]).toEqual(datos[campo]);
  expect(backup).toEqual(original);
});

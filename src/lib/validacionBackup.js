import { fechaExcel } from './parsing.js';

export const objetoPlano = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const idValido = id => typeof id === 'string' && !!id.trim() && !id.includes('/')
  && !['__proto__', 'constructor', 'prototype'].includes(id);
const camposPapelera = new Set(['ventas', 'ventasLowi', 'agendados']);

// Shared by active collections and trash: a restored record must be usable by the UI.
export function validarRegistroBackup(item, ruta) {
  if (!objetoPlano(item) || !idValido(item.id)) throw new Error(`Registro o ID inválido en ${ruta}.`);
  for (const [key, value] of Object.entries(item)) {
    if (/^fecha/.test(key) && value) {
      try { fechaExcel(null, value); } catch { throw new Error(`Fecha inválida en ${ruta}.${key}.`); }
    }
    if (['cantidad', 'cuota', 'precio', 'lineasVoz', 'portasVoz', 'portasActivas'].includes(key)
      && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) throw new Error(`Número inválido en ${ruta}.${key}.`);
    if (['nombre', 'apellido', 'dni', 'cif', 'telefono', 'email', 'direccion', 'estado', 'notas', 'observaciones'].includes(key)
      && typeof value !== 'string') throw new Error(`Texto inválido en ${ruta}.${key}.`);
  }
  if (item.lineasMoviles !== undefined && (!Array.isArray(item.lineasMoviles) || item.lineasMoviles.some(l => !objetoPlano(l)))) {
    throw new Error(`Líneas móviles inválidas en ${ruta}.`);
  }
}

export function validarEntradaPapelera(item, ruta = 'personal.papelera') {
  if (!objetoPlano(item)) throw new Error(`Entrada inválida en ${ruta}.`);
  if (!camposPapelera.has(item.campo)) throw new Error(`Colección inválida en ${ruta}.campo.`);
  validarRegistroBackup(item.registro, `${ruta}.registro`);
  const fecha = item.eliminadoEn;
  // Explicit timezone, real calendar date and valid clock time; do not accept Date coercion.
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,3})?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)$/.test(fecha)
    || !Number.isFinite(Date.parse(fecha))) throw new Error(`Fecha de eliminación inválida en ${ruta}.eliminadoEn.`);
  try { fechaExcel(null, fecha); } catch { throw new Error(`Fecha de eliminación inválida en ${ruta}.eliminadoEn.`); }
}

export function validarPapelera(papelera) {
  if (!objetoPlano(papelera)) throw new Error('Formato inválido en personal.papelera.');
  for (const [id, item] of Object.entries(papelera)) {
    if (!idValido(id)) throw new Error('ID inválido en personal.papelera.');
    validarEntradaPapelera(item, `personal.papelera.${id}`);
  }
}

// Keep damaged saved entries visible; never silently drop or repair user data.
export function inspeccionarPapelera(papelera) {
  if (papelera === undefined) return { entradas: [], error: '' };
  if (!objetoPlano(papelera)) return { entradas: [], error: 'La papelera guardada tiene un formato inválido.' };
  const entradas = Object.entries(papelera).map(([id, item]) => {
    try {
      if (!idValido(id)) throw new Error('ID inválido en personal.papelera.');
      validarEntradaPapelera(item);
      return { id, item, error: '', fecha: Date.parse(item.eliminadoEn) };
    } catch (error) { return { id, item, error: error.message, fecha: 0 }; }
  }).sort((a, b) => b.fecha - a.fecha);
  return { entradas, error: '' };
}

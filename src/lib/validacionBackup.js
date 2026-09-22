import { fechaExcel } from './parsing.js';

export const objetoPlano = value => !!value && typeof value === 'object' && !Array.isArray(value)
  && [Object.prototype, null].includes(Object.getPrototypeOf(value));
const idValido = id => typeof id === 'string' && !!id.trim() && !id.includes('/')
  && !['__proto__', 'constructor', 'prototype'].includes(id);
const camposPapelera = new Set(['ventas', 'ventasLowi', 'agendados']);

// Explicit schemas: absent optional legacy fields are allowed, but every supplied
// field must be understood. Never coerce or discard data while restoring a backup.
const campos = (tipo, nombres) => Object.fromEntries(nombres.split(' ').map(nombre => [nombre, tipo]));
const contacto = campos('texto', 'nombre apellido dni telefono');
const venta = {
  id: 'id', ...contacto,
  ...campos('texto', 'email direccion pedido idWeb velocidad tv motivoBaja notas'),
  ...campos('fecha', 'fechaVenta fechaInstalacion fechaBaja'),
  estado: 'clave', lineasMoviles: 'lineas',
};
const esquemas = {
  ventas: {
    ...venta, ...campos('texto', 'convergencia sap incidenciaEntrega'),
    ...campos('clave', 'mes marca'), fechaEntrega: 'fecha',
    ...campos('booleano', 'clienteNuevo fibraActiva dispositivoEntregado instalacionActiva'),
    ...campos('numero', 'cantidad portasVoz portasActivas lineasVoz til65 secureNet'),
  },
  ventasLowi: { ...venta, producto: 'clave', ...campos('numero', 'lineas cuota portas portasActivas') },
  agendados: {
    id: 'id', ...contacto, ...campos('texto', 'cif observaciones usuario operador'),
    estado: 'clave', fechaLlamada: 'fecha', hora: 'hora', ultimoIntento: 'fecha',
    intentos: 'numero', ventaId: 'id',
  },
  tarifas: { id: 'id', ...campos('texto', 'concepto descripcion promo'), precio: 'numero' },
};
const esquemaLinea = {
  id: 'id', ...campos('texto', 'tarifa numero tipo operador incidenciaPorta'),
  ventanaPorta: 'fecha', ...campos('booleano', 'activa principal'),
};
const fechaValida = value => {
  if (typeof value !== 'string') return false;
  if (value === '') return true;
  // ISO calendar date, optionally with a local time or explicit timezone.
  if (!/^\d{4}-\d{2}-\d{2}(?:T(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d{1,3})?)?(?:Z|[+-](?:[01]\d|2[0-3]):[0-5]\d)?)?$/.test(value)) return false;
  try { fechaExcel(null, value); return true; } catch { return false; }
};
const validadores = {
  id: idValido,
  texto: value => typeof value === 'string',
  // These fields index dictionaries in the UI: inherited property names are not values.
  clave: value => typeof value === 'string' && !Object.hasOwn(Object.prototype, value),
  numero: value => typeof value === 'number' && Number.isFinite(value) && value >= 0,
  booleano: value => typeof value === 'boolean',
  fecha: fechaValida,
  hora: value => typeof value === 'string' && (value === '' || /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)),
};

function validarCampos(item, esquema, ruta) {
  if (!objetoPlano(item)) throw new Error(`Registro inválido en ${ruta}.`);
  for (const [key, value] of Object.entries(item)) {
    const ubicacion = `${ruta}.${key}`;
    if (!Object.hasOwn(esquema, key)) throw new Error(`Campo no reconocido en ${ubicacion}.`);
    const tipo = esquema[key];
    if (tipo === 'lineas') {
      if (!Array.isArray(value)) throw new Error(`Líneas móviles inválidas en ${ubicacion}.`);
      const ids = new Set();
      for (const [index, linea] of value.entries()) {
        validarCampos(linea, esquemaLinea, `${ubicacion}[${index}]`);
        if (Object.hasOwn(linea, 'id')) {
          if (ids.has(linea.id)) throw new Error(`ID duplicado en ${ubicacion}[${index}].id.`);
          ids.add(linea.id);
        }
      }
    } else if (!validadores[tipo](value)) {
      throw new Error(`Valor inválido (${tipo}) en ${ubicacion}.`);
    }
  }
}

// The collection is explicit even for trash entries; paths are only error labels.
export function validarRegistroBackup(item, ruta, campo) {
  if (!objetoPlano(item) || !idValido(item.id)) throw new Error(`Registro o ID inválido en ${ruta}.`);
  if (!Object.hasOwn(esquemas, campo)) throw new Error(`Colección inválida en ${ruta}.`);
  validarCampos(item, esquemas[campo], ruta);
}

export function validarEntradaPapelera(item, ruta = 'personal.papelera') {
  if (!objetoPlano(item)) throw new Error(`Entrada inválida en ${ruta}.`);
  if (!camposPapelera.has(item.campo)) throw new Error(`Colección inválida en ${ruta}.campo.`);
  validarRegistroBackup(item.registro, `${ruta}.registro`, item.campo);
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

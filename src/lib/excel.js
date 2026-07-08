import { ventaVacia, mesDesdeFecha } from './engine.js';
import { ESTADOS } from './estados.js';
import { resumenLineas } from '../data/movil.js';
import { nuevoId } from './id.js';
import { PERIODO } from '../data/incentivos.js';

// Normaliza el texto de estado a una clave válida
const aEstado = (x) => {
  const s = String(x ?? '').trim().toLowerCase();
  if (ESTADOS[s]) return s;
  if (s.startsWith('activ')) return 'activa';
  if (s.startsWith('pend')) return 'pendiente';
  if (s.startsWith('baj')) return 'baja';
  if (s.startsWith('cancel')) return 'cancelada';
  return '';
};

// xlsx se carga de forma diferida (solo cuando se importa/exporta) para aligerar el bundle inicial
const cargarXLSX = () => import('xlsx');

// Cabeceras esperadas en el Excel de ventas (orden de plantilla)
export const COLUMNAS_VENTAS = [
  'nombre', 'apellido', 'dni', 'telefono', 'email', 'direccion', 'idSmart', 'idWeb',
  'fechaVenta', 'fechaInstalacion', 'convergencia',
  'velocidad', 'tv', 'clienteNuevo', 'fibraActiva', 'marca', 'sap', 'dispositivoEntregado', 'fechaEntrega', 'cantidad',
  'portasVoz', 'portasActivas', 'lineasVoz', 'til65', 'secureNet', 'estado', 'fechaBaja', 'motivoBaja', 'notas', 'lineasMoviles',
];

const aBool = (x) => {
  if (typeof x === 'boolean') return x;
  if (typeof x === 'number') return x === 1;
  const s = String(x ?? '').trim().toLowerCase();
  return ['si', 'sí', 'true', '1', 'x', 'verdadero', 'yes'].includes(s);
};

const aNum = (x) => {
  const n = Number(x);
  return Number.isFinite(n) ? n : 0;
};

// Normaliza fecha de Excel (serial o texto) a YYYY-MM-DD
const aFecha = (XLSX, x) => {
  if (!x) return '';
  if (typeof x === 'number') {
    const d = XLSX.SSF.parse_date_code(x);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = String(x).trim();
  // Formato español dd/mm/yyyy o dd-mm-yyyy
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  // Ya en ISO yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return s;
};

// Clave de deduplicación de una venta. Incluye el DNI: dos clientes distintos
// con el mismo nombre+apellido, misma fecha y sin terminal/ID Smart (venta
// solo de fibra/móvil) tendrían la misma clave sin él, y se descartaría uno
// como si fuera un duplicado del otro.
const claveVenta = (v) => [v.nombre, v.apellido, v.dni, v.fechaVenta, v.sap, v.pedido]
  .map((x) => String(x ?? '').trim().toLowerCase())
  .join('|');

export async function importarVentas(file, existentes = []) {
  const XLSX = await cargarXLSX();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const fueraDePeriodo = (fecha) => {
    if (!fecha) return false;
    return fecha < PERIODO.inicio || fecha > PERIODO.fin;
  };

  // Las claves de las ventas que ya tenemos guardadas (para no duplicar al reimportar)
  const vistas = new Set(existentes.map(claveVenta));

  let duplicadas = 0;
  let yaExistian = 0;
  let fueraPeriodo = 0;

  const todas = rows.map((r) => {
    const v = ventaVacia();
    v.nombre = String(r.nombre ?? r.Nombre ?? '').trim();
    v.apellido = String(r.apellido ?? r.Apellido ?? '').trim();
    v.dni = String(r.dni ?? r.DNI ?? r.nie ?? r.NIE ?? '').trim();
    v.telefono = String(r.telefono ?? r['telefono'] ?? r.movil ?? r['móvil'] ?? '').trim();
    v.email = String(r.email ?? r.correo ?? '').trim();
    v.direccion = String(r.direccion ?? r['dirección'] ?? '').trim();
    v.pedido = String(r.idSmart ?? r['id smart'] ?? r.pedido ?? r.contrato ?? '').trim();
    v.idWeb = String(r.idWeb ?? r['id web'] ?? '').trim();
    v.fechaVenta = aFecha(XLSX, r.fechaVenta ?? r['fecha venta'] ?? r.FechaVenta);
    v.fechaInstalacion = aFecha(XLSX, r.fechaInstalacion ?? r['fecha instalacion'] ?? r.FechaInstalacion);
    v.convergencia = String(r.convergencia ?? '').trim().toUpperCase();
    v.velocidad = String(r.velocidad ?? '').trim();
    v.tv = v.convergencia === '4P' ? String(r.tv ?? r.TV ?? '').trim() : '';
    v.clienteNuevo = aBool(r.clienteNuevo ?? r['cliente nuevo']);
    v.fibraActiva = aBool(r.fibraActiva ?? r['fibra activa']);
    v.marca = String(r.marca ?? '').trim().toLowerCase();
    v.sap = String(r.sap ?? r.SAP ?? '').trim();
    v.dispositivoEntregado = aBool(r.dispositivoEntregado ?? r['dispositivo entregado'] ?? r.entregado);
    v.fechaEntrega = aFecha(XLSX, r.fechaEntrega ?? r['fecha entrega']);
    v.cantidad = aNum(r.cantidad) || 1;
    v.portasVoz = aNum(r.portasVoz ?? r['portas voz']);
    v.portasActivas = Math.min(aNum(r.portasActivas ?? r['portas activas']), v.portasVoz);
    v.lineasVoz = aNum(r.lineasVoz ?? r['lineas voz']);
    v.til65 = aNum(r.til65 ?? r.TIL65);
    v.secureNet = aNum(r.secureNet ?? r['secure net']);
    // Estado: usa la columna 'estado' si existe; si no, dedúcelo de instalacionActiva (compatibilidad)
    const instAntigua = aBool(r.instalacionActiva ?? r['instalacion activa']);
    v.estado = aEstado(r.estado) || (instAntigua ? 'activa' : 'pendiente');
    v.instalacionActiva = v.estado === 'activa';
    v.fechaBaja = aFecha(XLSX, r.fechaBaja ?? r['fecha baja']);
    v.motivoBaja = String(r.motivoBaja ?? r['motivo baja'] ?? '').trim();
    v.notas = String(r.notas ?? '').trim();
    // Líneas móviles detalladas (JSON serializado). Si las hay, recalculamos contadores.
    try {
      const lm = r.lineasMoviles ? JSON.parse(r.lineasMoviles) : null;
      if (Array.isArray(lm) && lm.length) {
        // Aseguramos un id único por línea: sin él, editar/eliminar una línea
        // importada afectaría a todas las que compartan id undefined.
        v.lineasMoviles = lm.map((l) => ({ ...l, id: l.id || nuevoId() }));
        Object.assign(v, resumenLineas(v.lineasMoviles));
      }
    } catch { /* ignora JSON inválido */ }
    // El incentivo se paga por activaciones: el mes lo manda la instalación,
    // con la fecha de venta como respaldo si aún no hay instalación.
    v.mes = mesDesdeFecha(v.fechaInstalacion || v.fechaVenta);
    return v;
  }).filter((v) => v.nombre || v.apellido || v.sap || v.convergencia);

  const ventas = [];
  for (const v of todas) {
    const clave = claveVenta(v);
    if (vistas.has(clave)) {
      // ¿ya estaba en lo guardado o es repetida dentro del archivo?
      const enExistentes = existentes.some((e) => claveVenta(e) === clave);
      if (enExistentes) yaExistian += 1; else duplicadas += 1;
      continue;
    }
    vistas.add(clave);
    if (fueraDePeriodo(v.fechaVenta)) fueraPeriodo += 1;
    ventas.push(v);
  }

  return { ventas, duplicadas, yaExistian, fueraPeriodo };
}

export async function exportarVentas(ventas) {
  const XLSX = await cargarXLSX();
  const data = ventas.map((v) => ({
    nombre: v.nombre, apellido: v.apellido, dni: v.dni, telefono: v.telefono,
    email: v.email, direccion: v.direccion, idSmart: v.pedido, idWeb: v.idWeb,
    fechaVenta: v.fechaVenta,
    fechaInstalacion: v.fechaInstalacion, convergencia: v.convergencia,
    velocidad: v.velocidad, tv: v.tv, clienteNuevo: v.clienteNuevo ? 'SI' : 'NO',
    fibraActiva: v.fibraActiva ? 'SI' : 'NO', marca: v.marca, sap: v.sap,
    dispositivoEntregado: v.dispositivoEntregado ? 'SI' : 'NO',
    cantidad: v.cantidad, portasVoz: v.portasVoz, portasActivas: v.portasActivas || 0,
    lineasVoz: v.lineasVoz, til65: v.til65, secureNet: v.secureNet,
    estado: ESTADOS[v.estado]?.label || (v.instalacionActiva ? 'Activa' : 'Pendiente'),
    fechaBaja: v.fechaBaja || '', motivoBaja: v.motivoBaja || '', notas: v.notas,
    lineasMoviles: (v.lineasMoviles && v.lineasMoviles.length) ? JSON.stringify(v.lineasMoviles) : '',
  }));
  const ws = XLSX.utils.json_to_sheet(data, { header: COLUMNAS_VENTAS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
  XLSX.writeFile(wb, 'ventas_vodafone.xlsx');
}

export async function plantillaVentas() {
  const XLSX = await cargarXLSX();
  const ejemplo = [{
    nombre: 'Juan', apellido: 'Pérez', dni: '12345678Z', telefono: '600111222',
    email: 'juan@email.com', direccion: 'C/ Mayor 1, Madrid', idSmart: 'SM-001', idWeb: 'WEB-001',
    fechaVenta: '2026-06-15',
    fechaInstalacion: '2026-06-20', convergencia: '4P', velocidad: 'Fibra 1 GB', tv: 'Netflix Estándar',
    clienteNuevo: 'SI', fibraActiva: 'SI', marca: 'samsung', sap: '316414', dispositivoEntregado: 'SI',
    cantidad: 1, portasVoz: 2, portasActivas: 1, lineasVoz: 2, til65: 1, secureNet: 1,
    estado: 'Activa', fechaBaja: '', motivoBaja: '', notas: 'Ejemplo con terminal',
  }, {
    nombre: 'María', apellido: 'García', dni: '87654321X', telefono: '600333444',
    email: '', direccion: '', idSmart: 'SM-002', idWeb: '',
    fechaVenta: '2026-06-18',
    fechaInstalacion: '2026-06-25', convergencia: '3P', velocidad: 'Fibra 600 MB', tv: '',
    clienteNuevo: 'SI', fibraActiva: 'SI', marca: '', sap: '', dispositivoEntregado: 'NO',
    cantidad: '', portasVoz: 1, portasActivas: 0, lineasVoz: 1, til65: 0, secureNet: 0,
    estado: 'Pendiente', fechaBaja: '', motivoBaja: '', notas: 'Solo fibra y movil (sin terminal): deja marca y sap vacios',
  }];
  const ws = XLSX.utils.json_to_sheet(ejemplo, { header: COLUMNAS_VENTAS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
  XLSX.writeFile(wb, 'plantilla_ventas.xlsx');
}

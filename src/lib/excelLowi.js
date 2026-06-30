import { ventaLowiVacia, ESTADOS_LOWI, PRODUCTOS_LOWI, resumenLineasLowi } from './lowi.js';

// xlsx se carga de forma diferida para aligerar el bundle inicial
const cargarXLSX = () => import('xlsx');

// Cabeceras del Excel de ventas Lowi (orden de plantilla)
export const COLUMNAS_LOWI = [
  'nombre', 'apellido', 'dni', 'telefono', 'email', 'direccion', 'idSmart', 'idWeb',
  'fechaVenta', 'fechaInstalacion', 'producto',
  'velocidad', 'tv', 'lineas', 'cuota', 'estado', 'fechaBaja', 'motivoBaja', 'notas', 'lineasMoviles',
];

const aNum = (x) => {
  const n = Number(String(x ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

const aFecha = (XLSX, x) => {
  if (!x) return '';
  if (typeof x === 'number') {
    const d = XLSX.SSF.parse_date_code(x);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const d = new Date(x);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return String(x);
};

const aEstado = (x) => {
  const s = String(x ?? '').trim().toLowerCase();
  if (ESTADOS_LOWI[s]) return s;
  if (s.startsWith('activ')) return 'activa';
  if (s.startsWith('pend')) return 'pendiente';
  if (s.startsWith('baj')) return 'baja';
  if (s.startsWith('cancel')) return 'cancelada';
  return 'pendiente';
};

const aProducto = (x) => {
  const s = String(x ?? '').trim().toLowerCase();
  if (PRODUCTOS_LOWI[s]) return s;
  const tieneFibra = s.includes('fibra');
  const tieneMovil = s.includes('movil') || s.includes('móvil');
  if (tieneFibra && tieneMovil) return 'fibra_movil';
  if (tieneFibra) return 'fibra';
  if (tieneMovil) return 'movil';
  return '';
};

const claveLowi = (v) => [v.nombre, v.apellido, v.fechaVenta, v.pedido]
  .map((x) => String(x ?? '').trim().toLowerCase()).join('|');

export async function importarLowi(file, existentes = []) {
  const XLSX = await cargarXLSX();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const vistas = new Set(existentes.map(claveLowi));
  let duplicadas = 0;
  let yaExistian = 0;

  const todas = rows.map((r) => {
    const v = ventaLowiVacia();
    v.nombre = String(r.nombre ?? r.Nombre ?? '').trim();
    v.apellido = String(r.apellido ?? r.Apellido ?? '').trim();
    v.dni = String(r.dni ?? r.DNI ?? r.nie ?? r.NIE ?? '').trim();
    v.telefono = String(r.telefono ?? r['telefono'] ?? r.movil ?? r['móvil'] ?? '').trim();
    v.email = String(r.email ?? r.correo ?? '').trim();
    v.direccion = String(r.direccion ?? r['dirección'] ?? '').trim();
    v.pedido = String(r.idSmart ?? r['id smart'] ?? r.pedido ?? r.contrato ?? '').trim();
    v.idWeb = String(r.idWeb ?? r['id web'] ?? '').trim();
    v.fechaVenta = aFecha(XLSX, r.fechaVenta ?? r['fecha venta'] ?? r.FechaVenta);
    v.fechaInstalacion = aFecha(XLSX, r.fechaInstalacion ?? r['fecha instalacion']);
    v.producto = aProducto(r.producto);
    v.velocidad = String(r.velocidad ?? '').trim();
    v.tv = String(r.tv ?? r.TV ?? '').trim();
    v.lineas = aNum(r.lineas ?? r['lineas']);
    v.cuota = aNum(r.cuota);
    v.estado = aEstado(r.estado);
    v.fechaBaja = aFecha(XLSX, r.fechaBaja ?? r['fecha baja']);
    v.motivoBaja = String(r.motivoBaja ?? r['motivo baja'] ?? '').trim();
    v.notas = String(r.notas ?? '').trim();
    try {
      const lm = r.lineasMoviles ? JSON.parse(r.lineasMoviles) : null;
      if (Array.isArray(lm) && lm.length) { v.lineasMoviles = lm; Object.assign(v, resumenLineasLowi(lm)); }
    } catch { /* ignora JSON inválido */ }
    return v;
  }).filter((v) => v.nombre || v.apellido || v.producto);

  const ventas = [];
  for (const v of todas) {
    const k = claveLowi(v);
    if (vistas.has(k)) {
      const enExistentes = existentes.some((e) => claveLowi(e) === k);
      if (enExistentes) yaExistian += 1; else duplicadas += 1;
      continue;
    }
    vistas.add(k);
    ventas.push(v);
  }

  return { ventas, duplicadas, yaExistian };
}

export async function exportarLowi(ventas) {
  const XLSX = await cargarXLSX();
  const data = ventas.map((v) => ({
    nombre: v.nombre, apellido: v.apellido, dni: v.dni, telefono: v.telefono,
    email: v.email, direccion: v.direccion, idSmart: v.pedido, idWeb: v.idWeb,
    fechaVenta: v.fechaVenta,
    fechaInstalacion: v.fechaInstalacion, producto: PRODUCTOS_LOWI[v.producto] || v.producto,
    velocidad: v.velocidad, tv: v.tv || '', lineas: v.lineas, cuota: v.cuota,
    estado: ESTADOS_LOWI[v.estado]?.label || v.estado,
    fechaBaja: v.fechaBaja, motivoBaja: v.motivoBaja, notas: v.notas,
    lineasMoviles: (v.lineasMoviles && v.lineasMoviles.length) ? JSON.stringify(v.lineasMoviles) : '',
  }));
  const ws = XLSX.utils.json_to_sheet(data, { header: COLUMNAS_LOWI });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Lowi');
  XLSX.writeFile(wb, 'ventas_lowi.xlsx');
}

export async function plantillaLowi() {
  const XLSX = await cargarXLSX();
  const ejemplo = [{
    nombre: 'Juan', apellido: 'Pérez', dni: '12345678Z', telefono: '600111222',
    email: 'juan@email.com', direccion: 'C/ Mayor 1, Madrid', idSmart: 'SM-001', idWeb: 'WEB-001',
    fechaVenta: '2026-06-15',
    fechaInstalacion: '2026-06-20', producto: 'fibra_movil', velocidad: 'Fibra 600 Mb', tv: 'Netflix',
    lineas: 2, cuota: 35, estado: 'activa', fechaBaja: '', motivoBaja: '',
    notas: 'Ejemplo activo',
    lineasMoviles: JSON.stringify([
      { tarifa: '50gb', numero: '600111001', tipo: 'porta', operador: 'Movistar', activa: true },
      { tarifa: '10gb', numero: '600111002', tipo: 'nueva', operador: '', activa: false },
    ]),
  }, {
    nombre: 'María', apellido: 'García', dni: '87654321X', telefono: '600333444',
    email: '', direccion: '', idSmart: 'SM-002', idWeb: '',
    fechaVenta: '2026-06-18',
    fechaInstalacion: '', producto: 'fibra', velocidad: 'Fibra 300 Mb', tv: '',
    lineas: 0, cuota: 22, estado: 'pendiente', fechaBaja: '', motivoBaja: '',
    notas: 'Pendiente de instalar', lineasMoviles: '',
  }, {
    nombre: 'Luis', apellido: 'Soto', dni: '11223344A', telefono: '600555666',
    email: '', direccion: '', idSmart: 'SM-003', idWeb: '',
    fechaVenta: '2026-05-30',
    fechaInstalacion: '2026-06-05', producto: 'fibra_movil', velocidad: 'Fibra 1 Gb', tv: 'Lowi TV',
    lineas: 1, cuota: 40, estado: 'baja', fechaBaja: '2026-06-22',
    motivoBaja: 'Precio / competencia', notas: 'Se fue a la competencia',
    lineasMoviles: JSON.stringify([{ tarifa: '100gb', numero: '600111003', tipo: 'porta', operador: 'Orange', activa: true }]),
  }];
  const ws = XLSX.utils.json_to_sheet(ejemplo, { header: COLUMNAS_LOWI });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
  XLSX.writeFile(wb, 'plantilla_lowi.xlsx');
}

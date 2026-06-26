import { ventaLowiVacia, ESTADOS_LOWI, PRODUCTOS_LOWI } from './lowi.js';

// xlsx se carga de forma diferida para aligerar el bundle inicial
const cargarXLSX = () => import('xlsx');

// Cabeceras del Excel de ventas Lowi (orden de plantilla)
export const COLUMNAS_LOWI = [
  'nombre', 'apellido', 'dni', 'telefono', 'email', 'direccion', 'pedido',
  'fechaVenta', 'fechaInstalacion', 'producto',
  'velocidad', 'lineas', 'cuota', 'estado', 'fechaBaja', 'motivoBaja', 'notas',
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

const claveLowi = (v) => [v.nombre, v.apellido, v.fechaVenta]
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
    v.pedido = String(r.pedido ?? r.contrato ?? '').trim();
    v.fechaVenta = aFecha(XLSX, r.fechaVenta ?? r['fecha venta'] ?? r.FechaVenta);
    v.fechaInstalacion = aFecha(XLSX, r.fechaInstalacion ?? r['fecha instalacion']);
    v.producto = aProducto(r.producto);
    v.velocidad = String(r.velocidad ?? '').trim();
    v.lineas = aNum(r.lineas ?? r['lineas']);
    v.cuota = aNum(r.cuota);
    v.estado = aEstado(r.estado);
    v.fechaBaja = aFecha(XLSX, r.fechaBaja ?? r['fecha baja']);
    v.motivoBaja = String(r.motivoBaja ?? r['motivo baja'] ?? '').trim();
    v.notas = String(r.notas ?? '').trim();
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
    email: v.email, direccion: v.direccion, pedido: v.pedido,
    fechaVenta: v.fechaVenta,
    fechaInstalacion: v.fechaInstalacion, producto: PRODUCTOS_LOWI[v.producto] || v.producto,
    velocidad: v.velocidad, lineas: v.lineas, cuota: v.cuota,
    estado: ESTADOS_LOWI[v.estado]?.label || v.estado,
    fechaBaja: v.fechaBaja, motivoBaja: v.motivoBaja, notas: v.notas,
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
    email: 'juan@email.com', direccion: 'C/ Mayor 1, Madrid', pedido: 'LW-001',
    fechaVenta: '2026-06-15',
    fechaInstalacion: '2026-06-20', producto: 'fibra_movil', velocidad: 'Fibra 600 MB',
    lineas: 2, cuota: 35, estado: 'activa', fechaBaja: '', motivoBaja: '',
    notas: 'Ejemplo activo',
  }, {
    nombre: 'María', apellido: 'García', dni: '87654321X', telefono: '600333444',
    email: '', direccion: '', pedido: 'LW-002',
    fechaVenta: '2026-06-18',
    fechaInstalacion: '', producto: 'fibra', velocidad: 'Fibra 300 MB',
    lineas: 0, cuota: 22, estado: 'pendiente', fechaBaja: '', motivoBaja: '',
    notas: 'Pendiente de instalar',
  }, {
    nombre: 'Luis', apellido: 'Soto', dni: '11223344A', telefono: '600555666',
    email: '', direccion: '', pedido: 'LW-003',
    fechaVenta: '2026-05-30',
    fechaInstalacion: '2026-06-05', producto: 'fibra_movil', velocidad: 'Fibra 1 GB',
    lineas: 1, cuota: 40, estado: 'baja', fechaBaja: '2026-06-22',
    motivoBaja: 'Precio / competencia', notas: 'Se fue a la competencia',
  }];
  const ws = XLSX.utils.json_to_sheet(ejemplo, { header: COLUMNAS_LOWI });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
  XLSX.writeFile(wb, 'plantilla_lowi.xlsx');
}

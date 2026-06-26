import * as XLSX from 'xlsx';
import { ventaLowiVacia, ESTADOS_LOWI, PRODUCTOS_LOWI } from './lowi.js';

// Cabeceras del Excel de ventas Lowi (orden de plantilla)
export const COLUMNAS_LOWI = [
  'nombre', 'apellido', 'fechaVenta', 'fechaInstalacion', 'producto',
  'velocidad', 'lineas', 'cuota', 'estado', 'fechaBaja', 'motivoBaja', 'notas',
];

const aNum = (x) => {
  const n = Number(String(x ?? '').replace(',', '.'));
  return Number.isFinite(n) ? n : 0;
};

// Fecha de Excel (serial o texto) → YYYY-MM-DD
const aFecha = (x) => {
  if (!x) return '';
  if (typeof x === 'number') {
    const d = XLSX.SSF.parse_date_code(x);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const d = new Date(x);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return String(x);
};

// Normaliza el texto de estado a una clave válida
const aEstado = (x) => {
  const s = String(x ?? '').trim().toLowerCase();
  if (ESTADOS_LOWI[s]) return s;
  if (s.startsWith('activ')) return 'activa';
  if (s.startsWith('pend')) return 'pendiente';
  if (s.startsWith('baj')) return 'baja';
  if (s.startsWith('cancel')) return 'cancelada';
  return 'pendiente';
};

// Normaliza el producto a una clave válida
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

export function importarLowi(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });

        const clave = (v) => [v.nombre, v.apellido, v.fechaVenta]
          .map((x) => String(x ?? '').trim().toLowerCase()).join('|');

        const vistas = new Set();
        let duplicadas = 0;

        const todas = rows.map((r) => {
          const v = ventaLowiVacia();
          v.nombre = String(r.nombre ?? r.Nombre ?? '').trim();
          v.apellido = String(r.apellido ?? r.Apellido ?? '').trim();
          v.fechaVenta = aFecha(r.fechaVenta ?? r['fecha venta'] ?? r.FechaVenta);
          v.fechaInstalacion = aFecha(r.fechaInstalacion ?? r['fecha instalacion']);
          v.producto = aProducto(r.producto);
          v.velocidad = String(r.velocidad ?? '').trim();
          v.lineas = aNum(r.lineas ?? r['lineas']);
          v.cuota = aNum(r.cuota);
          v.estado = aEstado(r.estado);
          v.fechaBaja = aFecha(r.fechaBaja ?? r['fecha baja']);
          v.motivoBaja = String(r.motivoBaja ?? r['motivo baja'] ?? '').trim();
          v.notas = String(r.notas ?? '').trim();
          return v;
        }).filter((v) => v.nombre || v.apellido || v.producto);

        const ventas = [];
        for (const v of todas) {
          const k = clave(v);
          if (vistas.has(k)) { duplicadas += 1; continue; }
          vistas.add(k);
          ventas.push(v);
        }

        resolve({ ventas, duplicadas });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function exportarLowi(ventas) {
  const data = ventas.map((v) => ({
    nombre: v.nombre, apellido: v.apellido, fechaVenta: v.fechaVenta,
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

export function plantillaLowi() {
  const ejemplo = [{
    nombre: 'Juan', apellido: 'Pérez', fechaVenta: '2026-06-15',
    fechaInstalacion: '2026-06-20', producto: 'fibra_movil', velocidad: 'Fibra 600 MB',
    lineas: 2, cuota: 35, estado: 'activa', fechaBaja: '', motivoBaja: '',
    notas: 'Ejemplo activo',
  }, {
    nombre: 'María', apellido: 'García', fechaVenta: '2026-06-18',
    fechaInstalacion: '', producto: 'fibra', velocidad: 'Fibra 300 MB',
    lineas: 0, cuota: 22, estado: 'pendiente', fechaBaja: '', motivoBaja: '',
    notas: 'Pendiente de instalar',
  }, {
    nombre: 'Luis', apellido: 'Soto', fechaVenta: '2026-05-30',
    fechaInstalacion: '2026-06-05', producto: 'fibra_movil', velocidad: 'Fibra 1 GB',
    lineas: 1, cuota: 40, estado: 'baja', fechaBaja: '2026-06-22',
    motivoBaja: 'Precio / competencia', notas: 'Se fue a la competencia',
  }];
  const ws = XLSX.utils.json_to_sheet(ejemplo, { header: COLUMNAS_LOWI });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
  XLSX.writeFile(wb, 'plantilla_lowi.xlsx');
}

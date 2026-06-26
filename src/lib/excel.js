import * as XLSX from 'xlsx';
import { ventaVacia, mesDesdeFecha } from './engine.js';
import { PERIODO } from '../data/incentivos.js';

// Cabeceras esperadas en el Excel de ventas (orden de plantilla)
export const COLUMNAS_VENTAS = [
  'nombre', 'apellido', 'dni', 'telefono', 'fechaVenta', 'fechaInstalacion', 'convergencia',
  'velocidad', 'clienteNuevo', 'fibraActiva', 'marca', 'sap', 'cantidad',
  'portasVoz', 'lineasVoz', 'til65', 'secureNet', 'instalacionActiva', 'notas',
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

export function importarVentas(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        // Clave de deduplicación dentro del mismo archivo
        const claveVenta = (v) => [v.nombre, v.apellido, v.fechaVenta, v.sap]
          .map((x) => String(x ?? '').trim().toLowerCase())
          .join('|');
        // ¿La fecha cae fuera del período del incentivo (1-jun → 31-jul 2026)?
        const fueraDePeriodo = (fecha) => {
          if (!fecha) return false; // sin fecha no se considera fuera de período
          return fecha < PERIODO.inicio || fecha > PERIODO.fin;
        };

        const vistas = new Set();
        let duplicadas = 0;
        let fueraPeriodo = 0;
        const todas = rows.map((r) => {
          const v = ventaVacia();
          v.nombre = String(r.nombre ?? r.Nombre ?? '').trim();
          v.apellido = String(r.apellido ?? r.Apellido ?? '').trim();
          v.dni = String(r.dni ?? r.DNI ?? r.nie ?? r.NIE ?? '').trim();
          v.telefono = String(r.telefono ?? r['telefono'] ?? r.movil ?? r['móvil'] ?? '').trim();
          v.fechaVenta = aFecha(r.fechaVenta ?? r['fecha venta'] ?? r.FechaVenta);
          v.fechaInstalacion = aFecha(r.fechaInstalacion ?? r['fecha instalacion'] ?? r.FechaInstalacion);
          v.convergencia = String(r.convergencia ?? '').trim().toUpperCase();
          v.velocidad = String(r.velocidad ?? '').trim();
          v.clienteNuevo = aBool(r.clienteNuevo ?? r['cliente nuevo']);
          v.fibraActiva = aBool(r.fibraActiva ?? r['fibra activa']);
          v.marca = String(r.marca ?? '').trim().toLowerCase();
          v.sap = String(r.sap ?? r.SAP ?? '').trim();
          v.cantidad = aNum(r.cantidad) || 1;
          v.portasVoz = aNum(r.portasVoz ?? r['portas voz']);
          v.lineasVoz = aNum(r.lineasVoz ?? r['lineas voz']);
          v.til65 = aNum(r.til65 ?? r.TIL65);
          v.secureNet = aNum(r.secureNet ?? r['secure net']);
          v.instalacionActiva = aBool(r.instalacionActiva ?? r['instalacion activa']);
          v.notas = String(r.notas ?? '').trim();
          v.mes = mesDesdeFecha(v.fechaVenta);
          return v;
        }).filter((v) => v.nombre || v.apellido || v.sap || v.convergencia);

        // Deduplicación interna + conteo de ventas fuera de período
        const ventas = [];
        for (const v of todas) {
          const clave = claveVenta(v);
          if (vistas.has(clave)) {
            duplicadas += 1;
            continue; // se omite el duplicado dentro del mismo archivo
          }
          vistas.add(clave);
          if (fueraDePeriodo(v.fechaVenta)) fueraPeriodo += 1;
          ventas.push(v);
        }

        resolve({ ventas, duplicadas, fueraPeriodo });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function exportarVentas(ventas) {
  const data = ventas.map((v) => ({
    nombre: v.nombre, apellido: v.apellido, dni: v.dni, telefono: v.telefono,
    fechaVenta: v.fechaVenta,
    fechaInstalacion: v.fechaInstalacion, convergencia: v.convergencia,
    velocidad: v.velocidad, clienteNuevo: v.clienteNuevo ? 'SI' : 'NO',
    fibraActiva: v.fibraActiva ? 'SI' : 'NO', marca: v.marca, sap: v.sap,
    cantidad: v.cantidad, portasVoz: v.portasVoz, lineasVoz: v.lineasVoz,
    til65: v.til65, secureNet: v.secureNet,
    instalacionActiva: v.instalacionActiva ? 'SI' : 'NO', notas: v.notas,
  }));
  const ws = XLSX.utils.json_to_sheet(data, { header: COLUMNAS_VENTAS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
  XLSX.writeFile(wb, 'ventas_vodafone.xlsx');
}

export function plantillaVentas() {
  const ejemplo = [{
    nombre: 'Juan', apellido: 'Pérez', dni: '12345678A', telefono: '600111222',
    fechaVenta: '2026-06-15',
    fechaInstalacion: '2026-06-20', convergencia: '4P', velocidad: 'Fibra 1 GB',
    clienteNuevo: 'SI', fibraActiva: 'SI', marca: 'samsung', sap: '316414',
    cantidad: 1, portasVoz: 2, lineasVoz: 2, til65: 1, secureNet: 1,
    instalacionActiva: 'SI', notas: 'Ejemplo con terminal',
  }, {
    nombre: 'María', apellido: 'García', dni: '87654321B', telefono: '600333444',
    fechaVenta: '2026-06-18',
    fechaInstalacion: '2026-06-25', convergencia: '3P', velocidad: 'Fibra 600 MB',
    clienteNuevo: 'SI', fibraActiva: 'SI', marca: '', sap: '',
    cantidad: '', portasVoz: 1, lineasVoz: 1, til65: 0, secureNet: 0,
    instalacionActiva: 'SI', notas: 'Solo fibra y movil (sin terminal): deja marca y sap vacios',
  }];
  const ws = XLSX.utils.json_to_sheet(ejemplo, { header: COLUMNAS_VENTAS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
  XLSX.writeFile(wb, 'plantilla_ventas.xlsx');
}

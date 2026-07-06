// ============================================================================
//  Importación / exportación de AGENDADOS desde Excel (hoja "AGENDADOS")
//  Columnas: NOMBRE, APELLIDO, DNI, CIF o ID, NUMERO DE CONTACTO,
//  FECHA DE LLAMADA, HORA, ESTADO, OBSERVACIONES, USUARIO, VODAFONE O LOWI
// ============================================================================
import { agendadoVacio, ESTADOS_AGENDA } from './agendados.js';

const cargarXLSX = () => import('xlsx');

// Encabezados de la plantilla (en el orden esperado)
export const COLUMNAS_AGENDADOS = [
  'NOMBRE', 'APELLIDO', 'DNI', 'CIF o ID', 'NUMERO DE CONTACTO',
  'FECHA DE LLAMADA', 'HORA', 'ESTADO', 'OBSERVACIONES', 'USUARIO', 'VODAFONE O LOWI',
];

// Texto de estado del Excel → clave interna
const aEstadoAgenda = (x) => {
  const s = String(x ?? '').trim().toLowerCase();
  if (ESTADOS_AGENDA[s]) return s;
  if (s.startsWith('pend')) return 'pendiente';
  if (s.startsWith('sin')) return 'sin_respuesta';
  if (s.startsWith('reag')) return 'reagendado';
  if (s.startsWith('convert')) return 'convertido';
  if (s.startsWith('descart')) return 'descartado';
  return 'pendiente';
};

// Operador del Excel → 'vodafone' | 'lowi'
const aOperador = (x) => (String(x ?? '').trim().toLowerCase().startsWith('lowi') ? 'lowi' : 'vodafone');

// Número de serie de Excel (o texto) → YYYY-MM-DD
const aFecha = (XLSX, x) => {
  if (x === '' || x == null) return '';
  if (typeof x === 'number') {
    const d = XLSX.SSF.parse_date_code(x);
    if (d) return `${d.y}-${String(d.m).padStart(2, '0')}-${String(d.d).padStart(2, '0')}`;
  }
  const s = String(x).trim();
  const m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  return '';
};

// Hora: fracción de día de Excel (0.8333 → "20:00") o texto "HH:mm"
const aHora = (XLSX, x) => {
  if (x === '' || x == null) return '';
  if (typeof x === 'number') {
    const d = XLSX.SSF.parse_date_code(x);
    if (d) return `${String(d.H).padStart(2, '0')}:${String(d.M).padStart(2, '0')}`;
  }
  const s = String(x).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, '0')}:${m[2]}`;
  return '';
};

const limpiar = (x) => String(x ?? '').trim();

// Lee un Excel de agendados y devuelve { agendados, importadas, vacias }
export async function importarAgendados(file) {
  const XLSX = await cargarXLSX();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  // Preferimos la hoja "AGENDADOS"; si no existe, la primera
  const nombreHoja = wb.SheetNames.find((n) => n.toUpperCase() === 'AGENDADOS') || wb.SheetNames[0];
  const ws = wb.Sheets[nombreHoja];
  const filas = XLSX.utils.sheet_to_json(ws, { defval: '' });

  const agendados = [];
  let vacias = 0;
  for (const f of filas) {
    const nombre = limpiar(f['NOMBRE']);
    const apellido = limpiar(f['APELLIDO']);
    const telefono = limpiar(f['NUMERO DE CONTACTO']);
    // Fila vacía: sin nombre, apellido ni teléfono, no aporta nada
    if (!nombre && !apellido && !telefono) { vacias += 1; continue; }
    agendados.push({
      ...agendadoVacio(),
      nombre,
      apellido,
      dni: limpiar(f['DNI']),
      cif: limpiar(f['CIF o ID']),
      telefono,
      fechaLlamada: aFecha(XLSX, f['FECHA DE LLAMADA']),
      hora: aHora(XLSX, f['HORA']),
      estado: aEstadoAgenda(f['ESTADO']),
      observaciones: limpiar(f['OBSERVACIONES']),
      usuario: limpiar(f['USUARIO']),
      operador: aOperador(f['VODAFONE O LOWI']),
    });
  }
  return { agendados, importadas: agendados.length, vacias };
}

// Descarga una plantilla vacía con las cabeceras correctas
export async function plantillaAgendados() {
  const XLSX = await cargarXLSX();
  const ws = XLSX.utils.aoa_to_sheet([COLUMNAS_AGENDADOS]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'AGENDADOS');
  XLSX.writeFile(wb, 'plantilla_agendados.xlsx');
}

// Exporta los agendados actuales a Excel
export async function exportarAgendados(agendados = []) {
  const XLSX = await cargarXLSX();
  const filas = agendados.map((a) => ({
    NOMBRE: a.nombre, APELLIDO: a.apellido, DNI: a.dni, 'CIF o ID': a.cif,
    'NUMERO DE CONTACTO': a.telefono, 'FECHA DE LLAMADA': a.fechaLlamada, HORA: a.hora,
    ESTADO: ESTADOS_AGENDA[a.estado]?.label || a.estado, OBSERVACIONES: a.observaciones,
    USUARIO: a.usuario, 'VODAFONE O LOWI': a.operador === 'lowi' ? 'Lowi' : 'Vodafone',
  }));
  const ws = XLSX.utils.json_to_sheet(filas, { header: COLUMNAS_AGENDADOS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'AGENDADOS');
  XLSX.writeFile(wb, `agendados_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

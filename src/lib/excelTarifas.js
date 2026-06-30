import { nuevoId } from './id.js';

// xlsx se carga de forma diferida (coherente con excel.js / excelLowi.js)
const cargarXLSX = () => import('xlsx');

export async function importarTarifas(file) {
  const XLSX = await cargarXLSX();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  return rows.map((r) => ({
    id: nuevoId(),
    concepto: String(r.concepto ?? r.Concepto ?? r.nombre ?? '').trim(),
    descripcion: String(r.descripcion ?? r.Descripcion ?? '').trim(),
    precio: Number(r.precio ?? r.Precio ?? 0) || 0,
    promo: String(r.promo ?? '').trim(),
  })).filter((t) => t.concepto);
}

export async function plantillaTarifas() {
  const XLSX = await cargarXLSX();
  const ejemplo = [{ concepto: 'Fibra 1GB + 2 líneas', descripcion: 'Ejemplo de tarifa', precio: 49.9, promo: 'X3 meses' }];
  const ws = XLSX.utils.json_to_sheet(ejemplo, { header: ['concepto', 'descripcion', 'precio', 'promo'] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
  XLSX.writeFile(wb, 'plantilla_tarifas.xlsx');
}

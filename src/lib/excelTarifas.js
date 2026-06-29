import * as XLSX from 'xlsx';
import { nuevoId } from './id.js';

export function importarTarifas(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        const tarifas = rows.map((r) => ({
          id: nuevoId(),
          concepto: String(r.concepto ?? r.Concepto ?? r.nombre ?? '').trim(),
          descripcion: String(r.descripcion ?? r.Descripcion ?? '').trim(),
          precio: Number(r.precio ?? r.Precio ?? 0) || 0,
          promo: String(r.promo ?? '').trim(),
        })).filter((t) => t.concepto);
        resolve(tarifas);
      } catch (err) { reject(err); }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

export function plantillaTarifas() {
  const ejemplo = [{ concepto: 'Fibra 1GB + 2 líneas', descripcion: 'Ejemplo de tarifa', precio: 49.9, promo: 'X3 meses' }];
  const ws = XLSX.utils.json_to_sheet(ejemplo, { header: ['concepto', 'descripcion', 'precio', 'promo'] });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Plantilla');
  XLSX.writeFile(wb, 'plantilla_tarifas.xlsx');
}

import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { importarVentas, COLUMNAS_VENTAS } from './excel.js';

// Construye un "File"-like a partir de filas de datos, igual que exportaría xlsx
function filaAExcel(filas) {
  const ws = XLSX.utils.json_to_sheet(filas, { header: COLUMNAS_VENTAS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return { arrayBuffer: async () => buf };
}

describe('importarVentas: líneas móviles sin id', () => {
  it('asigna un id único a cada línea aunque el Excel no lo traiga (como la propia plantilla)', async () => {
    const lineasSinId = JSON.stringify([
      { tarifa: 'ilimtotal', numero: '600111111', tipo: 'porta', operador: 'Movistar', activa: true },
      { tarifa: 'basica', numero: '600222222', tipo: 'porta', operador: 'Orange', activa: false },
    ]);
    const file = filaAExcel([{ nombre: 'Ana', apellido: 'Ruiz', lineasMoviles: lineasSinId }]);
    const { ventas } = await importarVentas(file, []);

    expect(ventas).toHaveLength(1);
    const lm = ventas[0].lineasMoviles;
    expect(lm).toHaveLength(2);
    // IDs presentes, distintos entre sí, y ninguno "undefined"
    expect(lm[0].id).toBeTruthy();
    expect(lm[1].id).toBeTruthy();
    expect(lm[0].id).not.toBe(lm[1].id);
  });
});

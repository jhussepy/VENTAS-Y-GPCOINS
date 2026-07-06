import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { importarAgendados, COLUMNAS_AGENDADOS } from './excelAgendados.js';

function aExcel(filas) {
  const ws = XLSX.utils.json_to_sheet(filas, { header: COLUMNAS_AGENDADOS });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'AGENDADOS');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return { arrayBuffer: async () => buf };
}

describe('importarAgendados', () => {
  it('convierte serial de fecha y fracción de hora de Excel', async () => {
    // 46205 = 2026-07-02 ; 0.8333333 ≈ 20:00
    const file = aExcel([{
      NOMBRE: 'Andrea', APELLIDO: 'Martinez', 'CIF o ID': 'C42326853',
      'NUMERO DE CONTACTO': 618336868, 'FECHA DE LLAMADA': 46205, HORA: 0.8333333333333334,
      ESTADO: 'Pendiente', USUARIO: 'pzapataw', 'VODAFONE O LOWI': '',
    }]);
    const { agendados, importadas } = await importarAgendados(file);
    expect(importadas).toBe(1);
    const a = agendados[0];
    expect(a.nombre).toBe('Andrea');
    expect(a.cif).toBe('C42326853');
    expect(a.telefono).toBe('618336868');
    expect(a.fechaLlamada).toBe('2026-07-02');
    expect(a.hora).toBe('20:00');
    expect(a.estado).toBe('pendiente');
    expect(a.operador).toBe('vodafone');
  });

  it('omite filas totalmente vacías (sin nombre/apellido/teléfono)', async () => {
    const file = aExcel([
      { NOMBRE: 'Juan', 'NUMERO DE CONTACTO': 600111222 },
      { NOMBRE: '', APELLIDO: '', 'NUMERO DE CONTACTO': '' },
    ]);
    const { agendados, importadas, vacias } = await importarAgendados(file);
    expect(importadas).toBe(1);
    expect(agendados).toHaveLength(1);
    expect(vacias).toBe(1);
  });

  it('mapea el operador Lowi y los estados de texto', async () => {
    const file = aExcel([{
      NOMBRE: 'Ana', APELLIDO: 'Ruiz', 'NUMERO DE CONTACTO': 611,
      ESTADO: 'Sin respuesta', 'VODAFONE O LOWI': 'Lowi',
    }]);
    const { agendados } = await importarAgendados(file);
    expect(agendados[0].operador).toBe('lowi');
    expect(agendados[0].estado).toBe('sin_respuesta');
  });

  it('asigna un id único a cada agendado importado', async () => {
    const file = aExcel([
      { NOMBRE: 'A', 'NUMERO DE CONTACTO': 1 },
      { NOMBRE: 'B', 'NUMERO DE CONTACTO': 2 },
    ]);
    const { agendados } = await importarAgendados(file);
    expect(agendados[0].id).toBeTruthy();
    expect(agendados[0].id).not.toBe(agendados[1].id);
  });
});

import { afterEach, describe, expect, it, vi } from 'vitest';
const captured = vi.hoisted(() => ({ workbook: null }));
vi.mock('xlsx', async () => {
  const actual = await vi.importActual('xlsx');
  return { ...actual, writeFile: vi.fn(wb => { captured.workbook = wb; }) };
});
import * as XLSX from 'xlsx';
import { exportarVentas, importarVentas } from './excel.js';
import { exportarLowi, importarLowi } from './excelLowi.js';
import { importarTarifas } from './excelTarifas.js';
import { ventaVacia, estadoIncentivo, gpDirectos, mesesImplicados } from './engine.js';
import { contarDesdeVentas } from './comision.js';
import { resumenLowi } from './lowi.js';
import { leerBackup } from './backup.js';

afterEach(() => vi.unstubAllGlobals());

const excelFile = wb => ({ arrayBuffer: async () => XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) });
const rowsFile = rows => {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Datos');
  return excelFile(wb);
};
const base = () => ({ ...ventaVacia(), nombre: 'Prueba', apellido: 'Auditoría', fechaVenta: '2026-06-10', fechaInstalacion: '2026-06-15', mes: 'junio', estado: 'activa', instalacionActiva: true });

describe('Invariantes de datos reales con registros ficticios', () => {
  it('exportar y reimportar Vodafone conserva la entrega y el mes de los GP', async () => {
    const v = { ...base(), marca: 'samsung', sap: '316414', fechaEntrega: '2026-07-03', dispositivoEntregado: true };
    await exportarVentas([v]);
    const { ventas } = await importarVentas(excelFile(captured.workbook));
    expect({ fechaEntrega: ventas[0].fechaEntrega, gpJulio: gpDirectos(ventas, 'samsung', 'julio') })
      .toEqual({ fechaEntrega: v.fechaEntrega, gpJulio: gpDirectos([v], 'samsung', 'julio') });
  });
  it('el Excel Vodafone conserva el estado baja', async () => {
    await exportarVentas([{ ...base(), estado: 'baja', instalacionActiva: false }]);
    expect((await importarVentas(excelFile(captured.workbook))).ventas[0].estado).toBe('baja');
  });
  it('el Excel Lowi conserva el estado baja', async () => {
    await exportarLowi([{ ...base(), producto: 'fibra', cuota: 30, estado: 'baja' }]);
    expect((await importarLowi(excelFile(captured.workbook))).ventas[0].estado).toBe('baja');
  });
  it('las fechas españolas de Lowi no cambian de mes', async () => {
    const out = await importarLowi(rowsFile([{ nombre: 'Prueba', apellido: 'Auditoría', fechaVenta: '05/06/2026', producto: 'fibra' }]));
    expect(out.ventas[0].fechaVenta).toBe('2026-06-05');
  });
  it('una venta cancelada completa no suma una porta a la comisión', () => {
    const v = { ...base(), estado: 'cancelada', lineasMoviles: [{ tipo: 'porta', activa: true, tarifa: 'ilimtotal', ventanaPorta: '2026-06-20T02:00' }] };
    expect(contarDesdeVentas([v], 'junio', x => x.estado === 'activa').movil.AV).toBe(0);
  });
  it('Clientes únicos no duplica a una persona con dos pedidos', () => {
    const a = { ...base(), id: 'pedido-A', dni: 'CLIENTE-FICTICIO', clienteNuevo: true };
    const b = { ...a, id: 'pedido-B', pedido: 'otro-pedido' };
    expect(contarDesdeVentas([a, b], 'junio', x => x.estado === 'activa').clientes).toBe(1);
  });
  it('una llave de 75% no se cumple con 149 portas de 200 líneas (74,5%)', () => {
    const v = { ...base(), portasVoz: 149, portasActivas: 149, lineasVoz: 200 };
    expect(estadoIncentivo([v], 'clienteNuevo', 'junio').llaves.find(x => x.id === 'portas').cumple).toBe(false);
  });
  it('un pedido Lowi cancelado no deja portabilidades pendientes', () => {
    const v = { ...base(), estado: 'cancelada', lineasMoviles: [{ tipo: 'porta', activa: false }] };
    expect(resumenLowi([v]).portasPendientes).toBe(0);
  });
  it('el filtro de ventas incluye el mes en que el terminal aporta GP', () => {
    const v = { ...base(), marca: 'samsung', sap: '316414', dispositivoEntregado: true, fechaEntrega: '2026-07-03' };
    expect(mesesImplicados(v).has('julio')).toBe(true);
  });
  it('un JSON ajeno a la app se rechaza antes de restaurar', async () => {
    class Reader { readAsText(file) { queueMicrotask(() => this.onload({ target: { result: file.raw } })); } }
    vi.stubGlobal('FileReader', Reader);
    await expect(leerBackup({ raw: '{}' })).rejects.toThrow();
    vi.unstubAllGlobals();
  });
  it('los importes españoles en tarifas se conservan', async () => {
    const out = await importarTarifas(rowsFile([{ concepto: 'Tarifa prueba', precio: '49,90' }]));
    expect(out[0].precio).toBe(49.9);
  });
});

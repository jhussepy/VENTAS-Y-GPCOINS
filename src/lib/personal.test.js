import { describe, expect, it } from 'vitest';
import { agruparClientes } from './clientes.js';
import { fusionar, fusionarRegistros } from './mutations.js';
import { validarBackup, crearBackup } from './backup.js';
import { siguienteObjetivo, tareasDelDia, crearCierre } from './personal.js';
import { numeroLocal, fechaExcel } from './parsing.js';
import { esPropietario } from './admin.js';

describe('uso personal y recuperación', () => {
  it('exige correo propietario verificado', () => {
    const owner = { uid: 'p', email: 'jhussepy08@gmail.com', emailVerified: true };
    expect(esPropietario(owner)).toBe(true);
    expect(esPropietario({ ...owner, emailVerified: false })).toBe(false);
    expect(esPropietario({ ...owner, email: 'otro@gmail.com' })).toBe(false);
  });
  it('unifica por documento normalizado pero no mezcla homónimos sin DNI', () => {
    const clientes = agruparClientes([{ id: 'a', dni: '12.345-A' }, { id: 'b', nombre: 'Ana' }], [{ id: 'c', dni: '12345a' }, { id: 'b', nombre: 'Ana' }], []);
    expect(clientes).toHaveLength(3); expect(clientes.find(c => c.id === 'doc:12345A').registros).toHaveLength(2);
  });
  it('suma registros locales sin borrar los remotos', () => {
    expect(fusionarRegistros([{id:'remoto'}], [], [{id:'local'}]).map(v=>v.id)).toEqual(['remoto','local']);
  });
  it('combina cambios en campos distintos y detecta conflictos reales', () => {
    expect(fusionar({nombre:'Ana',telefono:'2'}, {nombre:'Ana',telefono:'1'}, {nombre:'Eva',telefono:'1'})).toEqual({nombre:'Eva',telefono:'2'});
    expect(() => fusionar({nombre:'Luz'}, {nombre:'Ana'}, {nombre:'Eva'})).toThrow('Conflicto');
  });
  it('repetir una operación confirmada no duplica registros', () => {
    expect(fusionarRegistros([{id:'a'}], [], [{id:'a'}])).toEqual([{id:'a'}]);
  });
  it('rechaza borrado si el registro fue editado en otra sesión', () => {
    expect(() => fusionarRegistros([{id:'a',nombre:'Eva'}], [{id:'a',nombre:'Ana'}], [])).toThrow('Conflicto');
  });
  it('valida copia completa, IDs y versión, sin convertir JSON ajeno en datos vacíos', () => {
    const copia = crearBackup({ ventas: [{id:'a'}] });
    expect(validarBackup(copia).ventas).toEqual([{id:'a'}]);
    expect(() => validarBackup({})).toThrow();
    expect(() => validarBackup({...copia, version:99})).toThrow();
    expect(() => validarBackup({...copia, ventas:[{id:'a'},{id:'a'}]})).toThrow();
    expect(() => validarBackup({...copia, agendados:null})).toThrow();
  });
  it('rechaza fechas imposibles y conserva importes con miles', () => {
    expect(numeroLocal('1.249,90')).toBe(1249.9);
    expect(() => numeroLocal('gratis')).toThrow();
    expect(fechaExcel(null,'05/06/2026')).toBe('2026-06-05');
    expect(() => fechaExcel(null,'31/02/2026')).toThrow();
  });
  it('prioriza llamadas vencidas e ignora pedidos cancelados', () => {
    const tasks = tareasDelDia([{id:'cancelada',estado:'cancelada',sap:'1'}], [], [{id:'a',estado:'reagendado',fechaLlamada:'2026-06-01',hora:'10:00'}], new Date('2026-06-02T12:00:00'));
    expect(tasks).toHaveLength(1); expect(tasks[0].atrasada).toBe(true);
  });
  it('simula las tres cuotas de la siguiente valla sin inventar precio', () => {
    const r = siguienteObjetivo({ fijo:{BV:5,MV:0,AV:0}, movil:{BA:12,MV:0,AV:0}, clientes:6 });
    expect(r.faltan).toEqual({fijo:1,movil:1,clientes:1}); expect(r.importe).toBe(6*30+13*19);
  });
  it('un cierre conserva datos aunque después cambie la venta original', () => {
    const venta = {id:'a',mes:'junio',estado:'activa',nombre:'Ana',lineasMoviles:[]};
    const cierre = crearCierre([venta],'junio'); venta.nombre='Eva';
    expect(cierre.registros[0].nombre).toBe('Ana'); expect(cierre.versionReglas).toBeTruthy();
  });
});

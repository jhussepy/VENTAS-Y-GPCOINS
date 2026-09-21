import { ahoraLocalISO } from './agendados.js';
import { estadoDe } from './estados.js';
import { contarDesdeVentas, comisionTotal, UMBRALES_VALLA, UMBRALES_CLIENTES, TARIFA_COMISION } from './comision.js';
import { resumenGlobal, mesesImplicados } from './engine.js';
import { isoMesCampana } from '../data/campanas.js';
import { INCENTIVOS } from '../data/incentivos.js';

export const VERSION_REGLAS = 'campana-2026-jun-sep.r2';
export function tareasDelDia(ventas, ventasLowi, agendados, ahora = new Date()) {
  const hoy = ahoraLocalISO(ahora).slice(0, 10);
  const tareas = [];
  for (const a of agendados) {
    if (!['pendiente', 'reagendado', 'sin_respuesta'].includes(a.estado)) continue;
    tareas.push({ id: `agenda:${a.id}`, tipo: 'Llamada', fecha: a.fechaLlamada, hora: a.hora || '', registro: a, pagina: 'agendados' });
  }
  for (const [pagina, registros] of [['ventas', ventas], ['lowi-ventas', ventasLowi]]) {
    for (const v of registros) {
      if (['baja', 'cancelada'].includes(estadoDe(v))) continue;
      if (estadoDe(v) === 'pendiente' && v.fechaInstalacion) tareas.push({ id: `${pagina}:${v.id}:inst`, tipo: 'Instalación', fecha: v.fechaInstalacion, registro: v, pagina });
      if (v.sap && !v.dispositivoEntregado) tareas.push({ id: `${pagina}:${v.id}:entrega`, tipo: v.incidenciaEntrega ? 'Incidencia de entrega' : 'Entrega pendiente', fecha: v.fechaEntrega || '', registro: v, pagina, urgente: !!v.incidenciaEntrega });
      for (const l of v.lineasMoviles || []) {
        if (l.tipo === 'porta' && !l.activa && l.incidenciaPorta !== 'cancelada_m1') tareas.push({ id: `${pagina}:${v.id}:${l.id}`, tipo: 'Portabilidad', fecha: l.ventanaPorta?.slice(0, 10) || '', hora: l.ventanaPorta?.slice(11, 16) || '', registro: v, pagina });
      }
    }
  }
  return tareas.map(t => ({ ...t, atrasada: !!t.fecha && `${t.fecha}T${t.hora || '23:59'}` < ahoraLocalISO(ahora), hoy: t.fecha === hoy }))
    .sort((a, b) => Number(!!b.urgente) - Number(!!a.urgente) || Number(b.atrasada) - Number(a.atrasada) || (a.fecha || '9999').localeCompare(b.fecha || '9999') || (a.hora || '').localeCompare(b.hora || ''));
}
export function ingresosMes(ventas, mes) {
  const counts = contarDesdeVentas(ventas, mes, v => estadoDe(v) === 'activa');
  return { counts, comision: comisionTotal(counts.fijo, counts.movil, counts.clientes), gp: resumenGlobal(ventas, mes) };
}
export function siguienteObjetivo(counts) {
  const actual = comisionTotal(counts.fijo, counts.movil, counts.clientes);
  const idx = actual.vallaPago + 1;
  if (idx >= 4) return null;
  const faltan = { fijo: Math.max(0, UMBRALES_VALLA.fijo[idx] - actual.fijo.total), movil: Math.max(0, UMBRALES_VALLA.movil[idx] - actual.movil.total), clientes: Math.max(0, UMBRALES_CLIENTES[idx] - counts.clientes) };
  // Conservative scenario: newly added units are Bajo valor; identity is still required.
  const escenario = comisionTotal({ ...counts.fijo, BV: counts.fijo.BV + faltan.fijo }, { ...counts.movil, BA: counts.movil.BA + faltan.movil }, counts.clientes + faltan.clientes);
  return { valla: idx + 1, faltan, importe: escenario.importe, incremento: escenario.importe - actual.importe };
}
export function crearCierre(ventas, mes, ahora = new Date()) {
  return JSON.parse(JSON.stringify({ periodo: isoMesCampana(mes), mes, cerradoEn: ahora.toISOString(), versionReglas: VERSION_REGLAS,
    reglas: { comision: TARIFA_COMISION, umbrales: UMBRALES_VALLA, clientes: UMBRALES_CLIENTES, incentivos: INCENTIVOS },
    datos: ingresosMes(ventas, mes), registros: ventas.filter(v => mesesImplicados(v).has(mes)) }));
}

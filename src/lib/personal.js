import { ahoraLocalISO } from './agendados.js';
import { estadoDe } from './estados.js';

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
        if (l.tipo === 'porta' && !l.activa && l.incidenciaPorta !== 'cancelada_m1') tasksPushPorta(tareas, pagina, v, l);
      }
    }
  }
  return tareas.map(t => ({ ...t, atrasada: !!t.fecha && `${t.fecha}T${t.hora || '23:59'}` < ahoraLocalISO(ahora), hoy: t.fecha === hoy }))
    .sort((a, b) => Number(!!b.urgente) - Number(!!a.urgente) || Number(b.atrasada) - Number(a.atrasada) || (a.fecha || '9999').localeCompare(b.fecha || '9999') || (a.hora || '').localeCompare(b.hora || ''));
}

function tasksPushPorta(tareas, pagina, venta, linea) {
  tareas.push({
    id: `${pagina}:${venta.id}:${linea.id}`,
    tipo: 'Portabilidad',
    fecha: linea.ventanaPorta?.slice(0, 10) || '',
    hora: linea.ventanaPorta?.slice(11, 16) || '',
    registro: venta,
    pagina,
  });
}

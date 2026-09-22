import { inspeccionarPapelera } from '../lib/validacionBackup.js';
import { useMemo, useState } from 'react';
import { useApp } from '../App.jsx';
import { useAhora } from '../hooks/useAhora.js';
import { tareasDelDia, ingresosMes, siguienteObjetivo } from '../lib/personal.js';
import { agruparClientes } from '../lib/clientes.js';
import { fmtSol } from '../lib/comision.js';
import { isoMesCampana } from '../data/campanas.js';
import { exportarBackup, descargarJSON } from '../lib/backup.js';
import { Card, SectionTitle, Badge, useConfirm } from '../components/ui.jsx';

export function MiDia() {
  const { ventas, ventasLowi, agendados, navegar } = useApp();
  const ahora = useAhora();
  const [filtro, setFiltro] = useState('prioridad');
  const tareas = useMemo(() => tareasDelDia(ventas, ventasLowi, agendados, ahora), [ventas, ventasLowi, agendados, ahora]);
  const visibles = tareas.filter(t => filtro === 'todas' || t.hoy || t.atrasada || t.urgente);
  return <div className="space-y-5">
    <div><h2 className="text-2xl font-bold">Mi día</h2><p className="text-fg-muted">{ahora.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })} · Vodafone y Lowi en una sola lista.</p></div>
    <div className="grid sm:grid-cols-3 gap-3">{[['Atrasadas', tareas.filter(t => t.atrasada).length], ['Para hoy', tareas.filter(t => t.hoy).length], ['Incidencias', tareas.filter(t => t.urgente).length]].map(([label, n]) => <Card key={label}><p className="text-fg-muted">{label}</p><p className="text-3xl font-bold tabnum">{n}</p></Card>)}</div>
    <Card><SectionTitle right={<select className="input w-auto" aria-label="Mostrar tareas" value={filtro} onChange={e => setFiltro(e.target.value)}><option value="prioridad">Hoy y pendientes urgentes</option><option value="todas">Todas, incluidas futuras</option></select>}>Qué atender primero</SectionTitle>
      {!visibles.length && <p className="py-8 text-fg-muted">No tienes tareas para este filtro. Puedes consultar las próximas en «Todas».</p>}
      <ul className="divide-y divide-bg-border">{visibles.map(t => <li key={t.id} className="py-4 flex flex-wrap items-center gap-3"><div className="flex-1 min-w-48"><p className="font-semibold">{t.registro.nombre} {t.registro.apellido}</p><p className="text-sm text-fg-muted">{t.tipo} · {t.fecha || 'Sin fecha'} {t.hora} · {t.registro.telefono || 'Sin teléfono'}</p></div>{t.atrasada && <Badge tone="red">Atrasada</Badge>}{t.urgente && <Badge tone="gold">Incidencia</Badge>}<button className="btn-ghost" onClick={() => navegar(t.pagina, t.registro)}>Abrir registro</button></li>)}</ul>
    </Card>
  </div>;
}

export function Clientes() {
  const { ventas, ventasLowi, agendados, personal, setPersonal, navegar, registroSeleccionado } = useApp();
  const [busqueda, setBusqueda] = useState(registroSeleccionado?.dni || registroSeleccionado?.nombre || '');
  const [seleccionado, setSeleccionado] = useState(null);
  const [nota, setNota] = useState('');
  const clientes = useMemo(() => agruparClientes(ventas, ventasLowi, agendados), [ventas, ventasLowi, agendados]);
  const lista = clientes.filter(c => `${c.nombre} ${c.dni} ${c.telefono}`.toLowerCase().includes(busqueda.toLowerCase()));
  const cliente = clientes.find(c => c.id === seleccionado);
  return <div className="space-y-5"><p className="text-fg-muted">Ficha por DNI/CIF. Los registros sin documento permanecen separados para evitar mezclar personas.</p>
    <label className="block">Buscar cliente<input className="input mt-1" value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Nombre, documento o teléfono" /></label>
    <div className="grid lg:grid-cols-2 gap-5"><Card><SectionTitle>{lista.length} clientes</SectionTitle><ul className="divide-y divide-bg-border max-h-[65vh] overflow-auto">{lista.map(c => <li key={c.id}><button className="w-full text-left py-3 px-2 hover:bg-bg-surface2 rounded" aria-pressed={c.id === seleccionado} onClick={() => { setSeleccionado(c.id); setNota(personal.notasClientes?.[c.id] || ''); }}><p className="font-semibold">{c.nombre || 'Sin nombre'}</p><p className="text-sm text-fg-muted">{c.dni || 'Sin documento'} · {c.registros.length} registros</p></button></li>)}</ul></Card>
    <Card>{cliente ? <><SectionTitle>{cliente.nombre}</SectionTitle><p>{cliente.dni} · {cliente.telefono}</p><label className="block mt-4">Notas privadas<textarea className="input mt-1" value={nota} onChange={e => setNota(e.target.value)} rows={3} /></label><button className="btn-primary mt-2" onClick={() => setPersonal(p => ({ ...p, notasClientes: { ...p.notasClientes, [cliente.id]: nota } }))}>Guardar nota</button><ol className="mt-6 space-y-4">{[...cliente.registros].sort((a,b) => (b.fechaVenta || b.fechaLlamada || '').localeCompare(a.fechaVenta || a.fechaLlamada || '')).map(r => <li key={`${r.origen}:${r.id}`} className="border-l-2 border-bg-border pl-3"><p className="font-semibold capitalize">{r.origen} · {r.estado}</p><p className="text-sm text-fg-muted">{r.fechaVenta || r.fechaLlamada || 'Sin fecha'} · {r.pedido || ''}</p><p className="text-sm">{r.notas || r.observaciones}</p><p className="text-sm text-fg-muted">{r.lineasMoviles?.length || 0} líneas</p><button className="btn-ghost mt-1" onClick={() => navegar(r.origen === 'agenda' ? 'agendados' : r.origen === 'lowi' ? 'lowi-ventas' : 'ventas', r)}>Ver y editar</button></li>)}</ol></> : <p className="py-12 text-fg-muted text-center">Selecciona un cliente para consultar sus pedidos, llamadas y notas.</p>}</Card></div>
  </div>;
}

export function Ingresos() {
  const { ventas, mes, personal, setPersonal, cerrarMes, toast } = useApp();
  const { confirmar, dialogo } = useConfirm();
  const periodo = isoMesCampana(mes);
  const actual = useMemo(() => ingresosMes(ventas, mes), [ventas, mes]);
  const cierre = personal.cierres?.[periodo];
  const datos = cierre?.datos || actual;
  const siguiente = siguienteObjetivo(actual.counts);
  const cobro = personal.cobros?.[periodo] || {};
  const [error, setError] = useState('');
  const cerrar = async () => {
    if (cierre || !await confirmar(`Se conservarán el cálculo y las reglas de ${periodo}. Los cambios posteriores en ventas no modificarán esta copia.`, { titulo: 'Cerrar mes', accion: 'Crear cierre' })) return;
    try { await cerrarMes(mes); toast('Cierre sincronizado'); } catch(e) { setError(e.message); }
  };
  const guardarCobro = e => {
    e.preventDefault(); const data = new FormData(e.currentTarget);
    setPersonal(p => ({ ...p, cobros: { ...p.cobros, [periodo]: { importe: Number(data.get('importe')), gpConfirmados: Number(data.get('gp')), fecha: data.get('fecha'), nota: data.get('nota') } } }));
    toast('Cobro anotado; consulta el estado de sincronización');
  };
  return <div className="space-y-5"><p className="text-fg-muted">Comisión Vodafone estimada en soles. GP Coins se muestran por separado; su valor no se convierte a dinero.</p>{error && <p role="alert" className="text-vf-redLight">{error}</p>}
    <div className="grid sm:grid-cols-3 gap-3"><Card><p className="text-fg-muted">{cierre ? 'Estimación al cierre' : 'Estimación actual'}</p><p className="text-3xl font-bold">{fmtSol(datos.comision.importe)}</p></Card><Card><p className="text-fg-muted">Cobrado registrado</p><p className="text-3xl font-bold">{fmtSol(cobro.importe)}</p></Card><Card><p className="text-fg-muted">Diferencia pendiente</p><p className="text-3xl font-bold">{fmtSol(datos.comision.importe - (cobro.importe || 0))}</p></Card></div>
    {actual.counts.sinClasificar > 0 && <p role="status" className="text-amber-400">Hay {actual.counts.sinClasificar} líneas sin clasificar. La estimación puede estar incompleta.</p>}
    <div className="grid lg:grid-cols-2 gap-5"><Card><SectionTitle>Registro de cobro · {periodo}</SectionTitle><form key={periodo} onSubmit={guardarCobro} className="space-y-3"><label className="block">Importe recibido (S/)<input name="importe" type="number" min="0" step="0.01" required className="input" defaultValue={cobro.importe ?? ''} /></label><label className="block">GP confirmados por ti<input name="gp" type="number" min="0" step="1" required className="input" defaultValue={cobro.gpConfirmados ?? 0} /></label><label className="block">Fecha del cobro<input name="fecha" type="date" required className="input" defaultValue={cobro.fecha || ''} /></label><label className="block">Referencia o ajustes<textarea name="nota" className="input" defaultValue={cobro.nota || ''} /></label><button className="btn-primary">Guardar cobro</button></form></Card>
    <Card><SectionTitle>GP Coins calculados</SectionTitle><p className="text-2xl font-bold">{datos.gp.gpDirectosTotal} GP directos</p><p className="text-sm text-fg-muted mb-5">Potencial de ranking: {datos.gp.gpPotencialRanking} GP. Confirmados por ti: {cobro.gpConfirmados || 0} GP.</p><SectionTitle>Próxima valla</SectionTitle>{siguiente ? <><p className="text-lg font-semibold">Valla {siguiente.valla}</p><ul className="list-disc pl-5 my-3"><li>{siguiente.faltan.fijo} unidades de fijo</li><li>{siguiente.faltan.movil} líneas móviles</li><li>{siguiente.faltan.clientes} clientes nuevos únicos</li></ul><p>Escenario: {fmtSol(siguiente.importe)} <span className="text-emerald-400">(+{fmtSol(siguiente.incremento)})</span></p><p className="text-sm text-fg-muted mt-2">Supone que las unidades añadidas son de bajo valor y alcanzas las tres cuotas del mes completo. No es una promesa de pago.</p></> : <p>Has alcanzado la última valla.</p>}<p className="text-fg-muted text-sm mt-4">La calculadora permite simular otros tipos de tarifa y días trabajados.</p></Card></div>
    <Card><SectionTitle>Cierre mensual</SectionTitle>{cierre ? <><Badge tone="green">Copia conservada · {cierre.cerradoEn.slice(0,10)}</Badge><p className="text-sm text-fg-muted my-3">Reglas {cierre.versionReglas}. Estimación actual: {fmtSol(actual.comision.importe)}; diferencia respecto al cierre: {fmtSol(actual.comision.importe - cierre.datos.comision.importe)}.</p><button className="btn-ghost" onClick={() => descargarJSON(cierre, `cierre-gpcoins-${periodo}.json`)}>Descargar cierre</button></> : <button className="btn-primary" onClick={cerrar}>Conservar cierre de {periodo}</button>}</Card>{dialogo}
  </div>;
}

export function Recuperacion() {
  const app = useApp();
  const { personal, setPersonal, restaurarPapelera, user, toast } = app;
  const { confirmar, dialogo } = useConfirm();
  const { entradas: entries, error: errorPapelera } = inspeccionarPapelera(personal.papelera);
  return <div className="space-y-5"><Card><SectionTitle>Copias y recuperación</SectionTitle><div className="flex flex-wrap gap-3"><button className="btn-primary" onClick={() => exportarBackup(app)}>Descargar copia completa</button><button className="btn-ghost" onClick={() => { const raw = localStorage.getItem(`gpcoins:recuperacion:${user.uid}`); if (raw) descargarJSON(JSON.parse(raw), 'gpcoins-antes-de-restaurar.json'); else toast('No hay una restauración previa en este navegador', 'info'); }}>Copia anterior a restauración</button></div><button className="btn-ghost mt-3" onClick={() => { const raw = localStorage.getItem(`gpcoins:pendientes-archivados:${user.uid}`); if (raw) { const archive = JSON.parse(raw); exportarBackup(archive.datos); } else toast('No hay pendientes archivados', 'info'); }}>Descargar pendientes archivados</button><p className="text-sm text-fg-muted mt-3">Las copias incluyen notas, cobros, cierres y papelera. Conserva tus exportaciones en un lugar privado.</p></Card>
    <Card>
      <SectionTitle>Papelera · {entries.length} registros</SectionTitle>
      {errorPapelera && <div role="alert" className="space-y-3">
        <p className="text-vf-redLight">{errorPapelera} Descarga el contenido para conservarlo antes de descartarlo.</p>
        <button className="btn-ghost" onClick={() => descargarJSON(personal.papelera, 'gpcoins-papelera-danada.json')}>Descargar papelera dañada</button>
        <button className="btn-ghost text-vf-redLight" onClick={async () => {
          if (await confirmar('Se descartará la papelera dañada. Las ventas y llamadas activas no se modificarán.', { peligro: true })) {
            setPersonal(p => { const next = { ...p }; delete next.papelera; return next; });
          }
        }}>Descartar papelera dañada</button>
      </div>}
      {!entries.length && !errorPapelera && <p className="text-fg-muted">Aquí aparecerán las ventas y llamadas que elimines.</p>}
      <ul className="divide-y divide-bg-border">{entries.map(({ id, item, error }) => <li key={id} className="py-3 flex flex-wrap items-center gap-3">
        <div className="flex-1">
          {error ? <><p className="font-semibold">Registro dañado</p><p role="status" className="text-sm text-vf-redLight">{error}</p></>
            : <><p className="font-semibold">{item.registro.nombre} {item.registro.apellido}</p><p className="text-sm text-fg-muted">{item.campo} · {item.eliminadoEn.slice(0,10)}</p></>}
        </div>
        <button className="btn-ghost disabled:opacity-50 disabled:cursor-not-allowed" disabled={!!error} onClick={() => {
          try { restaurarPapelera(id); toast('Registro recuperado'); } catch(e) { toast(e.message, 'error'); }
        }}>Recuperar</button>
        {error && <button className="btn-ghost" onClick={() => descargarJSON(item ?? null, 'gpcoins-registro-danado.json')}>Descargar registro dañado</button>}
        <button className="btn-ghost text-vf-redLight" onClick={async () => {
          if (await confirmar('Se eliminará este registro de la papelera de forma permanente.', { peligro: true })) {
            setPersonal(p => { const papelera = { ...p.papelera }; delete papelera[id]; return { ...p, papelera }; });
          }
        }}>Borrar definitivamente</button>
      </li>)}</ul>
    </Card>{dialogo}</div>;
}

import { useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Plus, X, Check, PhoneCall, Search, Pencil, Trash2, ArrowRightCircle, AlertTriangle, Upload, Download, FileSpreadsheet, CalendarPlus, PhoneOutgoing, Minus } from 'lucide-react';
import { useApp } from '../App.jsx';
import { agendadoVacio, ESTADOS_AGENDA, ORDEN_ESTADOS_AGENDA, estaAtrasado, esDeHoy, siguienteDiaHabil, ahoraLocalISO, fechaHoraAgendado } from '../lib/agendados.js';
import { importarAgendados, exportarAgendados, plantillaAgendados } from '../lib/excelAgendados.js';
import { Card, SectionTitle, Badge, EmptyState, useConfirm, Avatar } from '../components/ui.jsx';
import { fmtFecha } from '../lib/format.js';
import { fmtVentana } from '../lib/portabilidad.js';

const NOMBRES_MES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
// "2026-07" → "Julio 2026"
const etiquetaMes = (ym) => {
  const [a, m] = String(ym).split('-');
  const n = NOMBRES_MES[Number(m) - 1] || m;
  return `${n.charAt(0).toUpperCase()}${n.slice(1)} ${a}`;
};

// Comparadores de ordenación (las fechas vacías siempre al final)
const cmpFecha = (dir) => (a, b) => {
  const da = fechaHoraAgendado(a); const db = fechaHoraAgendado(b);
  if (!da && !db) return 0;
  if (!da) return 1;
  if (!db) return -1;
  return dir === 'desc' ? db - da : da - db;
};
const ORDENADORES = {
  fecha_asc: cmpFecha('asc'),
  fecha_desc: cmpFecha('desc'),
  intentos_desc: (a, b) => (Number(b.intentos) || 0) - (Number(a.intentos) || 0),
  cliente: (a, b) => `${a.nombre} ${a.apellido}`.trim().localeCompare(`${b.nombre} ${b.apellido}`.trim(), 'es'),
};

function FormAgendado({ inicial, onGuardar, onCancelar }) {
  const [a, setA] = useState(inicial);
  const set = (k, val) => setA((p) => ({ ...p, [k]: val }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div><label className="label">Nombre</label><input className="input" value={a.nombre} onChange={(e) => set('nombre', e.target.value)} /></div>
        <div><label className="label">Apellido</label><input className="input" value={a.apellido} onChange={(e) => set('apellido', e.target.value)} /></div>
        <div><label className="label">DNI</label><input className="input" value={a.dni} onChange={(e) => set('dni', e.target.value)} placeholder="12345678A" /></div>
        <div><label className="label">CIF o ID <span className="text-fg-muted font-normal">(opcional)</span></label><input className="input" value={a.cif} onChange={(e) => set('cif', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div><label className="label">Número de contacto</label><input type="tel" className="input" value={a.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="600 000 000" /></div>
        <div><label className="label">Fecha de llamada</label><input type="date" className="input" value={a.fechaLlamada} onChange={(e) => set('fechaLlamada', e.target.value)} /></div>
        <div><label className="label">Hora</label><input type="time" className="input" value={a.hora} onChange={(e) => set('hora', e.target.value)} /></div>
        <div>
          <label className="label">Operador</label>
          <select className="input" value={a.operador} onChange={(e) => set('operador', e.target.value)}>
            <option value="vodafone">Vodafone</option>
            <option value="lowi">Lowi</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Estado</label>
          <select className="input" value={a.estado} onChange={(e) => set('estado', e.target.value)}>
            {ORDEN_ESTADOS_AGENDA.map((k) => <option key={k} value={k}>{ESTADOS_AGENDA[k].label}</option>)}
          </select>
        </div>
        <div><label className="label">Usuario <span className="text-fg-muted font-normal">(quién agenda)</span></label><input className="input" value={a.usuario} onChange={(e) => set('usuario', e.target.value)} /></div>
      </div>

      <div className="max-w-[10rem]">
        <label className="label">Intentos de llamada</label>
        <input type="number" min="0" className="input" value={a.intentos} onChange={(e) => set('intentos', Number(e.target.value) || 0)} />
      </div>

      <div><label className="label">Observaciones</label><textarea className="input min-h-24 resize-y" value={a.observaciones} onChange={(e) => set('observaciones', e.target.value)} placeholder="Prefiere que le llamen por la tarde, oferta comentada, email del cliente..." /></div>

      <div className="flex gap-2 justify-end">
        <button className="btn-ghost" onClick={onCancelar}><X size={16} /> Cancelar</button>
        <button className="btn-primary" onClick={() => onGuardar(a)}><Check size={16} /> Guardar</button>
      </div>
    </div>
  );
}

export default function Agendados() {
  const { agendados, setAgendados, user, convertirAgendado } = useApp();
  // Nota: la conversión a venta NO marca aquí el agendado como "Convertido";
  // eso ocurre solo cuando la venta se guarda de verdad (App.finalizarConversion),
  // para no dar un falso positivo si se cancela el alta.
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroOperador, setFiltroOperador] = useState('todos');
  const [filtroMes, setFiltroMes] = useState('todos');
  const [orden, setOrden] = useState('fecha_asc');
  const [busqueda, setBusqueda] = useState('');
  const [soloHoy, setSoloHoy] = useState(false);
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const { confirmar, dialogo } = useConfirm();

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { agendados: nuevos, importadas, vacias, duplicadas } = await importarAgendados(file, agendados);
      setAgendados((prev) => [...nuevos, ...prev]);
      let text = `${importadas} agendados importados`;
      const omitidas = [];
      if (duplicadas > 0) omitidas.push(`${duplicadas} duplicados`);
      if (vacias > 0) omitidas.push(`${vacias} filas vacías`);
      if (omitidas.length) text += ` (${omitidas.join(', ')} omitidos)`;
      text += '.';
      setMsg({ tone: 'green', text });
    } catch {
      setMsg({ tone: 'red', text: 'Error al leer el Excel. Revisa el formato con la plantilla.' });
    }
    e.target.value = '';
    setTimeout(() => setMsg(null), 5000);
  };

  // Meses presentes en los agendados (por fecha de llamada), para el filtro
  const meses = useMemo(() => {
    const s = new Set(agendados.map((a) => String(a.fechaLlamada || '').slice(0, 7)).filter((x) => x.length === 7));
    return [...s].sort().reverse();
  }, [agendados]);

  const q = busqueda.trim().toLowerCase();
  const lista = useMemo(() => {
    const filtrada = agendados.filter((a) => {
      if (filtroEstado !== 'todos' && a.estado !== filtroEstado) return false;
      if (filtroOperador !== 'todos' && a.operador !== filtroOperador) return false;
      if (filtroMes !== 'todos' && String(a.fechaLlamada || '').slice(0, 7) !== filtroMes) return false;
      if (soloHoy && !esDeHoy(a)) return false;
      if (!q) return true;
      return [a.nombre, a.apellido, a.dni, a.cif, a.telefono, a.usuario, a.observaciones].some((c) => String(c || '').toLowerCase().includes(q));
    });
    return [...filtrada].sort(ORDENADORES[orden] || ORDENADORES.fecha_asc);
  }, [agendados, filtroEstado, filtroOperador, filtroMes, soloHoy, orden, q]);

  // Resumen rápido para la cabecera (pendientes / hoy / atrasados)
  const resumen = useMemo(() => ({
    pendientes: agendados.filter((a) => a.estado === 'pendiente').length,
    hoy: agendados.filter((a) => esDeHoy(a)).length,
    atrasados: agendados.filter((a) => estaAtrasado(a)).length,
  }), [agendados]);

  const guardar = (a) => {
    if (!a.nombre.trim() || !a.apellido.trim() || !a.telefono.trim()) {
      setMsg({ tone: 'red', text: 'Indica al menos nombre, apellido y número de contacto.' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }
    setAgendados((prev) => {
      const existe = prev.some((p) => p.id === a.id);
      return existe ? prev.map((p) => (p.id === a.id ? a : p)) : [a, ...prev];
    });
    setForm(false); setEditId(null);
  };

  const eliminar = async (id) => {
    const ok = await confirmar('¿Eliminar este agendado? Esta acción no se puede deshacer.', { titulo: 'Eliminar agendado', accion: 'Eliminar', peligro: true });
    if (ok) setAgendados((prev) => prev.filter((p) => p.id !== id));
  };

  // Agendados ya cerrados (convertidos + descartados): candidatos a limpiar
  const cerrados = useMemo(() => agendados.filter((a) => a.estado === 'convertido' || a.estado === 'descartado').length, [agendados]);
  const limpiarCerrados = async () => {
    if (cerrados === 0) return;
    const ok = await confirmar(
      `Se eliminarán ${cerrados} agendado(s) ya cerrados (convertidos o descartados) para liberar espacio. Esta acción no se puede deshacer.`,
      { titulo: 'Limpiar cerrados', accion: 'Limpiar', peligro: true }
    );
    if (ok) setAgendados((prev) => prev.filter((p) => p.estado !== 'convertido' && p.estado !== 'descartado'));
  };

  const cambiarEstado = (id, estado) => {
    setAgendados((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
  };

  // Registra un intento de llamada (+1). No cambia el estado: tú decides si
  // pasa a "Sin respuesta", "Reagendado", etc. desde el desplegable.
  const registrarIntento = (a) => {
    setAgendados((prev) => prev.map((p) => (p.id === a.id ? { ...p, intentos: (Number(p.intentos) || 0) + 1, ultimoIntento: ahoraLocalISO() } : p)));
  };

  // Corrige un intento marcado por error (−1). Al llegar a 0 borra la fecha
  // del último intento (ya no hay ninguno).
  const quitarIntento = (a) => {
    setAgendados((prev) => prev.map((p) => {
      if (p.id !== a.id) return p;
      const n = Math.max(0, (Number(p.intentos) || 0) - 1);
      return { ...p, intentos: n, ultimoIntento: n === 0 ? '' : p.ultimoIntento };
    }));
  };

  // Reagenda rápido al siguiente día hábil, manteniendo la hora y dejándolo
  // como pendiente (sigue siendo una llamada por hacer).
  const reagendar = (a) => {
    const nueva = siguienteDiaHabil();
    setAgendados((prev) => prev.map((p) => (p.id === a.id ? { ...p, fechaLlamada: nueva, estado: 'pendiente' } : p)));
    setMsg({ tone: 'green', text: `Reagendado a ${fmtFecha(nueva)}.` });
    setTimeout(() => setMsg(null), 3000);
  };

  // Abre el alta de Ventas (Vodafone o Lowi, según el agendado) con los datos
  // del cliente ya rellenados. Se marcará "Convertido" al guardar la venta.
  const convertir = (a) => {
    convertirAgendado(a);
  };

  const nombreCompleto = (u) => u?.displayName || u?.email || '';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            className="btn-primary"
            onClick={() => { setEditId(null); setForm(true); }}
          >
            <Plus size={16} /> Agendar llamada
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Importar Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImport} />
          <button className="btn-ghost" onClick={() => plantillaAgendados()}>
            <FileSpreadsheet size={16} /> Plantilla
          </button>
          <button className="btn-ghost" onClick={() => exportarAgendados(agendados)} disabled={!agendados.length}>
            <Download size={16} /> Exportar
          </button>
          {cerrados > 0 && (
            <button className="btn-ghost" onClick={limpiarCerrados} title="Eliminar agendados convertidos o descartados">
              <Trash2 size={16} /> Limpiar cerrados ({cerrados})
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSoloHoy((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer
                        ${soloHoy ? 'bg-vf-red text-white border-vf-red' : 'bg-bg-surface2 text-fg-muted border-bg-border hover:text-fg'}`}
            aria-pressed={soloHoy}
          >
            Solo hoy ({resumen.hoy})
          </button>
          <select className="input w-auto" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)} title="Filtrar por mes de llamada">
            <option value="todos">Todos los meses</option>
            {meses.map((m) => <option key={m} value={m}>{etiquetaMes(m)}</option>)}
          </select>
          <select className="input w-auto" value={filtroOperador} onChange={(e) => setFiltroOperador(e.target.value)}>
            <option value="todos">Vodafone + Lowi</option>
            <option value="vodafone">Vodafone</option>
            <option value="lowi">Lowi</option>
          </select>
          <select className="input w-auto" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            {ORDEN_ESTADOS_AGENDA.map((k) => <option key={k} value={k}>{ESTADOS_AGENDA[k].label}</option>)}
          </select>
          <select className="input w-auto" value={orden} onChange={(e) => setOrden(e.target.value)} title="Ordenar">
            <option value="fecha_asc">Fecha ↑ (más próxima)</option>
            <option value="fecha_desc">Fecha ↓ (más lejana)</option>
            <option value="intentos_desc">Más intentos primero</option>
            <option value="cliente">Cliente (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="stagger grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-bg-border bg-bg-surface p-4">
          <p className="text-xs text-fg-muted">Pendientes</p>
          <p className="text-2xl font-bold tabnum text-gp-gold mt-0.5">{resumen.pendientes}</p>
        </div>
        <div className="rounded-xl border border-bg-border bg-bg-surface p-4">
          <p className="text-xs text-fg-muted">Para hoy</p>
          <p className="text-2xl font-bold tabnum text-fg mt-0.5">{resumen.hoy}</p>
        </div>
        <div className={`rounded-xl border p-4 ${resumen.atrasados > 0 ? 'border-vf-red/40 bg-vf-red/[0.05]' : 'border-bg-border bg-bg-surface'}`}>
          <p className="text-xs text-fg-muted flex items-center gap-1">{resumen.atrasados > 0 && <AlertTriangle size={12} className="text-vf-redLight" />} Atrasados</p>
          <p className={`text-2xl font-bold tabnum mt-0.5 ${resumen.atrasados > 0 ? 'text-vf-redLight' : 'text-fg'}`}>{resumen.atrasados}</p>
        </div>
      </div>

      {msg && <div className={`text-sm px-4 py-2 rounded-lg ${msg.tone === 'green' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-vf-red/15 text-vf-redLight'}`} role="alert">{msg.text}</div>}

      {form && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 overflow-y-auto fade-in"
          onClick={() => { setForm(false); setEditId(null); }}
        >
          <div
            className="card w-full max-w-3xl p-5 my-4 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-fg tracking-tight">{editId ? 'Editar agendado' : 'Agendar nueva llamada'}</h2>
              <button onClick={() => { setForm(false); setEditId(null); }} className="p-1.5 rounded-lg hover:bg-bg-surface2 text-fg-muted hover:text-fg cursor-pointer" aria-label="Cerrar"><X size={18} /></button>
            </div>
            <FormAgendado
              inicial={editId
                ? agendados.find((a) => a.id === editId) ?? agendadoVacio()
                : { ...agendadoVacio(), usuario: nombreCompleto(user) }}
              onGuardar={guardar}
              onCancelar={() => { setForm(false); setEditId(null); }}
            />
          </div>
        </div>,
        document.body,
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-bg-border flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-fg">Llamadas agendadas</h2>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
              <input
                className="input pl-9 w-56"
                placeholder="Buscar cliente, DNI, teléfono…"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <Badge tone="neutral">{lista.length} registros</Badge>
          </div>
        </div>
        {lista.length === 0 ? (
          <EmptyState icon={PhoneCall} title="Sin llamadas agendadas" hint="Añade un cliente que quiera que le llames otro día para no perder el seguimiento." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-fg-muted border-b border-bg-border bg-bg-surface2/60 sticky top-0 backdrop-blur z-10">
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">Contacto</th>
                  <th className="px-4 py-3 font-semibold">Fecha de llamada</th>
                  <th className="px-4 py-3 font-semibold">Operador</th>
                  <th className="px-4 py-3 font-semibold text-center">Intentos</th>
                  <th className="px-4 py-3 font-semibold">Usuario</th>
                  <th className="px-4 py-3 font-semibold">Observaciones</th>
                  <th className="px-4 py-3 font-semibold text-center">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((a) => {
                  const atrasado = estaAtrasado(a);
                  return (
                    <tr key={a.id} className={`border-b border-bg-border/60 odd:bg-bg-surface2/25 hover:bg-bg-surface2/60 transition-colors ${atrasado ? 'bg-vf-red/[0.04]' : ''}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar nombre={a.nombre} apellido={a.apellido} />
                          <div className="min-w-0">
                            <div className="font-medium text-fg">{a.nombre} {a.apellido}</div>
                            {(a.dni || a.cif) && (
                              <div className="text-[11px] text-fg-muted mt-0.5">
                                {[a.dni, a.cif].filter(Boolean).join(' · ')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-soft tabnum">{a.telefono || '—'}</td>
                      <td className="px-4 py-3 text-fg-soft tabnum">
                        {a.fechaLlamada ? `${fmtFecha(a.fechaLlamada)}${a.hora ? ` · ${a.hora}` : ''}` : '—'}
                        {atrasado && (
                          <span className="flex items-center gap-1 mt-1 text-[11px] text-vf-redLight font-medium">
                            <AlertTriangle size={11} /> Atrasado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <Badge tone={a.operador === 'lowi' ? 'neutral' : 'red'}>{a.operador === 'lowi' ? 'Lowi' : 'Vodafone'}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {Number(a.intentos) > 0 && (
                            <button
                              onClick={() => quitarIntento(a)}
                              className="p-1 rounded-md hover:bg-vf-red/15 text-fg-muted hover:text-vf-redLight cursor-pointer"
                              aria-label="Quitar un intento"
                              title="Quitar un intento (−1)"
                            >
                              <Minus size={13} />
                            </button>
                          )}
                          <span className={`tabnum font-semibold ${Number(a.intentos) >= 3 ? 'text-vf-redLight' : 'text-fg-soft'}`}>{Number(a.intentos) || 0}</span>
                          <button
                            onClick={() => registrarIntento(a)}
                            className="p-1 rounded-md hover:bg-sky-500/15 text-fg-muted hover:text-sky-400 cursor-pointer"
                            aria-label="Registrar intento de llamada"
                            title="Registrar intento de llamada (+1)"
                          >
                            <PhoneOutgoing size={14} />
                          </button>
                        </div>
                        {a.ultimoIntento && (
                          <div className="text-[10px] text-fg-muted text-center mt-0.5 tabnum" title={`Último intento: ${fmtVentana(a.ultimoIntento)}`}>
                            {fmtVentana(a.ultimoIntento)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-fg-muted">{a.usuario || '—'}</td>
                      <td className="px-4 py-3 text-fg-soft max-w-xs truncate" title={a.observaciones}>{a.observaciones || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 justify-center">
                          <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: ESTADOS_AGENDA[a.estado]?.color }} aria-hidden="true" />
                          <select
                            value={a.estado}
                            onChange={(e) => cambiarEstado(a.id, e.target.value)}
                            className="bg-bg-surface2 border border-bg-border rounded-md px-2 py-1 text-xs text-fg cursor-pointer focus:outline-none focus:ring-1 focus:ring-vf-red"
                            title="Cambiar estado"
                          >
                            {ORDEN_ESTADOS_AGENDA.map((k) => <option key={k} value={k}>{ESTADOS_AGENDA[k].label}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button className="p-2 rounded-lg hover:bg-emerald-500/15 text-fg-muted hover:text-emerald-400 cursor-pointer" onClick={() => convertir(a)} aria-label="Convertir en venta" title="Convertir en venta"><ArrowRightCircle size={15} /></button>
                          <button className="p-2 rounded-lg hover:bg-sky-500/15 text-fg-muted hover:text-sky-400 cursor-pointer" onClick={() => reagendar(a)} aria-label="Reagendar al siguiente día hábil" title="Reagendar al siguiente día hábil"><CalendarPlus size={15} /></button>
                          <button className="p-2 rounded-lg hover:bg-bg-border text-fg-muted hover:text-fg cursor-pointer" onClick={() => { setEditId(a.id); setForm(true); }} aria-label="Editar"><Pencil size={15} /></button>
                          <button className="p-2 rounded-lg hover:bg-vf-red/20 text-fg-muted hover:text-vf-redLight cursor-pointer" onClick={() => eliminar(a.id)} aria-label="Eliminar"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      {dialogo}
    </div>
  );
}

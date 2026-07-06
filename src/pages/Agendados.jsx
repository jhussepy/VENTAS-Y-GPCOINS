import { useMemo, useRef, useState } from 'react';
import { Plus, X, Check, PhoneCall, Search, Pencil, Trash2, ArrowRightCircle, AlertTriangle, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../App.jsx';
import { agendadoVacio, ESTADOS_AGENDA, ORDEN_ESTADOS_AGENDA, estaAtrasado, ordenarAgendados } from '../lib/agendados.js';
import { importarAgendados, exportarAgendados, plantillaAgendados } from '../lib/excelAgendados.js';
import { Card, SectionTitle, Badge, EmptyState, useConfirm, Avatar } from '../components/ui.jsx';
import { fmtFecha } from '../lib/format.js';

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

      <div><label className="label">Observaciones</label><input className="input" value={a.observaciones} onChange={(e) => set('observaciones', e.target.value)} placeholder="Prefiere que le llamen por la tarde, quiere comparar precio con..." /></div>

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
  const [busqueda, setBusqueda] = useState('');
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const { confirmar, dialogo } = useConfirm();

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { agendados: nuevos, importadas, vacias } = await importarAgendados(file);
      setAgendados((prev) => [...nuevos, ...prev]);
      let text = `${importadas} agendados importados`;
      if (vacias > 0) text += ` (${vacias} filas vacías omitidas)`;
      text += '.';
      setMsg({ tone: 'green', text });
    } catch {
      setMsg({ tone: 'red', text: 'Error al leer el Excel. Revisa el formato con la plantilla.' });
    }
    e.target.value = '';
    setTimeout(() => setMsg(null), 5000);
  };

  const q = busqueda.trim().toLowerCase();
  const lista = useMemo(() => {
    const filtrada = agendados.filter((a) => {
      if (filtroEstado !== 'todos' && a.estado !== filtroEstado) return false;
      if (filtroOperador !== 'todos' && a.operador !== filtroOperador) return false;
      if (!q) return true;
      return [a.nombre, a.apellido, a.dni, a.cif, a.telefono].some((c) => String(c || '').toLowerCase().includes(q));
    });
    return ordenarAgendados(filtrada);
  }, [agendados, filtroEstado, filtroOperador, q]);

  const atrasados = useMemo(() => agendados.filter((a) => estaAtrasado(a)).length, [agendados]);

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

  const cambiarEstado = (id, estado) => {
    setAgendados((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
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
          {atrasados > 0 && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-vf-red/10 text-vf-redLight border border-vf-red/30">
              <AlertTriangle size={14} /> {atrasados} atrasado{atrasados === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={filtroOperador} onChange={(e) => setFiltroOperador(e.target.value)}>
            <option value="todos">Vodafone + Lowi</option>
            <option value="vodafone">Vodafone</option>
            <option value="lowi">Lowi</option>
          </select>
          <select className="input w-auto" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            {ORDEN_ESTADOS_AGENDA.map((k) => <option key={k} value={k}>{ESTADOS_AGENDA[k].label}</option>)}
          </select>
        </div>
      </div>

      {msg && <div className={`text-sm px-4 py-2 rounded-lg ${msg.tone === 'green' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-vf-red/15 text-vf-redLight'}`} role="alert">{msg.text}</div>}

      {form && (
        <Card>
          <SectionTitle>{editId ? 'Editar agendado' : 'Agendar nueva llamada'}</SectionTitle>
          <FormAgendado
            inicial={editId
              ? agendados.find((a) => a.id === editId) ?? agendadoVacio()
              : { ...agendadoVacio(), usuario: nombreCompleto(user) }}
            onGuardar={guardar}
            onCancelar={() => { setForm(false); setEditId(null); }}
          />
        </Card>
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

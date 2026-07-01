import { useState, useRef, useMemo } from 'react';
import {
  Plus, Upload, Download, FileSpreadsheet, Trash2, Pencil, X, Check, Wifi, Search, Tv,
} from 'lucide-react';
import { useApp } from '../App.jsx';
import {
  ventaLowiVacia, ESTADOS_LOWI, ORDEN_ESTADOS, PRODUCTOS_LOWI,
  VELOCIDADES_LOWI, MOTIVOS_BAJA, mesLowi, etiquetaMesLowi, resumenLineasLowi,
  TARIFAS_MOVIL_LOWI, TV_LOWI,
} from '../lib/lowi.js';
import { OPERADORES_PORTA, lineaMovilVacia, INCIDENCIAS_PORTA } from '../data/movil.js';
import { nuevoId } from '../lib/id.js';
import { importarLowi, exportarLowi, plantillaLowi } from '../lib/excelLowi.js';
import { avisosContacto } from '../lib/validacion.js';
import { Card, SectionTitle, Badge, EmptyState } from '../components/ui.jsx';
import { ventanaRelevante, fmtVentana, TONO_VENTANA, ETIQUETA_VENTANA } from '../lib/portabilidad.js';
import { fmtFecha, fmtEur } from '../lib/format.js';

function FormLowi({ inicial, onGuardar, onCancelar }) {
  const [v, setV] = useState(inicial);
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));
  const esBaja = v.estado === 'baja' || v.estado === 'cancelada';
  const llevaFibra = v.producto === 'fibra' || v.producto === 'fibra_movil';
  const llevaMovil = v.producto === 'movil' || v.producto === 'fibra_movil';
  const avisosDatos = avisosContacto(v);

  // Líneas móviles detalladas (igual que Vodafone, sin GP/terminales)
  const lineas = v.lineasMoviles || [];
  const tieneLineas = lineas.length > 0;
  // Siempre recalculamos (incluso a 0 si se borran todas las líneas): si no,
  // queda un contador "X líneas" fantasma de líneas ya eliminadas.
  const setLineas = (lm) => setV((p) => ({ ...p, lineasMoviles: lm, ...resumenLineasLowi(lm) }));
  const addLinea = () => setLineas([...lineas, { id: nuevoId(), ...lineaMovilVacia() }]);
  const updLinea = (id, k, val) => setLineas(lineas.map((l) => {
    if (l.id !== id) return l;
    const nl = { ...l, [k]: val };
    if (k === 'tipo' && val === 'nueva') { nl.operador = ''; nl.activa = false; nl.ventanaPorta = ''; nl.incidenciaPorta = ''; }
    return nl;
  }));
  const delLinea = (id) => setLineas(lineas.filter((l) => l.id !== id));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div><label className="label">Nombre</label><input className="input" value={v.nombre} onChange={(e) => set('nombre', e.target.value)} /></div>
        <div><label className="label">Apellido</label><input className="input" value={v.apellido} onChange={(e) => set('apellido', e.target.value)} /></div>
        <div><label className="label">DNI / NIE</label><input className="input" value={v.dni} onChange={(e) => set('dni', e.target.value)} placeholder="12345678A" /></div>
        <div><label className="label">Teléfono de contacto</label><input type="tel" className="input" value={v.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="600 000 000" /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div><label className="label">Fecha de venta</label><input type="date" className="input" value={v.fechaVenta} onChange={(e) => set('fechaVenta', e.target.value)} /></div>
        <div><label className="label">Fecha de instalación</label><input type="date" className="input" value={v.fechaInstalacion} onChange={(e) => set('fechaInstalacion', e.target.value)} /></div>
        <div><label className="label">Email <span className="text-fg-muted font-normal">(opcional)</span></label><input type="email" className="input" value={v.email} onChange={(e) => set('email', e.target.value)} placeholder="cliente@email.com" /></div>
        <div><label className="label">ID Smart <span className="text-fg-muted font-normal">(opcional)</span></label><input className="input" value={v.pedido} onChange={(e) => set('pedido', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div><label className="label">ID Web <span className="text-fg-muted font-normal">(opcional)</span></label><input className="input" value={v.idWeb} onChange={(e) => set('idWeb', e.target.value)} /></div>
      </div>

      <div><label className="label">Dirección de instalación <span className="text-fg-muted font-normal">(opcional)</span></label><input className="input" value={v.direccion} onChange={(e) => set('direccion', e.target.value)} /></div>

      {avisosDatos.length > 0 && (
        <p className="text-xs text-amber-400 -mt-1">{avisosDatos.join(' ')}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="label">Producto</label>
          <select className="input" value={v.producto} onChange={(e) => set('producto', e.target.value)}>
            <option value="">—</option>
            {Object.entries(PRODUCTOS_LOWI).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Velocidad fibra</label>
          <select className="input" value={v.velocidad} onChange={(e) => set('velocidad', e.target.value)} disabled={!llevaFibra}>
            <option value="">{llevaFibra ? '—' : 'Sin fibra'}</option>
            {VELOCIDADES_LOWI.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Líneas móvil</label>
          {tieneLineas ? (
            <div className="input flex items-center text-fg-muted">{v.lineas} (desde el detalle)</div>
          ) : (
            <input type="number" min="0" className="input disabled:opacity-60" value={v.lineas} disabled={!llevaMovil} onChange={(e) => set('lineas', (Number(e.target.value) || 0))} />
          )}
        </div>
        <div>
          <label className="label">Cuota mensual (€)</label>
          <input type="number" min="0" step="0.01" className="input" value={v.cuota} onChange={(e) => set('cuota', (Number(e.target.value) || 0))} />
        </div>
        <div>
          <label className="label">TV <span className="text-fg-muted font-normal">(opcional)</span></label>
          <select className="input" value={v.tv} onChange={(e) => set('tv', e.target.value)}>
            <option value="">Sin TV</option>
            {TV_LOWI.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Líneas móviles detalladas */}
      {llevaMovil && (
        <div className="border border-sky-500/30 bg-sky-500/[0.04] rounded-lg p-3 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium text-fg flex items-center gap-2">
              Líneas móviles {tieneLineas && <span className="text-fg-muted font-normal">({lineas.length})</span>}
              <Badge tone="neutral">Recomendado</Badge>
            </span>
            <button type="button" className="btn-lowi text-xs py-1" onClick={addLinea}><Plus size={14} /> Añadir línea</button>
          </div>
          <p className="text-[11px] text-sky-300/90 -mt-1">
            Registra cada línea con su tarifa: los contadores se rellenan solos y el desglose por tarifa del panel se calcula automáticamente.
          </p>
          {tieneLineas ? (
            <div className="space-y-2">
              {lineas.map((l, i) => (
                <div key={l.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-bg-surface2/50 rounded-lg p-2">
                  <div className="sm:col-span-3">
                    <label className="label">Tarifa línea {i + 1}</label>
                    <select className="input" value={l.tarifa} onChange={(e) => updLinea(l.id, 'tarifa', e.target.value)}>
                      <option value="">—</option>
                      {TARIFAS_MOVIL_LOWI.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <label className="label">Número</label>
                    <input type="tel" className="input" value={l.numero} onChange={(e) => updLinea(l.id, 'numero', e.target.value)} placeholder="6XX XXX XXX" />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="label">Tipo</label>
                    <select className="input" value={l.tipo} onChange={(e) => updLinea(l.id, 'tipo', e.target.value)}>
                      <option value="nueva">Nueva</option>
                      <option value="porta">Porta</option>
                    </select>
                  </div>
                  {l.tipo === 'porta' ? (
                    <>
                      <div className="sm:col-span-3">
                        <label className="label">Operador origen</label>
                        <select className="input" value={l.operador} onChange={(e) => updLinea(l.id, 'operador', e.target.value)}>
                          <option value="">—</option>
                          {OPERADORES_PORTA.map((o) => <option key={o} value={o}>{o}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-1 flex items-center justify-between gap-1 pb-2">
                        <label className="flex items-center gap-1 text-xs text-fg-soft cursor-pointer" title="Porta ya activada">
                          <input type="checkbox" checked={l.activa} onChange={(e) => updLinea(l.id, 'activa', e.target.checked)} className="accent-emerald-500 w-4 h-4" />
                          Act.
                        </label>
                        <button type="button" onClick={() => delLinea(l.id)} className="text-fg-muted hover:text-vf-redLight" aria-label="Quitar línea"><X size={15} /></button>
                      </div>
                      <div className="sm:col-span-3">
                        <label className="label">Fecha ventana portabilidad</label>
                        <input type="datetime-local" className="input" value={l.ventanaPorta || ''} onChange={(e) => updLinea(l.id, 'ventanaPorta', e.target.value)} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="label">Incidencia porta</label>
                        <select className="input" value={l.incidenciaPorta || ''} onChange={(e) => updLinea(l.id, 'incidenciaPorta', e.target.value)}>
                          {INCIDENCIAS_PORTA.map((i) => <option key={i.id} value={i.id}>{i.label}</option>)}
                        </select>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-4 flex items-center justify-end pb-2">
                      <button type="button" onClick={() => delLinea(l.id)} className="text-fg-muted hover:text-vf-redLight" aria-label="Quitar línea"><X size={15} /></button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-fg-muted">Añade las líneas móviles una a una (tarifa, número, nueva/porta y operador). El contador "Líneas móvil" se rellenará solo.</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Estado</label>
          <select className="input" value={v.estado} onChange={(e) => set('estado', e.target.value)}>
            {ORDEN_ESTADOS.map((k) => <option key={k} value={k}>{ESTADOS_LOWI[k].label}</option>)}
          </select>
        </div>
        {esBaja && (
          <>
            <div><label className="label">Fecha de baja</label><input type="date" className="input" value={v.fechaBaja} onChange={(e) => set('fechaBaja', e.target.value)} /></div>
            <div>
              <label className="label">Motivo de baja</label>
              <select className="input" value={v.motivoBaja} onChange={(e) => set('motivoBaja', e.target.value)}>
                <option value="">—</option>
                {MOTIVOS_BAJA.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </>
        )}
      </div>

      <div><label className="label">Notas</label><input className="input" value={v.notas} onChange={(e) => set('notas', e.target.value)} /></div>

      <div className="flex gap-2 justify-end">
        <button className="btn-ghost" onClick={onCancelar}><X size={16} /> Cancelar</button>
        <button className="btn-lowi" onClick={() => onGuardar(v)}><Check size={16} /> Guardar</button>
      </div>
    </div>
  );
}

export default function LowiVentas() {
  const { ventasLowi, setVentasLowi } = useApp();
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filtro, setFiltro] = useState('todos');
  const [filtroMes, setFiltroMes] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  // Meses disponibles (de las fechas de venta) para el filtro
  const meses = useMemo(() => {
    const s = new Set(ventasLowi.map((v) => mesLowi(v.fechaVenta)).filter(Boolean));
    return [...s].sort().reverse();
  }, [ventasLowi]);

  const q = busqueda.trim().toLowerCase();
  const lista = ventasLowi.filter((v) => {
    if (filtro !== 'todos' && v.estado !== filtro) return false;
    if (filtroMes !== 'todos' && mesLowi(v.fechaVenta) !== filtroMes) return false;
    if (!q) return true;
    return [v.nombre, v.apellido, v.dni, v.telefono, v.email, v.pedido, v.idWeb]
      .some((c) => String(c || '').toLowerCase().includes(q));
  });

  const guardar = (venta) => {
    if (!venta.nombre.trim() || !venta.apellido.trim()) {
      setMsg({ tone: 'red', text: 'Indica al menos nombre y apellido para guardar la venta.' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }
    setVentasLowi((prev) => {
      const existe = prev.some((p) => p.id === venta.id);
      return existe ? prev.map((p) => (p.id === venta.id ? venta : p)) : [venta, ...prev];
    });
    setForm(false); setEditId(null);
    const avisos = avisosContacto(venta);
    if (avisos.length) {
      setMsg({ tone: 'red', text: `Venta guardada. ${avisos.join(' ')}` });
      setTimeout(() => setMsg(null), 6000);
    }
  };

  // Cambio rápido de estado desde la tabla (sin abrir el formulario)
  const cambiarEstado = (id, estado) => {
    setVentasLowi((prev) => prev.map((p) => (p.id === id ? { ...p, estado } : p)));
  };

  const eliminar = (id) => {
    if (confirm('¿Eliminar esta venta de Lowi?')) setVentasLowi((prev) => prev.filter((p) => p.id !== id));
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { ventas: nuevas, duplicadas, yaExistian } = await importarLowi(file, ventasLowi);
      setVentasLowi((prev) => [...nuevas, ...prev]);
      let text = `${nuevas.length} ventas importadas`;
      const omitidas = [];
      if (yaExistian > 0) omitidas.push(`${yaExistian} ya existentes`);
      if (duplicadas > 0) omitidas.push(`${duplicadas} duplicadas`);
      if (omitidas.length) text += ` (${omitidas.join(', ')} omitidas)`;
      setMsg({ tone: 'green', text: text + '.' });
    } catch {
      setMsg({ tone: 'red', text: 'Error al leer el Excel. Revisa el formato con la plantilla.' });
    }
    e.target.value = '';
    setTimeout(() => setMsg(null), 4000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          <button className="btn-lowi" onClick={() => { setEditId(null); setForm(true); }}>
            <Plus size={16} /> Nueva venta Lowi
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Importar Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImport} />
          <button className="btn-ghost" onClick={() => plantillaLowi()}>
            <FileSpreadsheet size={16} /> Plantilla
          </button>
          <button className="btn-ghost" onClick={() => exportarLowi(ventasLowi)} disabled={!ventasLowi.length}>
            <Download size={16} /> Exportar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select className="input w-auto" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
            <option value="todos">Todos los meses</option>
            {meses.map((m) => <option key={m} value={m}>{etiquetaMesLowi(m)}</option>)}
          </select>
          <select className="input w-auto" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="todos">Todos los estados</option>
            {ORDEN_ESTADOS.map((k) => <option key={k} value={k}>{ESTADOS_LOWI[k].label}</option>)}
          </select>
        </div>
      </div>

      {msg && <div className={`text-sm px-4 py-2 rounded-lg ${msg.tone === 'green' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-vf-red/15 text-vf-redLight'}`} role="alert">{msg.text}</div>}

      {form && (
        <Card>
          <SectionTitle>{editId ? 'Editar venta Lowi' : 'Registrar nueva venta Lowi'}</SectionTitle>
          <FormLowi
            inicial={editId
              ? { ...ventaLowiVacia(), ...ventasLowi.find((v) => v.id === editId) }
              : ventaLowiVacia()}
            onGuardar={guardar}
            onCancelar={() => { setForm(false); setEditId(null); }}
          />
        </Card>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-bg-border flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-fg">Ventas Lowi</h2>
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
          <EmptyState icon={Wifi} title="Sin ventas de Lowi" hint="Añade una venta manualmente o importa tu Excel para empezar el seguimiento." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-fg-muted border-b border-bg-border bg-bg-surface2/60 sticky top-0 backdrop-blur z-10">
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">F. Venta</th>
                  <th className="px-4 py-3 font-semibold">F. Instalación</th>
                  <th className="px-4 py-3 font-semibold">Producto</th>
                  <th className="px-4 py-3 font-semibold text-right">Cuota</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((v) => (
                  <tr key={v.id} className="border-b border-bg-border/60 odd:bg-bg-surface2/25 hover:bg-bg-surface2/60 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-fg">{v.nombre} {v.apellido}</div>
                      {(v.dni || v.telefono) && (
                        <div className="text-[11px] text-fg-muted mt-0.5">
                          {[v.dni, v.telefono].filter(Boolean).join(' · ')}
                        </div>
                      )}
                      {(v.estado === 'baja' || v.estado === 'cancelada') && v.motivoBaja && (
                        <div className="text-[11px] text-fg-muted mt-0.5">Baja: {v.motivoBaja}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-fg-muted tabnum">{fmtFecha(v.fechaVenta)}</td>
                    <td className="px-4 py-3 text-fg-muted tabnum">{fmtFecha(v.fechaInstalacion)}</td>
                    <td className="px-4 py-3 text-fg-soft">
                      {v.producto ? PRODUCTOS_LOWI[v.producto] : '—'}
                      {v.velocidad && <span className="text-fg-muted"> · {v.velocidad}</span>}
                      {v.lineas > 0 && <span className="text-fg-muted"> · {v.lineas} líneas</span>}
                      {v.tv && <span className="flex items-center gap-1 text-[11px] text-fg-muted mt-0.5"><Tv size={12} className="text-sky-400" /> {v.tv}</span>}
                      {(() => {
                        const lm = v.lineasMoviles || [];
                        const portas = lm.filter((l) => l.tipo === 'porta').length;
                        if (portas === 0) return null;
                        const act = lm.filter((l) => l.tipo === 'porta' && l.activa).length;
                        const vt = ventanaRelevante(lm);
                        return (
                          <span className="block text-[11px] text-fg-muted">
                            <span className="text-emerald-400">{act}</span>/{portas} portas
                            {vt && <span className="ml-1.5 inline-flex align-middle" title={`${ETIQUETA_VENTANA[vt.estado]}: ${fmtVentana(vt.fecha)}`}><Badge tone={TONO_VENTANA[vt.estado]}>{vt.estado === 'vencida' ? 'Vencida' : fmtVentana(vt.fecha)}</Badge></span>}
                            {(() => {
                              const inc = lm.find((l) => l.tipo === 'porta' && l.incidenciaPorta && !l.activa);
                              if (!inc) return null;
                              const label = INCIDENCIAS_PORTA.find((i) => i.id === inc.incidenciaPorta)?.label;
                              return <span className="ml-1.5 inline-flex align-middle" title={label}><Badge tone="red">{label}</Badge></span>;
                            })()}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 text-right text-fg-soft tabnum">{v.cuota ? fmtEur(v.cuota) : '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: ESTADOS_LOWI[v.estado]?.color }} aria-hidden="true" />
                        <select
                          value={v.estado}
                          onChange={(e) => cambiarEstado(v.id, e.target.value)}
                          className="bg-bg-surface2 border border-bg-border rounded-md px-2 py-1 text-xs text-fg cursor-pointer focus:outline-none focus:ring-1 focus:ring-vf-red"
                          title="Cambiar estado rápido"
                        >
                          {ORDEN_ESTADOS.map((k) => <option key={k} value={k}>{ESTADOS_LOWI[k].label}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button className="p-2 rounded-lg hover:bg-bg-border text-fg-muted hover:text-fg cursor-pointer" onClick={() => { setEditId(v.id); setForm(true); }} aria-label="Editar"><Pencil size={15} /></button>
                        <button className="p-2 rounded-lg hover:bg-vf-red/20 text-fg-muted hover:text-vf-redLight cursor-pointer" onClick={() => eliminar(v.id)} aria-label="Eliminar"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

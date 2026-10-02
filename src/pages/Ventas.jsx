import { useLocalStorage } from '../hooks/useLocalStorage.js';
import DialogSurface from '../components/DialogSurface.jsx';
import { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Upload, Download, FileSpreadsheet, Trash2, Pencil, X, ShoppingCart, Search, Tv, CalendarClock,
} from 'lucide-react';
import { useApp } from '../App.jsx';
import { ventaVacia, mesDesdeFecha, unidadesVendidas, estadoEntregaTerminal, ETIQUETAS_ENTREGA, mesesImplicados, portasDeVenta } from '../lib/engine.js';
import { importarVentas, exportarVentas, plantillaVentas } from '../lib/excel.js';
import { avisosContacto } from '../lib/validacion.js';
import { ESTADOS, ORDEN_ESTADOS, MOTIVOS_BAJA, estadoDe } from '../lib/estados.js';
import { CATALOGO, PERIODO, udsDe, TV_CONTENIDOS } from '../data/incentivos.js';
import { estadoCampanaEnFecha, etiquetaMesCampana } from '../data/campanas.js';
import { INCIDENCIAS_PORTA } from '../data/movil.js';
import { Card, Badge, EmptyState, useConfirm, Avatar } from '../components/ui.jsx';
import { fmtFecha } from '../lib/format.js';
import { ventanaRelevante, fmtVentana, TONO_VENTANA } from '../lib/portabilidad.js';
import FormVenta from '../components/ventas/FormVenta.jsx';

const etiquetaMes = (mes) => etiquetaMesCampana(mes);
const etiquetaMesCorta = (mes) => etiquetaMes(mes).slice(0, 3);

export default function Ventas() {
  const { ventas, setVentas, mes, prefillVenta, setPrefillVenta, guardarVenta, registroSeleccionado, toast } = useApp();
  const [form, setForm] = useState(!!registroSeleccionado?.id);
  const [editId, setEditId] = useState(registroSeleccionado?.id || null);
  const [prefab, setPrefab] = useState(null); // marca/sap o datos de cliente precargados
  const [agendadoRef, setAgendadoRef] = useState(null); // id del agendado origen (si la venta viene de la agenda)
  const [filtroMes, setFiltroMes] = useState(registroSeleccionado ? 'todos' : mes);
  const [filtroEstado, setFiltroEstado] = useLocalStorage('gpcoins:ui:Ventas.jsx:filtroEstado', 'todos');
  const [busqueda, setBusqueda] = useState(registroSeleccionado?.dni || registroSeleccionado?.nombre || '');
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const { confirmar, dialogo } = useConfirm();

  // Si llegamos desde "Vender" del Catálogo o "Convertir" de Agendados, abrimos
  // el alta ya prerrellenada. `_agendadoId` (si viene de la agenda) se separa
  // para no guardarlo en la venta y usarlo al marcar el agendado convertido.
  useEffect(() => {
    if (prefillVenta) {
      const { _agendadoId, ...datos } = prefillVenta;
      setEditId(null);
      setPrefab(datos);
      setAgendadoRef(_agendadoId || null);
      setForm(true);
      setPrefillVenta(null);
    }
  }, [prefillVenta, setPrefillVenta]);

  // La tabla sigue al período de la cabecera para los meses con reglas, pero
  // también expone meses de seguimiento fuera de campaña (p. ej. 2026-10).
  useEffect(() => { setFiltroMes(mes); }, [mes]);

  const mesesSeguimiento = useMemo(() => Array.from(new Set(
    ventas.flatMap((v) => Array.from(mesesImplicados(v)))
      .filter((m) => m && !PERIODO.meses.includes(m))
  )).sort(), [ventas]);
  const campanaFinalizada = estadoCampanaEnFecha(new Date()) === 'finalizada';

  const q = busqueda.trim().toLowerCase();
  const lista = ventas.filter((v) => {
    // Una venta aparece en su mes propio y también en el mes de la ventana de
    // portabilidad de sus portas (una porta de julio se ve al filtrar julio).
    if (filtroMes !== 'todos' && !mesesImplicados(v).has(filtroMes)) return false;
    if (filtroEstado !== 'todos' && estadoDe(v) !== filtroEstado) return false;
    if (!q) return true;
    return [v.nombre, v.apellido, v.dni, v.telefono, v.email, v.pedido, v.idWeb]
      .some((c) => String(c || '').toLowerCase().includes(q));
  });

  const guardar = (venta) => {
    // 1) Validación: nombre y apellido obligatorios
    if (!venta.nombre.trim() || !venta.apellido.trim()) {
      setMsg({ tone: 'red', text: 'Indica al menos nombre y apellido para guardar la venta.' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }

    // 2) Avisos no bloqueantes (fecha fuera de período y tope de stock)
    const avisos = [];

    if (venta.fechaVenta && (venta.fechaVenta < PERIODO.inicio || venta.fechaVenta > PERIODO.fin)) {
      avisos.push(`La fecha de venta está fuera del período del incentivo (${PERIODO.inicio} → ${PERIODO.fin}). Se guardará para seguimiento, sin aplicar reglas antiguas.`);
    }
    const mesSinReglas = !!venta.mes && !PERIODO.meses.includes(venta.mes);
    if (mesSinReglas) {
      avisos.push(`${etiquetaMes(venta.mes)} no tiene reglas de GP Coins/comisión configuradas. La venta seguirá visible en Ventas.`);
    }

    avisos.push(...avisosContacto(venta));

    // Aviso de stock: tope de unidades por modelo (y familia si aplica). Solo informativo.
    if (venta.marca && venta.sap) {
      const prod = CATALOGO[venta.marca]?.productos.find((p) => p.sap === venta.sap);
      if (prod) {
        const tope = udsDe(prod, venta.mes);
        if (tope > 0) {
          // Ventas del mes ya guardadas (excluyendo la que se edita) + esta venta
          const otras = ventas.filter((p) => p.id !== venta.id);
          const conEsta = [...otras, venta];
          const { porModelo, porFamilia } = unidadesVendidas(conEsta, venta.marca, venta.mes);
          const usadasModelo = porModelo[venta.sap] || 0;
          const usadasFamilia = prod.familia ? (porFamilia[prod.familia] || 0) : usadasModelo;
          const usadas = Math.max(usadasModelo, usadasFamilia);
          if (usadas >= tope) {
            avisos.push(`Aviso de stock: se alcanzaría el tope de ${tope} uds (${usadas}) para ${prod.modelo} en ${venta.mes}. El stock es global de plataforma; la venta se guarda igualmente.`);
          }
        }
      }
    }

    const existia = ventas.some(p => p.id === venta.id);
    try { guardarVenta('ventas', venta, agendadoRef); } catch(e) { toast?.(e.message, 'error'); return; }
    setForm(false); setEditId(null); setPrefab(null);
    // Una venta fuera de campaña debe quedar visible inmediatamente, no oculta
    // detrás del último mes configurado en la cabecera.
    if (mesSinReglas) setFiltroMes(venta.mes);
    // Si esta alta venía de un agendado, márcalo "Convertido" (solo ahora, al guardar)
    setAgendadoRef(null);

    if (avisos.length) {
      setMsg({ tone: 'red', text: `Venta guardada. ${avisos.join(' ')}` });
      setTimeout(() => setMsg(null), 7000);
    } else {
      toast?.(existia ? 'Venta actualizada' : 'Venta guardada');
    }
  };

  const eliminar = async (id) => {
    const ok = await confirmar('¿Eliminar esta venta? Podrás recuperarla desde Copias y papelera.', { titulo: 'Eliminar venta', accion: 'Eliminar', peligro: true });
    if (ok) { setVentas((prev) => prev.filter((p) => p.id !== id)); toast?.('Venta eliminada', 'info'); }
  };

  // Cambio rápido de estado desde la tabla (mantiene instalacionActiva en sync)
  const cambiarEstado = (id, estado) => {
    setVentas((prev) => prev.map((p) => (p.id === id
      ? { ...p, estado, instalacionActiva: estado === 'activa' }
      : p)));
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { ventas: nuevas, duplicadas, yaExistian, fueraPeriodo } = await importarVentas(file, ventas);
      if (nuevas.length > 400) throw new Error('Importa como máximo 400 filas por archivo.');
      const sinReglas = nuevas.filter((v) => v.mes && !PERIODO.meses.includes(v.mes)).length;
      if (!await confirmar(`${nuevas.length} ventas nuevas, ${duplicadas} duplicadas y ${yaExistian} ya existentes. ¿Importar las nuevas?`, { titulo: 'Revisar importación', accion: 'Importar' })) { e.target.value = ''; return; }
      setVentas((prev) => [...nuevas, ...prev]);
      if (sinReglas > 0) setFiltroMes('todos');
      let text = `${nuevas.length} ventas importadas`;
      const omitidas = [];
      if (yaExistian > 0) omitidas.push(`${yaExistian} ya existentes`);
      if (duplicadas > 0) omitidas.push(`${duplicadas} duplicadas`);
      if (omitidas.length) text += ` (${omitidas.join(', ')} omitidas)`;
      if (fueraPeriodo > 0) text += ` · ${fueraPeriodo} fuera de período`;
      if (sinReglas > 0) text += ` · ${sinReglas} en meses sin reglas (solo seguimiento)`;
      text += '.';
      setMsg({ tone: fueraPeriodo > 0 || sinReglas > 0 ? 'red' : 'green', text });
    } catch (error) {
      setMsg({ tone: 'red', text: error.message || 'Error al leer el Excel.' });
    }
    e.target.value = '';
    setTimeout(() => setMsg(null), 4000);
  };

  const nombreMarca = (m) => (m ? CATALOGO[m]?.marca : '');

  return (
    <div className="space-y-6">
      {campanaFinalizada && (
        <div className="text-sm px-4 py-3 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
          La campaña de incentivos terminó el <span className="font-semibold">{PERIODO.fin}</span>. Las ventas posteriores se guardan y se muestran aquí como seguimiento; no generan GP Coins ni comisión hasta configurar una nueva campaña.
        </div>
      )}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-2">
          <button className="btn-primary" onClick={() => { setEditId(null); setPrefab(null); setAgendadoRef(null); setForm(true); }}>
            <Plus size={16} /> Nueva venta
          </button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={16} /> Importar Excel
          </button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImport} />
          <button className="btn-ghost" onClick={() => plantillaVentas()}>
            <FileSpreadsheet size={16} /> Plantilla
          </button>
          <button className="btn-ghost" onClick={() => exportarVentas(ventas)} disabled={!ventas.length}>
            <Download size={16} /> Exportar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          <select
            className="input w-auto"
            value={filtroMes}
            onChange={(e) => setFiltroMes(e.target.value)}
            title="Se sincroniza con el período activo de arriba; elige 'Todos los meses' para ver el período completo"
          >
            <option value="todos">Todos los meses</option>
            {PERIODO.meses.map((m) => <option key={m} value={m}>{etiquetaMes(m)}</option>)}
            {mesesSeguimiento.map((m) => <option key={m} value={m}>{etiquetaMes(m)} · seguimiento</option>)}
          </select>
          <select className="input w-auto" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="todos">Todos los estados</option>
            {ORDEN_ESTADOS.map((k) => <option key={k} value={k}>{ESTADOS[k].label}</option>)}
          </select>
        </div>
      </div>

      {msg && <div className={`text-sm px-4 py-2 rounded-lg ${msg.tone === 'green' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-vf-red/15 text-vf-redLight'}`} role="alert">{msg.text}</div>}

      {form && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 overflow-y-auto fade-in"
          onClick={() => { setForm(false); setEditId(null); setPrefab(null); setAgendadoRef(null); }}
        >
          <DialogSurface
            className="card w-full max-w-5xl p-5 my-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onClose={() => setForm(false)} label="Editar registro"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-fg tracking-tight">{editId ? 'Editar venta' : 'Registrar nueva venta'}</h2>
              <button onClick={() => { setForm(false); setEditId(null); setPrefab(null); setAgendadoRef(null); }} className="p-1.5 rounded-lg hover:bg-bg-surface2 text-fg-muted hover:text-fg cursor-pointer" aria-label="Cerrar"><X size={18} /></button>
            </div>
            {msg && <p role="alert" className="text-vf-redLight mb-3">{msg.text}</p>}
            <FormVenta
              inicial={editId
                ? (() => { const f = ventas.find((v) => v.id === editId); return { ...ventaVacia(), ...f, estado: estadoDe(f) }; })()
                : (() => {
                    // Alta nueva: fecha de venta de HOY prellenada (editable), para
                    // que la venta cuente en "Ventas por día" desde el primer momento.
                    const hoy = new Date();
                    const f = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
                    return { ...ventaVacia(), fechaVenta: f, mes: mesDesdeFecha(f) || mes, ...(prefab || {}) };
                  })()}
              onGuardar={guardar}
              onCancelar={() => { setForm(false); setEditId(null); setPrefab(null); setAgendadoRef(null); }}
            />
          </DialogSurface>
        </div>,
        document.body,
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-bg-border flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-fg">Ventas registradas</h2>
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
        {filtroMes !== 'todos' && lista.some((v) => v.mes !== filtroMes) && (
          <div className="px-5 py-2 border-b border-bg-border bg-sky-500/[0.06] text-xs text-sky-300 flex items-center gap-2">
            <CalendarClock size={13} className="shrink-0" />
            Las filas resaltadas en azul son ventas de otro mes que aparecen aquí porque su porta activa en {etiquetaMes(filtroMes).toLowerCase()}.
          </div>
        )}
        {lista.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Sin ventas registradas" hint="Añade una venta manualmente o importa tu Excel para empezar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-fg-muted border-b border-bg-border bg-bg-surface2/60 sticky top-0 backdrop-blur z-10">
                  <th className="px-4 py-3 font-semibold">Cliente</th>
                  <th className="px-4 py-3 font-semibold">F. Venta</th>
                  <th className="px-4 py-3 font-semibold">F. Instalación</th>
                  <th className="px-4 py-3 font-semibold">Fibra</th>
                  <th className="px-4 py-3 font-semibold">Terminal</th>
                  <th className="px-4 py-3 font-semibold text-center">Portas</th>
                  <th className="px-4 py-3 font-semibold text-center">Mes</th>
                  <th className="px-4 py-3 font-semibold text-center">Estado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((v) => {
                  const prod = v.marca ? CATALOGO[v.marca]?.productos.find((p) => p.sap === v.sap) : null;
                  // ¿Esta fila se muestra en el mes filtrado solo por una porta cruzada
                  // (la venta es de otro mes)? Se resalta para no confundir con las
                  // ventas propias del mes.
                  const porPortaCruzada = filtroMes !== 'todos' && v.mes !== filtroMes;
                  return (
                    <tr key={v.id} className={`border-b border-bg-border/60 hover:bg-bg-surface2/60 transition-colors ${porPortaCruzada ? 'bg-sky-500/[0.05] border-l-2 border-l-sky-500/50' : 'odd:bg-bg-surface2/25'}`}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Avatar nombre={v.nombre} apellido={v.apellido} />
                          <div className="min-w-0">
                            <div className="font-medium text-fg">{v.nombre} {v.apellido}</div>
                            {(v.dni || v.telefono) && (
                              <div className="text-[11px] text-fg-muted mt-0.5">
                                {[v.dni, v.telefono].filter(Boolean).join(' · ')}
                              </div>
                            )}
                            <div className="flex gap-1 mt-1">
                              {v.clienteNuevo && <Badge tone="red">Nuevo</Badge>}
                              {v.fibraActiva && <Badge tone="neutral">Fibra</Badge>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-muted tabnum">{fmtFecha(v.fechaVenta)}</td>
                      <td className="px-4 py-3 text-fg-muted tabnum">{fmtFecha(v.fechaInstalacion)}</td>
                      <td className="px-4 py-3 text-fg-soft">
                        {v.convergencia ? `${v.convergencia} · ${v.velocidad}` : '—'}
                        {v.tv && <span className="flex items-center gap-1 text-[11px] text-fg-muted mt-0.5"><Tv size={12} className="text-vf-red" /> {v.tv}</span>}
                      </td>
                      <td className="px-4 py-3 text-fg-soft">
                        {prod
                          ? (() => {
                            const et = ETIQUETAS_ENTREGA[estadoEntregaTerminal(v)];
                            return (
                              <span>
                                <span title={prod.modelo}>{nombreMarca(v.marca)} · {prod.modelo.slice(0, 22)}{prod.modelo.length > 22 ? '…' : ''}</span>
                                <span className="block mt-0.5">
                                  {et && <Badge tone={et.tone}>{et.label}</Badge>}
                                </span>
                              </span>
                            );
                          })()
                          : <span className="text-fg-muted italic">Sin terminal</span>}
                      </td>
                      <td className="px-4 py-3 text-center tabnum">
                        {Number(v.portasVoz) > 0 ? (
                          <span title="Portas activas / solicitadas">
                            <span className="text-emerald-400">{Math.min(Number(v.portasActivas) || 0, v.portasVoz)}</span>
                            <span className="text-fg-muted"> / {v.portasVoz}</span>
                          </span>
                        ) : <span className="text-fg-muted">—</span>}
                        {(() => {
                          // Fecha(s) de portabilidad móvil, siempre visibles. Verde si ya
                          // activó; si sigue pendiente, tono según cercanía de la ventana.
                          const portas = portasDeVenta(v);
                          if (!portas.length) return null;
                          const vt = ventanaRelevante(v.lineasMoviles);
                          return (
                            <div className="flex flex-col items-center gap-1 mt-1">
                              {portas.map((p, i) => {
                                const tono = p.activa ? 'green' : (vt && vt.fecha === p.raw ? TONO_VENTANA[vt.estado] : 'neutral');
                                return (
                                  <span key={i} className="inline-flex items-center gap-1" title={`Portabilidad móvil: ${fmtVentana(p.raw)}${p.activa ? ' · activada' : ''}${p.otroMes ? ` · cuenta en ${p.mes}` : ''}`}>
                                    <CalendarClock size={11} className="text-fg-muted" />
                                    <Badge tone={tono}>{fmtVentana(p.raw)}</Badge>
                                    {p.otroMes && <span className="text-[10px] font-semibold text-fg-muted">{etiquetaMesCorta(p.mes)}</span>}
                                  </span>
                                );
                              })}
                            </div>
                          );
                        })()}
                        {(() => {
                          const inc = (v.lineasMoviles || []).find((l) => l.tipo === 'porta' && l.incidenciaPorta && !l.activa);
                          if (!inc) return null;
                          const label = INCIDENCIAS_PORTA.find((i) => i.id === inc.incidenciaPorta)?.label;
                          return (
                            <span className="flex justify-center mt-1" title={label}>
                              <Badge tone="red">{label}</Badge>
                            </span>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <Badge tone={porPortaCruzada ? 'sky' : 'neutral'}>{etiquetaMesCorta(v.mes)}</Badge>
                          {(() => {
                            // Si alguna porta activa en otro mes, se indica aquí
                            const otros = [...mesesImplicados(v)].filter((m) => m !== v.mes);
                            if (!otros.length) return null;
                            return otros.map((m) => (
                              <span key={m} title={`Esta venta es de ${v.mes}, pero su porta activa en ${m} y por eso también cuenta en ese mes`}>
                                <Badge tone="sky">↳ cuenta en {etiquetaMesCorta(m)}</Badge>
                              </span>
                            ));
                          })()}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 rounded-full shrink-0" style={{ background: ESTADOS[estadoDe(v)]?.color }} aria-hidden="true" />
                          <select
                            value={estadoDe(v)}
                            onChange={(e) => cambiarEstado(v.id, e.target.value)}
                            className="bg-bg-surface2 border border-bg-border rounded-md px-2 py-1 text-xs text-fg cursor-pointer focus:outline-none focus:ring-1 focus:ring-vf-red"
                            title="Cambiar estado rápido"
                          >
                            {ORDEN_ESTADOS.map((k) => <option key={k} value={k}>{ESTADOS[k].label}</option>)}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button className="p-2 rounded-lg hover:bg-bg-border text-fg-muted hover:text-fg cursor-pointer" onClick={() => { setEditId(v.id); setPrefab(null); setAgendadoRef(null); setForm(true); }} aria-label="Editar"><Pencil size={15} /></button>
                          <button className="p-2 rounded-lg hover:bg-vf-red/20 text-fg-muted hover:text-vf-redLight cursor-pointer" onClick={() => eliminar(v.id)} aria-label="Eliminar"><Trash2 size={15} /></button>
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

import { Trash2, Pencil, ShoppingCart, Search, Tv, CalendarClock } from 'lucide-react';
import { estadoEntregaTerminal, ETIQUETAS_ENTREGA, mesesImplicados, portasDeVenta } from '../../lib/engine.js';
import { ESTADOS, ORDEN_ESTADOS, estadoDe } from '../../lib/estados.js';
import { CATALOGO } from '../../data/incentivos.js';
import { etiquetaMesCampana } from '../../data/campanas.js';
import { INCIDENCIAS_PORTA } from '../../data/movil.js';
import { Card, Badge, EmptyState, Avatar } from '../ui.jsx';
import { fmtFecha } from '../../lib/format.js';
import { ventanaRelevante, fmtVentana, TONO_VENTANA } from '../../lib/portabilidad.js';
import { etiquetaOfertaComision } from '../../lib/comision.js';

const etiquetaMes = (mes) => etiquetaMesCampana(mes);
const etiquetaMesCorta = (mes) => etiquetaMes(mes).slice(0, 3);
const nombreMarca = (m) => (m ? CATALOGO[m]?.marca : '');

export default function VentasTable({
  lista,
  filtroMes,
  busqueda,
  setBusqueda,
  onCambiarEstado,
  onEditar,
  onEliminar,
}) {
  return (
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
                            <Badge tone="neutral">Oferta {etiquetaOfertaComision(v.oferta)}</Badge>
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
                          onChange={(e) => onCambiarEstado(v.id, e.target.value)}
                          className="bg-bg-surface2 border border-bg-border rounded-md px-2 py-1 text-xs text-fg cursor-pointer focus:outline-none focus:ring-1 focus:ring-vf-red"
                          title="Cambiar estado rápido"
                        >
                          {ORDEN_ESTADOS.map((k) => <option key={k} value={k}>{ESTADOS[k].label}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1 justify-end">
                        <button className="p-2 rounded-lg hover:bg-bg-border text-fg-muted hover:text-fg cursor-pointer" onClick={() => onEditar(v.id)} aria-label="Editar"><Pencil size={15} /></button>
                        <button className="p-2 rounded-lg hover:bg-vf-red/20 text-fg-muted hover:text-vf-redLight cursor-pointer" onClick={() => onEliminar(v.id)} aria-label="Eliminar"><Trash2 size={15} /></button>
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
  );
}

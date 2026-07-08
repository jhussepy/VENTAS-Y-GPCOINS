import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Plus, Upload, Download, FileSpreadsheet, Trash2, Pencil, X, Check, ShoppingCart, HelpCircle, Search, Tv, CalendarClock,
} from 'lucide-react';
import { useApp } from '../App.jsx';
import { ventaVacia, mesDesdeFecha, unidadesVendidas, estadoEntregaTerminal, ETIQUETAS_ENTREGA, lineaPrincipal, mesesImplicados, portasDeVenta } from '../lib/engine.js';
import { importarVentas, exportarVentas, plantillaVentas } from '../lib/excel.js';
import { avisosContacto } from '../lib/validacion.js';
import { ESTADOS, ORDEN_ESTADOS, MOTIVOS_BAJA, estadoDe } from '../lib/estados.js';
import { CATALOGO, PERIODO, udsDe, TV_CONTENIDOS } from '../data/incentivos.js';
import { TARIFAS_MOVIL, OPERADORES_PORTA, lineaMovilVacia, resumenLineas, INCIDENCIAS_PORTA } from '../data/movil.js';
import { nuevoId } from '../lib/id.js';
import { Card, SectionTitle, Badge, EmptyState, useConfirm, Avatar } from '../components/ui.jsx';
import { fmtFecha } from '../lib/format.js';
import { ventanaRelevante, fmtVentana, TONO_VENTANA, ETIQUETA_VENTANA } from '../lib/portabilidad.js';

const VELOCIDADES = ['Fibra 300 MB', 'Fibra 600 MB', 'Fibra 1 GB'];
const MARCAS = Object.keys(CATALOGO);

function FormVenta({ inicial, onGuardar, onCancelar }) {
  const [v, setV] = useState(inicial);
  const set = (k, val) => setV((p) => {
    const next = { ...p, [k]: val };
    // El mes lo manda la fecha de instalación (activación); si aún no la hay,
    // usamos la fecha de venta como respaldo.
    if (k === 'fechaVenta') next.mes = mesDesdeFecha(next.fechaInstalacion || val);
    if (k === 'fechaInstalacion') next.mes = mesDesdeFecha(val || next.fechaVenta);
    if (k === 'marca') { next.sap = ''; if (!val) next.dispositivoEntregado = false; }
    // Al marcar "entregado" sin fecha, proponemos hoy (sus puntos cuentan en ese mes)
    if (k === 'dispositivoEntregado') {
      if (val && !next.fechaEntrega) next.fechaEntrega = new Date().toISOString().slice(0, 10);
      if (!val) next.fechaEntrega = '';
    }
    // El estado manda: "instalación activa" solo es cierto cuando el estado es 'activa'
    if (k === 'estado') next.instalacionActiva = val === 'activa';
    // El contenido de TV solo aplica en 4P; si deja de ser 4P, se limpia
    if (k === 'convergencia' && val !== '4P') next.tv = '';
    // Las portas activas no pueden superar las solicitadas
    if (k === 'portasVoz') next.portasActivas = Math.min(next.portasActivas || 0, val || 0);
    if (k === 'portasActivas') next.portasActivas = Math.min(val || 0, next.portasVoz || 0);
    return next;
  });
  const esBaja = v.estado === 'baja' || v.estado === 'cancelada';

  // --- Líneas móviles: contadores derivados automáticamente -------------------
  const lineas = v.lineasMoviles || [];
  const tieneLineas = lineas.length > 0;
  const recompute = (next) => {
    const lm = next.lineasMoviles || [];
    // Siempre recalculamos (incluso a 0 si se borran todas las líneas): si no,
    // quedan contadores "fantasma" de líneas ya eliminadas.
    Object.assign(next, resumenLineas(lm));
    return next;
  };
  const setLineas = (lm) => setV((p) => recompute({ ...p, lineasMoviles: lm }));
  const addLinea = () => setLineas([...lineas, { id: nuevoId(), ...lineaMovilVacia() }]);
  const updLinea = (id, k, val) => setLineas(lineas.map((l) => {
    if (l.id !== id) return l;
    const nl = { ...l, [k]: val };
    if (k === 'tipo' && val === 'nueva') { nl.operador = ''; nl.activa = false; nl.ventanaPorta = ''; nl.incidenciaPorta = ''; }
    return nl;
  }));
  const delLinea = (id) => setLineas(lineas.filter((l) => l.id !== id));
  // El terminal va ligado a una única línea: marcarla desmarca las demás
  const setLineaPrincipal = (id) => setLineas(lineas.map((l) => ({ ...l, principal: l.id === id })));

  const productos = v.marca ? CATALOGO[v.marca]?.productos ?? [] : [];

  // ¿La fecha de venta cae fuera del período del incentivo (1-jun → 31-jul 2026)?
  const fechaFuera = !!v.fechaVenta && (v.fechaVenta < PERIODO.inicio || v.fechaVenta > PERIODO.fin);
  const avisosDatos = avisosContacto(v);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div><label className="label">Nombre</label><input className="input" value={v.nombre} onChange={(e) => set('nombre', e.target.value)} /></div>
        <div><label className="label">Apellido</label><input className="input" value={v.apellido} onChange={(e) => set('apellido', e.target.value)} /></div>
        <div><label className="label">DNI / NIE</label><input className="input" value={v.dni} onChange={(e) => set('dni', e.target.value)} placeholder="12345678A" /></div>
        <div><label className="label">Teléfono de contacto</label><input type="tel" className="input" value={v.telefono} onChange={(e) => set('telefono', e.target.value)} placeholder="600 000 000" /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div><label className="label">Email <span className="text-fg-muted font-normal">(opcional)</span></label><input type="email" className="input" value={v.email} onChange={(e) => set('email', e.target.value)} placeholder="cliente@email.com" /></div>
        <div><label className="label">Dirección de instalación <span className="text-fg-muted font-normal">(opcional)</span></label><input className="input" value={v.direccion} onChange={(e) => set('direccion', e.target.value)} /></div>
        <div><label className="label">ID Smart <span className="text-fg-muted font-normal">(opcional)</span></label><input className="input" value={v.pedido} onChange={(e) => set('pedido', e.target.value)} /></div>
        <div><label className="label">ID Web <span className="text-fg-muted font-normal">(opcional)</span></label><input className="input" value={v.idWeb} onChange={(e) => set('idWeb', e.target.value)} /></div>
      </div>

      {avisosDatos.length > 0 && (
        <p className="text-xs text-amber-400 -mt-1">{avisosDatos.join(' ')}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="label">Fecha de venta</label>
          <input type="date" className="input" value={v.fechaVenta} onChange={(e) => set('fechaVenta', e.target.value)} />
          {fechaFuera && (
            <p className="text-xs text-amber-400 mt-1">
              Fecha fuera del período del incentivo (1 jun → 31 jul 2026).
            </p>
          )}
        </div>
        <div>
          <label className="label">Fecha de instalación</label>
          <input type="date" className="input" value={v.fechaInstalacion} onChange={(e) => set('fechaInstalacion', e.target.value)} />
          <p className="text-[11px] text-fg-muted mt-1">Esta fecha decide el mes del incentivo (activación), no la de venta.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="label">Convergencia (fibra)</label>
          <select className="input" value={v.convergencia} onChange={(e) => set('convergencia', e.target.value)}>
            <option value="">—</option>
            <option value="3P">3P · Fibra + Fijo + Móvil</option>
            <option value="4P">4P · Fibra + Fijo + Móvil + TV</option>
          </select>
        </div>
        <div>
          <label className="label">Velocidad</label>
          <select className="input" value={v.velocidad} onChange={(e) => set('velocidad', e.target.value)}>
            <option value="">—</option>
            {VELOCIDADES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
        {v.convergencia === '4P' && (
          <div>
            <label className="label">Contenido TV <span className="text-fg-muted font-normal">(4P)</span></label>
            <select className="input" value={v.tv} onChange={(e) => set('tv', e.target.value)}>
              <option value="">—</option>
              {TV_CONTENIDOS.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <div>
          <label className="label">Marca terminal <span className="text-fg-muted font-normal">(opcional)</span></label>
          <select className="input" value={v.marca} onChange={(e) => set('marca', e.target.value)}>
            <option value="">Sin terminal</option>
            {MARCAS.map((m) => <option key={m} value={m}>{CATALOGO[m].marca}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Modelo (SAP) <span className="text-fg-muted font-normal">(opcional)</span></label>
          <select className="input" value={v.sap} onChange={(e) => set('sap', e.target.value)} disabled={!v.marca}>
            <option value="">{v.marca ? '—' : 'Sin terminal'}</option>
            {productos.map((p) => <option key={p.sap} value={p.sap}>{p.sap} · {p.modelo}</option>)}
          </select>
        </div>
      </div>

      {!v.marca && (
        <p className="text-xs text-fg-muted -mt-1">
          Sin terminal: venta de solo fibra y/o líneas móviles. Puntúa para <span className="text-fg-soft">Cliente Nuevo</span> y sus llaves, pero no genera GP Coins de dispositivo.
        </p>
      )}

      {/* Líneas móviles detalladas (vía recomendada) */}
      <div className="border border-sky-500/30 bg-sky-500/[0.04] rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium text-fg flex items-center gap-2">
            Líneas móviles {tieneLineas && <span className="text-fg-muted font-normal">({lineas.length})</span>}
            <Badge tone="neutral">Recomendado</Badge>
          </span>
          <button type="button" className="btn-lowi text-xs py-1" onClick={addLinea}><Plus size={14} /> Añadir línea</button>
        </div>
        <p className="text-[11px] text-sky-300/90 -mt-1">
          Registra aquí cada línea con su tarifa: los contadores (portas, TIL65…) se rellenan solos y el desglose por tarifa del panel se calcula automáticamente.
        </p>
        {tieneLineas ? (
          <div className="space-y-2">
            {lineas.map((l, i) => (
              <div key={l.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-bg-surface2/50 rounded-lg p-2">
                {v.marca && lineas.length > 1 && (
                  <div className="sm:col-span-12 -mb-1">
                    <label className="flex items-center gap-2 text-xs text-fg-soft cursor-pointer" title="El terminal se entrega según la activación de esta línea">
                      <input type="radio" name="lineaPrincipal" checked={!!l.principal} onChange={() => setLineaPrincipal(l.id)} className="accent-vf-red w-3.5 h-3.5" />
                      Línea principal (asociada al terminal)
                    </label>
                  </div>
                )}
                <div className="sm:col-span-3">
                  <label className="label">Tarifa línea {i + 1}</label>
                  <select className="input" value={l.tarifa} onChange={(e) => updLinea(l.id, 'tarifa', e.target.value)}>
                    <option value="">—</option>
                    {TARIFAS_MOVIL.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
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
            <p className="text-[11px] text-fg-muted">
              Resumen: {v.lineasVoz} líneas · {v.portasVoz} portas ({v.portasActivas} activas) · {v.til65} TIL65 — calculado automáticamente.
            </p>
          </div>
        ) : (
          <p className="text-xs text-fg-muted">Añade las líneas móviles una a una (tarifa, número, nueva/porta y operador). Los contadores de abajo se rellenarán solos.</p>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div><label className="label">Cantidad</label><input type="number" min="1" className="input" value={v.cantidad} onChange={(e) => set('cantidad', (Number(e.target.value) || 0))} /></div>
        {/* Contadores manuales: solo como respaldo si NO se usan líneas móviles (si las usas, se calculan solos) */}
        {!tieneLineas && (
          <>
            <div><label className="label">Portas voz</label><input type="number" min="0" className="input" value={v.portasVoz} onChange={(e) => set('portasVoz', (Number(e.target.value) || 0))} /></div>
            <div>
              <label className="label flex items-center gap-1">
                Portas activas
                <span className="inline-flex" title="De las portas solicitadas, cuántas ya se han activado.">
                  <HelpCircle size={13} className="text-fg-muted cursor-help" />
                </span>
              </label>
              <input type="number" min="0" max={v.portasVoz} className="input" value={v.portasActivas} onChange={(e) => set('portasActivas', (Number(e.target.value) || 0))} />
            </div>
            <div><label className="label">Líneas voz (total)</label><input type="number" min="0" className="input" value={v.lineasVoz} onChange={(e) => set('lineasVoz', (Number(e.target.value) || 0))} /></div>
            <div>
              <label className="label flex items-center gap-1">
                TIL65
                <span className="inline-flex" title="TIL65 = línea móvil ILIMITADA. Llave: 4 mínimo en el mes.">
                  <HelpCircle size={13} className="text-fg-muted cursor-help" />
                </span>
              </label>
              <input type="number" min="0" className="input" value={v.til65} onChange={(e) => set('til65', (Number(e.target.value) || 0))} />
            </div>
          </>
        )}
        <div><label className="label">Secure Net</label><input type="number" min="0" className="input" value={v.secureNet} onChange={(e) => set('secureNet', (Number(e.target.value) || 0))} /></div>
        <div>
          <label className="label">Mes (auto)</label>
          <select className="input" value={v.mes} onChange={(e) => set('mes', e.target.value)} disabled={!!(v.fechaInstalacion || v.fechaVenta)} title={(v.fechaInstalacion || v.fechaVenta) ? 'Se autodetecta desde la fecha de instalación (o la de venta si aún no hay instalación)' : undefined}>
            <option value="junio">Junio</option><option value="julio">Julio</option>
          </select>
        </div>
      </div>

      {Number(v.portasVoz) > 0 && (
        <p className="text-xs text-fg-muted -mt-1">
          Solo las <span className="text-fg-soft">portas activadas</span> suman a la llave del incentivo. Las solicitadas que aún no se activen cuentan como pendientes.
        </p>
      )}

      <div className="flex flex-wrap gap-4 pt-1">
        <label className="flex items-center gap-2 text-sm text-fg-soft cursor-pointer">
          <input type="checkbox" checked={v.clienteNuevo} onChange={(e) => set('clienteNuevo', e.target.checked)} className="accent-vf-red w-4 h-4" />
          Cliente nuevo
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-soft cursor-pointer">
          <input type="checkbox" checked={v.fibraActiva} onChange={(e) => set('fibraActiva', e.target.checked)} className="accent-vf-red w-4 h-4" />
          Fibra activa (neba o fibra)
        </label>
        {v.marca && (
          <label className="flex items-center gap-2 text-sm text-fg-soft cursor-pointer" title="Los puntos y GP Coins del dispositivo solo cuentan cuando el cliente lo ha recibido.">
            <input type="checkbox" checked={v.dispositivoEntregado} onChange={(e) => set('dispositivoEntregado', e.target.checked)} className="accent-emerald-500 w-4 h-4" />
            Dispositivo entregado al cliente
          </label>
        )}
      </div>

      {v.marca && v.dispositivoEntregado && (
        <div className="max-w-xs">
          <label className="label">Fecha de entrega del dispositivo</label>
          <input type="date" className="input" value={v.fechaEntrega || ''} onChange={(e) => set('fechaEntrega', e.target.value)} />
          <p className="text-[11px] text-fg-muted mt-1">
            Los puntos/GP Coins del dispositivo cuentan en el <span className="text-fg-soft">mes de esta fecha</span>
            {v.fechaEntrega ? <> (<span className="capitalize">{mesDesdeFecha(v.fechaEntrega)}</span>)</> : null}, no en el de la venta.
          </p>
        </div>
      )}

      {v.marca && !v.dispositivoEntregado && (() => {
        const estadoEntrega = estadoEntregaTerminal(v);
        const et = ETIQUETAS_ENTREGA[estadoEntrega];
        const principal = lineaPrincipal(v.lineasMoviles);
        return (
          <div className="-mt-1 space-y-2">
            <p className="text-xs text-amber-400">
              El dispositivo aún no consta como entregado: sus <span className="text-fg-soft">puntos/GP Coins no se cuentan</span> hasta que marques la casilla.
            </p>
            {et && <Badge tone={et.tone}>{et.label}</Badge>}
            {principal?.tipo === 'porta' && (
              <p className="text-[11px] text-fg-muted">Según la línea principal {principal.numero || '(sin número)'} — su porta manda sobre la entrega.</p>
            )}
            {!principal && (lineas.length > 1) && (
              <p className="text-[11px] text-amber-400">Marca cuál es la línea principal para calcular cuándo estará lista la entrega.</p>
            )}
            {(estadoEntrega === 'lista' || v.incidenciaEntrega) && (
              <div className="max-w-xs">
                <label className="label">Incidencia en la entrega <span className="text-fg-muted font-normal">(opcional)</span></label>
                <select className="input" value={v.incidenciaEntrega || ''} onChange={(e) => set('incidenciaEntrega', e.target.value)}>
                  <option value="">Sin incidencia</option>
                  <option value="cliente_ausente">Cliente ausente</option>
                  <option value="rechaza_terminal">Cliente rechaza el terminal</option>
                  <option value="otro">Otra incidencia</option>
                </select>
              </div>
            )}
          </div>
        );
      })()}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="label">Estado de la venta</label>
          <select className="input" value={v.estado} onChange={(e) => set('estado', e.target.value)}>
            {ORDEN_ESTADOS.map((k) => <option key={k} value={k}>{ESTADOS[k].label}</option>)}
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
        <button className="btn-primary" onClick={() => onGuardar(v)}><Check size={16} /> Guardar</button>
      </div>
    </div>
  );
}

export default function Ventas() {
  const { ventas, setVentas, mes, prefillVenta, setPrefillVenta, marcarAgendadoConvertido } = useApp();
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [prefab, setPrefab] = useState(null); // marca/sap o datos de cliente precargados
  const [agendadoRef, setAgendadoRef] = useState(null); // id del agendado origen (si la venta viene de la agenda)
  const [filtroMes, setFiltroMes] = useState(mes);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
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

  // La tabla sigue al Período activo (JUNIO/JULIO) de la cabecera; el
  // desplegable "Todos los meses" sigue disponible para ver ambos a la vez.
  useEffect(() => { setFiltroMes(mes); }, [mes]);

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
      avisos.push('La fecha de venta está fuera del período del incentivo (1 jun → 31 jul 2026).');
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

    setVentas((prev) => {
      const existe = prev.some((p) => p.id === venta.id);
      return existe ? prev.map((p) => (p.id === venta.id ? venta : p)) : [venta, ...prev];
    });
    setForm(false); setEditId(null); setPrefab(null);
    // Si esta alta venía de un agendado, márcalo "Convertido" (solo ahora, al guardar)
    if (agendadoRef) { marcarAgendadoConvertido(agendadoRef); setAgendadoRef(null); }

    if (avisos.length) {
      setMsg({ tone: 'red', text: `Venta guardada. ${avisos.join(' ')}` });
      setTimeout(() => setMsg(null), 7000);
    }
  };

  const eliminar = async (id) => {
    const ok = await confirmar('¿Eliminar esta venta? Esta acción no se puede deshacer.', { titulo: 'Eliminar venta', accion: 'Eliminar', peligro: true });
    if (ok) setVentas((prev) => prev.filter((p) => p.id !== id));
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
      setVentas((prev) => [...nuevas, ...prev]);
      let text = `${nuevas.length} ventas importadas`;
      const omitidas = [];
      if (yaExistian > 0) omitidas.push(`${yaExistian} ya existentes`);
      if (duplicadas > 0) omitidas.push(`${duplicadas} duplicadas`);
      if (omitidas.length) text += ` (${omitidas.join(', ')} omitidas)`;
      if (fueraPeriodo > 0) text += ` · ${fueraPeriodo} fuera de período`;
      text += '.';
      setMsg({ tone: fueraPeriodo > 0 ? 'red' : 'green', text });
    } catch {
      setMsg({ tone: 'red', text: 'Error al leer el Excel. Revisa el formato con la plantilla.' });
    }
    e.target.value = '';
    setTimeout(() => setMsg(null), 4000);
  };

  const nombreMarca = (m) => (m ? CATALOGO[m]?.marca : '');

  return (
    <div className="space-y-6">
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
            title="Se sincroniza con el Período activo de arriba; elige 'Todos los meses' para ver ambos a la vez"
          >
            <option value="todos">Todos los meses</option>
            <option value="junio">Junio</option>
            <option value="julio">Julio</option>
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
          <div
            className="card w-full max-w-5xl p-5 my-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-fg tracking-tight">{editId ? 'Editar venta' : 'Registrar nueva venta'}</h2>
              <button onClick={() => { setForm(false); setEditId(null); setPrefab(null); setAgendadoRef(null); }} className="p-1.5 rounded-lg hover:bg-bg-surface2 text-fg-muted hover:text-fg cursor-pointer" aria-label="Cerrar"><X size={18} /></button>
            </div>
            <FormVenta
              inicial={editId
                ? (() => { const f = ventas.find((v) => v.id === editId); return { ...ventaVacia(), ...f, estado: estadoDe(f) }; })()
                : { ...ventaVacia(), mes, ...(prefab || {}) }}
              onGuardar={guardar}
              onCancelar={() => { setForm(false); setEditId(null); setPrefab(null); setAgendadoRef(null); }}
            />
          </div>
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
            Las filas resaltadas en azul son ventas de otro mes que aparecen aquí porque su porta activa en {filtroMes === 'julio' ? 'julio' : 'junio'}.
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
                                    {p.otroMes && <span className="text-[10px] font-semibold text-fg-muted">{p.mes === 'julio' ? 'Jul' : 'Jun'}</span>}
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
                          <Badge tone={porPortaCruzada ? 'sky' : 'neutral'}>{v.mes === 'julio' ? 'Jul' : 'Jun'}</Badge>
                          {(() => {
                            // Si alguna porta activa en otro mes, se indica aquí
                            const otros = [...mesesImplicados(v)].filter((m) => m !== v.mes);
                            if (!otros.length) return null;
                            return otros.map((m) => (
                              <span key={m} title={`Esta venta es de ${v.mes}, pero su porta activa en ${m} y por eso también cuenta en ese mes`}>
                                <Badge tone="sky">↳ cuenta en {m === 'julio' ? 'Jul' : 'Jun'}</Badge>
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

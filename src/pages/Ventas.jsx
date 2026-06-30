import { useState, useRef, useEffect } from 'react';
import {
  Plus, Upload, Download, FileSpreadsheet, Trash2, Pencil, X, Check, ShoppingCart, HelpCircle, Search,
} from 'lucide-react';
import { useApp } from '../App.jsx';
import { ventaVacia, mesDesdeFecha, unidadesVendidas } from '../lib/engine.js';
import { importarVentas, exportarVentas, plantillaVentas } from '../lib/excel.js';
import { avisosContacto } from '../lib/validacion.js';
import { ESTADOS, ORDEN_ESTADOS, MOTIVOS_BAJA, estadoDe } from '../lib/estados.js';
import { CATALOGO, PERIODO, udsDe, TV_CONTENIDOS } from '../data/incentivos.js';
import { TARIFAS_MOVIL, OPERADORES_PORTA, lineaMovilVacia, resumenLineas } from '../data/movil.js';
import { nuevoId } from '../lib/id.js';
import { Card, SectionTitle, Badge, EmptyState } from '../components/ui.jsx';
import { fmtFecha } from '../lib/format.js';

const VELOCIDADES = ['Fibra 300 MB', 'Fibra 600 MB', 'Fibra 1 GB'];
const MARCAS = Object.keys(CATALOGO);

function FormVenta({ inicial, onGuardar, onCancelar }) {
  const [v, setV] = useState(inicial);
  const set = (k, val) => setV((p) => {
    const next = { ...p, [k]: val };
    if (k === 'fechaVenta') next.mes = mesDesdeFecha(val);
    if (k === 'marca') { next.sap = ''; if (!val) next.dispositivoEntregado = false; }
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
    if (lm.length > 0) Object.assign(next, resumenLineas(lm));
    return next;
  };
  const setLineas = (lm) => setV((p) => recompute({ ...p, lineasMoviles: lm }));
  const addLinea = () => setLineas([...lineas, { id: nuevoId(), ...lineaMovilVacia() }]);
  const updLinea = (id, k, val) => setLineas(lineas.map((l) => {
    if (l.id !== id) return l;
    const nl = { ...l, [k]: val };
    if (k === 'tipo' && val === 'nueva') { nl.operador = ''; nl.activa = false; }
    return nl;
  }));
  const delLinea = (id) => setLineas(lineas.filter((l) => l.id !== id));

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
        <div><label className="label">Fecha de instalación</label><input type="date" className="input" value={v.fechaInstalacion} onChange={(e) => set('fechaInstalacion', e.target.value)} /></div>
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

      {/* Líneas móviles detalladas */}
      <div className="border border-bg-border rounded-lg p-3 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-fg">Líneas móviles {tieneLineas && <span className="text-fg-muted font-normal">({lineas.length})</span>}</span>
          <button type="button" className="btn-ghost text-xs py-1" onClick={addLinea}><Plus size={14} /> Añadir línea</button>
        </div>
        {tieneLineas ? (
          <div className="space-y-2">
            {lineas.map((l, i) => (
              <div key={l.id} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end bg-bg-surface2/50 rounded-lg p-2">
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
          <select className="input" value={v.mes} onChange={(e) => set('mes', e.target.value)} disabled={!!v.fechaVenta} title={v.fechaVenta ? 'Se autodetecta desde la fecha de venta' : undefined}>
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

      {v.marca && !v.dispositivoEntregado && (
        <p className="text-xs text-amber-400 -mt-1">
          El dispositivo aún no consta como entregado: sus <span className="text-fg-soft">puntos/GP Coins no se cuentan</span> hasta que marques la casilla.
        </p>
      )}

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
  const { ventas, setVentas, mes, prefillVenta, setPrefillVenta } = useApp();
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [prefab, setPrefab] = useState(null); // marca/sap precargados desde Catálogo
  const [filtroMes, setFiltroMes] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  // Si llegamos desde "Vender" del Catálogo, abrimos el alta ya prerrellenada
  useEffect(() => {
    if (prefillVenta) {
      setEditId(null);
      setPrefab(prefillVenta);
      setForm(true);
      setPrefillVenta(null);
    }
  }, [prefillVenta, setPrefillVenta]);

  const q = busqueda.trim().toLowerCase();
  const lista = ventas.filter((v) => {
    if (filtroMes !== 'todos' && v.mes !== filtroMes) return false;
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

    if (avisos.length) {
      setMsg({ tone: 'red', text: `Venta guardada. ${avisos.join(' ')}` });
      setTimeout(() => setMsg(null), 7000);
    }
  };

  const eliminar = (id) => {
    if (confirm('¿Eliminar esta venta?')) setVentas((prev) => prev.filter((p) => p.id !== id));
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
          <button className="btn-primary" onClick={() => { setEditId(null); setForm(true); }}>
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
          <select className="input w-auto" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
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

      {form && (
        <Card>
          <SectionTitle>{editId ? 'Editar venta' : 'Registrar nueva venta'}</SectionTitle>
          <FormVenta
            inicial={editId
              ? (() => { const f = ventas.find((v) => v.id === editId); return { ...ventaVacia(), ...f, estado: estadoDe(f) }; })()
              : { ...ventaVacia(), mes, ...(prefab || {}) }}
            onGuardar={guardar}
            onCancelar={() => { setForm(false); setEditId(null); setPrefab(null); }}
          />
        </Card>
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
        {lista.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Sin ventas registradas" hint="Añade una venta manualmente o importa tu Excel para empezar." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-muted border-b border-bg-border">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">F. Venta</th>
                  <th className="px-4 py-3 font-medium">F. Instalación</th>
                  <th className="px-4 py-3 font-medium">Fibra</th>
                  <th className="px-4 py-3 font-medium">Terminal</th>
                  <th className="px-4 py-3 font-medium text-center">Portas</th>
                  <th className="px-4 py-3 font-medium text-center">Mes</th>
                  <th className="px-4 py-3 font-medium text-center">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((v) => {
                  const prod = v.marca ? CATALOGO[v.marca]?.productos.find((p) => p.sap === v.sap) : null;
                  return (
                    <tr key={v.id} className="border-b border-bg-border/60 hover:bg-bg-surface2/50">
                      <td className="px-4 py-3">
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
                      </td>
                      <td className="px-4 py-3 text-fg-muted tabnum">{fmtFecha(v.fechaVenta)}</td>
                      <td className="px-4 py-3 text-fg-muted tabnum">{fmtFecha(v.fechaInstalacion)}</td>
                      <td className="px-4 py-3 text-fg-soft">
                        {v.convergencia ? `${v.convergencia} · ${v.velocidad}` : '—'}
                        {v.tv && <span className="block text-[11px] text-fg-muted">📺 {v.tv}</span>}
                      </td>
                      <td className="px-4 py-3 text-fg-soft">
                        {prod
                          ? (
                            <span>
                              <span title={prod.modelo}>{nombreMarca(v.marca)} · {prod.modelo.slice(0, 22)}{prod.modelo.length > 22 ? '…' : ''}</span>
                              <span className="block mt-0.5">
                                {v.dispositivoEntregado
                                  ? <Badge tone="green">Entregado</Badge>
                                  : <Badge tone="gold">Sin entregar</Badge>}
                              </span>
                            </span>
                          )
                          : <span className="text-fg-muted italic">Sin terminal</span>}
                      </td>
                      <td className="px-4 py-3 text-center tabnum">
                        {Number(v.portasVoz) > 0 ? (
                          <span title="Portas activas / solicitadas">
                            <span className="text-emerald-400">{Math.min(Number(v.portasActivas) || 0, v.portasVoz)}</span>
                            <span className="text-fg-muted"> / {v.portasVoz}</span>
                          </span>
                        ) : <span className="text-fg-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-center"><Badge tone="neutral">{v.mes === 'julio' ? 'Jul' : 'Jun'}</Badge></td>
                      <td className="px-4 py-3">
                        <select
                          value={estadoDe(v)}
                          onChange={(e) => cambiarEstado(v.id, e.target.value)}
                          className="bg-bg-surface2 border border-bg-border rounded-md px-2 py-1 text-xs text-fg cursor-pointer focus:outline-none focus:ring-1 focus:ring-vf-red"
                          title="Cambiar estado rápido"
                        >
                          {ORDEN_ESTADOS.map((k) => <option key={k} value={k}>{ESTADOS[k].label}</option>)}
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1 justify-end">
                          <button className="p-2 rounded-lg hover:bg-bg-border text-fg-muted hover:text-fg cursor-pointer" onClick={() => { setEditId(v.id); setForm(true); }} aria-label="Editar"><Pencil size={15} /></button>
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
    </div>
  );
}

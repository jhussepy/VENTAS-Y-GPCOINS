import { useState, useRef, useMemo } from 'react';
import {
  Plus, Upload, Download, FileSpreadsheet, Trash2, Pencil, X, Check, Wifi, Search,
} from 'lucide-react';
import { useApp } from '../App.jsx';
import {
  ventaLowiVacia, ESTADOS_LOWI, ORDEN_ESTADOS, PRODUCTOS_LOWI,
  VELOCIDADES_LOWI, MOTIVOS_BAJA, mesLowi, etiquetaMesLowi,
} from '../lib/lowi.js';
import { importarLowi, exportarLowi, plantillaLowi } from '../lib/excelLowi.js';
import { avisosContacto } from '../lib/validacion.js';
import { Card, SectionTitle, Badge, EmptyState } from '../components/ui.jsx';
import { fmtFecha, fmtEur } from '../lib/format.js';

function FormLowi({ inicial, onGuardar, onCancelar }) {
  const [v, setV] = useState(inicial);
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));
  const esBaja = v.estado === 'baja' || v.estado === 'cancelada';
  const llevaFibra = v.producto === 'fibra' || v.producto === 'fibra_movil';
  const llevaMovil = v.producto === 'movil' || v.producto === 'fibra_movil';
  const avisosDatos = avisosContacto(v);

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
        <div><label className="label">Nº pedido / contrato <span className="text-fg-muted font-normal">(opcional)</span></label><input className="input" value={v.pedido} onChange={(e) => set('pedido', e.target.value)} /></div>
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
          <input type="number" min="0" className="input" value={v.lineas} onChange={(e) => set('lineas', (Number(e.target.value) || 0))} disabled={!llevaMovil} />
        </div>
        <div>
          <label className="label">Cuota mensual (€)</label>
          <input type="number" min="0" step="0.01" className="input" value={v.cuota} onChange={(e) => set('cuota', (Number(e.target.value) || 0))} />
        </div>
      </div>

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
    return [v.nombre, v.apellido, v.dni, v.telefono, v.email, v.pedido]
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
                <tr className="text-left text-xs text-fg-muted border-b border-bg-border">
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">F. Venta</th>
                  <th className="px-4 py-3 font-medium">F. Instalación</th>
                  <th className="px-4 py-3 font-medium">Producto</th>
                  <th className="px-4 py-3 font-medium text-right">Cuota</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((v) => (
                  <tr key={v.id} className="border-b border-bg-border/60 hover:bg-bg-surface2/50">
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
                    </td>
                    <td className="px-4 py-3 text-right text-fg-soft tabnum">{v.cuota ? fmtEur(v.cuota) : '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={v.estado}
                        onChange={(e) => cambiarEstado(v.id, e.target.value)}
                        className="bg-bg-surface2 border border-bg-border rounded-md px-2 py-1 text-xs text-fg cursor-pointer focus:outline-none focus:ring-1 focus:ring-vf-red"
                        title="Cambiar estado rápido"
                      >
                        {ORDEN_ESTADOS.map((k) => <option key={k} value={k}>{ESTADOS_LOWI[k].label}</option>)}
                      </select>
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

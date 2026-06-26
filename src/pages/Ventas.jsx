import { useState, useRef } from 'react';
import {
  Plus, Upload, Download, FileSpreadsheet, Trash2, Pencil, X, Check, ShoppingCart, HelpCircle,
} from 'lucide-react';
import { useApp } from '../App.jsx';
import { ventaVacia, mesDesdeFecha } from '../lib/engine.js';
import { importarVentas, exportarVentas, plantillaVentas } from '../lib/excel.js';
import { CATALOGO } from '../data/incentivos.js';
import { Card, SectionTitle, Badge, EmptyState } from '../components/ui.jsx';
import { fmtFecha } from '../lib/format.js';

const VELOCIDADES = ['Fibra 300 MB', 'Fibra 600 MB', 'Fibra 1 GB'];
const MARCAS = Object.keys(CATALOGO);

function FormVenta({ inicial, onGuardar, onCancelar }) {
  const [v, setV] = useState(inicial);
  const set = (k, val) => setV((p) => {
    const next = { ...p, [k]: val };
    if (k === 'fechaVenta') next.mes = mesDesdeFecha(val);
    if (k === 'marca') next.sap = '';
    return next;
  });

  const productos = v.marca ? CATALOGO[v.marca]?.productos ?? [] : [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div><label className="label">Nombre</label><input className="input" value={v.nombre} onChange={(e) => set('nombre', e.target.value)} /></div>
        <div><label className="label">Apellido</label><input className="input" value={v.apellido} onChange={(e) => set('apellido', e.target.value)} /></div>
        <div><label className="label">Fecha de venta</label><input type="date" className="input" value={v.fechaVenta} onChange={(e) => set('fechaVenta', e.target.value)} /></div>
        <div><label className="label">Fecha de instalación</label><input type="date" className="input" value={v.fechaInstalacion} onChange={(e) => set('fechaInstalacion', e.target.value)} /></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div>
          <label className="label">Convergencia (fibra)</label>
          <select className="input" value={v.convergencia} onChange={(e) => set('convergencia', e.target.value)}>
            <option value="">—</option><option value="3P">3P</option><option value="4P">4P</option>
          </select>
        </div>
        <div>
          <label className="label">Velocidad</label>
          <select className="input" value={v.velocidad} onChange={(e) => set('velocidad', e.target.value)}>
            <option value="">—</option>
            {VELOCIDADES.map((x) => <option key={x} value={x}>{x}</option>)}
          </select>
        </div>
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

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div><label className="label">Cantidad</label><input type="number" min="1" className="input" value={v.cantidad} onChange={(e) => set('cantidad', Number(e.target.value))} /></div>
        <div><label className="label">Portas voz</label><input type="number" min="0" className="input" value={v.portasVoz} onChange={(e) => set('portasVoz', Number(e.target.value))} /></div>
        <div><label className="label">Líneas voz (total)</label><input type="number" min="0" className="input" value={v.lineasVoz} onChange={(e) => set('lineasVoz', Number(e.target.value))} /></div>
        <div>
          <label className="label flex items-center gap-1">
            TIL65
            <span
              className="inline-flex"
              title="Líneas TIL65 incluidas en esta venta. Solo cuentan las que van dentro de activaciones de cliente nuevo 3P o 4P. Llave: 4 mínimo en el mes."
            >
              <HelpCircle size={13} className="text-fg-muted cursor-help" />
            </span>
          </label>
          <input type="number" min="0" className="input" value={v.til65} onChange={(e) => set('til65', Number(e.target.value))} />
        </div>
        <div><label className="label">Secure Net</label><input type="number" min="0" className="input" value={v.secureNet} onChange={(e) => set('secureNet', Number(e.target.value))} /></div>
        <div>
          <label className="label">Mes (auto)</label>
          <select className="input" value={v.mes} onChange={(e) => set('mes', e.target.value)}>
            <option value="junio">Junio</option><option value="julio">Julio</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 pt-1">
        <label className="flex items-center gap-2 text-sm text-fg-soft cursor-pointer">
          <input type="checkbox" checked={v.clienteNuevo} onChange={(e) => set('clienteNuevo', e.target.checked)} className="accent-vf-red w-4 h-4" />
          Cliente nuevo
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-soft cursor-pointer">
          <input type="checkbox" checked={v.fibraActiva} onChange={(e) => set('fibraActiva', e.target.checked)} className="accent-vf-red w-4 h-4" />
          Fibra activa (neba o fibra)
        </label>
        <label className="flex items-center gap-2 text-sm text-fg-soft cursor-pointer">
          <input type="checkbox" checked={v.instalacionActiva} onChange={(e) => set('instalacionActiva', e.target.checked)} className="accent-emerald-500 w-4 h-4" />
          Instalación activa
        </label>
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
  const { ventas, setVentas, mes } = useApp();
  const [form, setForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [filtroMes, setFiltroMes] = useState('todos');
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);

  const lista = ventas.filter((v) => filtroMes === 'todos' || v.mes === filtroMes);

  const guardar = (venta) => {
    setVentas((prev) => {
      const existe = prev.some((p) => p.id === venta.id);
      return existe ? prev.map((p) => (p.id === venta.id ? venta : p)) : [venta, ...prev];
    });
    setForm(false); setEditId(null);
  };

  const eliminar = (id) => {
    if (confirm('¿Eliminar esta venta?')) setVentas((prev) => prev.filter((p) => p.id !== id));
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const nuevas = await importarVentas(file);
      setVentas((prev) => [...nuevas, ...prev]);
      setMsg({ tone: 'green', text: `${nuevas.length} ventas importadas correctamente.` });
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
        <select className="input w-auto" value={filtroMes} onChange={(e) => setFiltroMes(e.target.value)}>
          <option value="todos">Todos los meses</option>
          <option value="junio">Junio</option>
          <option value="julio">Julio</option>
        </select>
      </div>

      {msg && <div className={`text-sm px-4 py-2 rounded-lg ${msg.tone === 'green' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-vf-red/15 text-vf-redLight'}`} role="alert">{msg.text}</div>}

      {form && (
        <Card>
          <SectionTitle>{editId ? 'Editar venta' : 'Registrar nueva venta'}</SectionTitle>
          <FormVenta
            inicial={editId ? ventas.find((v) => v.id === editId) : { ...ventaVacia(), mes }}
            onGuardar={guardar}
            onCancelar={() => { setForm(false); setEditId(null); }}
          />
        </Card>
      )}

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-bg-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg">Ventas registradas</h2>
          <Badge tone="neutral">{lista.length} registros</Badge>
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
                        <div className="flex gap-1 mt-1">
                          {v.clienteNuevo && <Badge tone="red">Nuevo</Badge>}
                          {v.fibraActiva && <Badge tone="neutral">Fibra</Badge>}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-fg-muted tabnum">{fmtFecha(v.fechaVenta)}</td>
                      <td className="px-4 py-3 text-fg-muted tabnum">{fmtFecha(v.fechaInstalacion)}</td>
                      <td className="px-4 py-3 text-fg-soft">
                        {v.convergencia ? `${v.convergencia} · ${v.velocidad}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-fg-soft">
                        {prod
                          ? <span title={prod.modelo}>{nombreMarca(v.marca)} · {prod.modelo.slice(0, 22)}{prod.modelo.length > 22 ? '…' : ''}</span>
                          : <span className="text-fg-muted italic">Sin terminal</span>}
                      </td>
                      <td className="px-4 py-3 text-center"><Badge tone="neutral">{v.mes === 'julio' ? 'Jul' : 'Jun'}</Badge></td>
                      <td className="px-4 py-3 text-center">
                        {v.instalacionActiva ? <Badge tone="green">Activa</Badge> : <Badge tone="neutral">Pendiente</Badge>}
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

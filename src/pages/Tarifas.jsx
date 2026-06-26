import { useState, useRef } from 'react';
import { Plus, Upload, FileSpreadsheet, Trash2, Tag, Tv, Zap } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage.js';
import {
  TARIFAS_EXCLUSIVO, OTT_COLS, PROMO_FLASH, FLASH_OTT,
} from '../data/tarifas.js';
import { importarTarifas, plantillaTarifas } from '../lib/excelTarifas.js';
import { Card, SectionTitle, Badge, EmptyState } from '../components/ui.jsx';
import { fmtEur } from '../lib/format.js';

const TABS = [
  { id: 'exclusivo', label: 'Exclusivo 30%', icon: Tag },
  { id: 'flash', label: 'Promo Flash', icon: Zap },
  { id: 'mias', label: 'Mis tarifas', icon: Tv },
];

function TablaExclusivo() {
  const [fibra, setFibra] = useState('todas');
  const [lineas, setLineas] = useState('todas');
  const fibras = ['todas', ...new Set(TARIFAS_EXCLUSIVO.map((t) => t.fibra))];
  const filtradas = TARIFAS_EXCLUSIVO.filter(
    (t) => (fibra === 'todas' || t.fibra === fibra) && (lineas === 'todas' || t.lineas === lineas)
  );

  return (
    <Card className="!p-0 overflow-hidden">
      <div className="p-5 border-b border-bg-border flex flex-wrap items-center gap-3 justify-between">
        <h2 className="text-lg font-semibold text-white">Oferta Exclusivo 30% · Origen Contrato</h2>
        <div className="flex gap-2">
          <select className="input w-auto text-xs" value={fibra} onChange={(e) => setFibra(e.target.value)}>
            {fibras.map((f) => <option key={f} value={f}>{f === 'todas' ? 'Todas las fibras' : f}</option>)}
          </select>
          <select className="input w-auto text-xs" value={lineas} onChange={(e) => setLineas(e.target.value)}>
            <option value="todas">Mono + Multi</option>
            <option value="Monolínea">Monolínea</option>
            <option value="Multilínea">Multilínea</option>
          </select>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-slate-400 border-b border-bg-border bg-bg-surface2/40">
              <th className="px-3 py-2 font-medium sticky left-0 bg-bg-surface z-10">Móvil</th>
              {OTT_COLS.map((c) => (
                <th key={c.key} className="px-3 py-2 font-medium text-right whitespace-nowrap" title={c.grupo}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtradas.map((t, i) => (
              <tr key={i} className="border-b border-bg-border/50 hover:bg-bg-surface2/40">
                <td className="px-3 py-2 sticky left-0 bg-bg-surface z-10">
                  <div className="flex items-center gap-2 whitespace-nowrap">
                    <span className="text-white font-medium">{t.movil}</span>
                    {t.promo && <Badge tone="red">X3M</Badge>}
                  </div>
                  <span className="text-[10px] text-slate-500">{t.fibra} · {t.lineas}</span>
                </td>
                {OTT_COLS.map((c) => (
                  <td key={c.key} className={`px-3 py-2 text-right tabnum whitespace-nowrap ${t.promo ? 'text-vf-redLight' : 'text-slate-300'}`}>
                    {t.precios[c.key] != null ? fmtEur(t.precios[c.key]) : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="p-4 text-[11px] text-slate-500 border-t border-bg-border">
        <Badge tone="red">X3M</Badge> = precio promocional durante 3 meses; luego pasa al precio normal.
        N = Netflix · P = Prime · Mx = Max · D+ = Disney+ · C/Anunc. = con anuncios.
      </div>
    </Card>
  );
}

function PromoFlash() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {PROMO_FLASH.map((p, i) => (
        <Card key={i}>
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-white">{p.paquete}</h3>
            {p.promo && <Badge tone="red">X3 meses</Badge>}
          </div>
          <p className="text-xs text-slate-500 mb-4">{p.detalle}</p>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-bg-border">
                <th className="py-2 font-medium">OTT</th>
                <th className="py-2 font-medium text-right">{p.promo ? 'X3 meses' : 'Precio'}</th>
                {p.promo && <th className="py-2 font-medium text-right">Después</th>}
              </tr>
            </thead>
            <tbody>
              {FLASH_OTT.map((o) => (
                <tr key={o.key} className="border-b border-bg-border/50">
                  <td className="py-2 text-slate-300">{o.label}</td>
                  <td className="py-2 text-right tabnum text-gp-gold font-medium">{fmtEur(p.precios[o.key])}</td>
                  {p.promo && <td className="py-2 text-right tabnum text-slate-400">{fmtEur(p.preciosNormal[o.key])}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      ))}
    </div>
  );
}

function MisTarifas() {
  const [tarifas, setTarifas] = useLocalStorage('vf_tarifas', []);
  const [form, setForm] = useState({ concepto: '', descripcion: '', precio: '', promo: '' });
  const fileRef = useRef(null);

  const add = () => {
    if (!form.concepto) return;
    setTarifas((p) => [{ id: crypto.randomUUID(), ...form, precio: Number(form.precio) || 0 }, ...p]);
    setForm({ concepto: '', descripcion: '', precio: '', promo: '' });
  };
  const del = (id) => setTarifas((p) => p.filter((t) => t.id !== id));
  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const nuevas = await importarTarifas(file);
      setTarifas((p) => [...nuevas, ...p]);
    } catch { /* ignore */ }
    e.target.value = '';
  };

  return (
    <div className="space-y-6">
      <Card>
        <SectionTitle right={
          <div className="flex gap-2">
            <button className="btn-ghost" onClick={() => fileRef.current?.click()}><Upload size={16} /> Importar Excel</button>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImport} />
            <button className="btn-ghost" onClick={plantillaTarifas}><FileSpreadsheet size={16} /> Plantilla</button>
          </div>
        }>Añadir tarifa manual</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <div className="lg:col-span-1"><label className="label">Concepto</label><input className="input" value={form.concepto} onChange={(e) => setForm({ ...form, concepto: e.target.value })} /></div>
          <div className="lg:col-span-2"><label className="label">Descripción</label><input className="input" value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
          <div><label className="label">Precio (€)</label><input type="number" step="0.01" className="input" value={form.precio} onChange={(e) => setForm({ ...form, precio: e.target.value })} /></div>
          <div className="flex gap-2">
            <input className="input" placeholder="Promo" value={form.promo} onChange={(e) => setForm({ ...form, promo: e.target.value })} />
            <button className="btn-primary shrink-0" onClick={add}><Plus size={16} /></button>
          </div>
        </div>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-bg-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Mis tarifas</h2>
          <Badge tone="neutral">{tarifas.length}</Badge>
        </div>
        {tarifas.length === 0 ? (
          <EmptyState icon={Tag} title="Sin tarifas personalizadas" hint="Añade tarifas manualmente o impórtalas desde Excel." />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-slate-400 border-b border-bg-border">
                <th className="px-4 py-3 font-medium">Concepto</th>
                <th className="px-4 py-3 font-medium">Descripción</th>
                <th className="px-4 py-3 font-medium text-right">Precio</th>
                <th className="px-4 py-3 font-medium">Promo</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {tarifas.map((t) => (
                <tr key={t.id} className="border-b border-bg-border/60 hover:bg-bg-surface2/50">
                  <td className="px-4 py-3 text-white font-medium">{t.concepto}</td>
                  <td className="px-4 py-3 text-slate-400">{t.descripcion || '—'}</td>
                  <td className="px-4 py-3 text-right tabnum text-gp-gold">{fmtEur(t.precio)}</td>
                  <td className="px-4 py-3">{t.promo ? <Badge tone="red">{t.promo}</Badge> : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    <button className="p-2 rounded-lg hover:bg-vf-red/20 text-slate-400 hover:text-vf-redLight cursor-pointer" onClick={() => del(t.id)} aria-label="Eliminar"><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

export default function Tarifas() {
  const [tab, setTab] = useState('exclusivo');
  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`btn ${tab === t.id ? 'bg-vf-red text-white' : 'bg-bg-surface2 text-slate-300 border border-bg-border hover:bg-bg-border'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>
      {tab === 'exclusivo' && <TablaExclusivo />}
      {tab === 'flash' && <PromoFlash />}
      {tab === 'mias' && <MisTarifas />}
    </div>
  );
}

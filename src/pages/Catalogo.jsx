import { useState, useMemo } from 'react';
import { Smartphone, Search } from 'lucide-react';
import { useApp } from '../App.jsx';
import { CATALOGO, ptsDe, gpDe, udsDe, estDe } from '../data/incentivos.js';
import { unidadesVendidas } from '../lib/engine.js';
import { Card, Badge, EstrellaTag, EmptyState } from '../components/ui.jsx';
import { fmtNum } from '../lib/format.js';

const MARCAS = Object.keys(CATALOGO);
const ETIQ_MEC = {
  ranking: { tone: 'neutral', txt: 'Ranking (puntos)' },
  directo: { tone: 'gold', txt: 'Directo al monedero' },
  mixta: { tone: 'red', txt: 'Ranking + directo + sorteo' },
};

export default function Catalogo() {
  const { ventas, mes } = useApp();
  const [marca, setMarca] = useState('xiaomi');
  const [q, setQ] = useState('');

  const cat = CATALOGO[marca];
  const vendidas = useMemo(() => unidadesVendidas(ventas, marca, mes), [ventas, marca, mes]);

  const productos = cat.productos.filter(
    (p) => p.modelo.toLowerCase().includes(q.toLowerCase()) || p.sap.includes(q)
  );

  const tieneRanking = cat.mecanica === 'ranking' || cat.mecanica === 'mixta';
  const tieneDirecto = cat.mecanica === 'directo' || cat.mecanica === 'mixta';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-2 flex-wrap">
          {MARCAS.map((m) => (
            <button key={m} onClick={() => setMarca(m)}
              className={`btn ${marca === m ? 'bg-vf-red text-white' : 'bg-bg-surface2 text-fg-soft border border-bg-border hover:bg-bg-border'}`}>
              {CATALOGO[m].marca}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input className="input pl-9 w-56" placeholder="Buscar modelo o SAP…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-bg-border flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-bg-surface2 text-vf-red"><Smartphone size={20} /></div>
            <div>
              <h2 className="text-lg font-semibold text-fg">{cat.marca}</h2>
              <Badge tone={ETIQ_MEC[cat.mecanica].tone}>{ETIQ_MEC[cat.mecanica].txt}</Badge>
            </div>
          </div>
          <div className="text-xs text-fg-muted">
            Stock limitado por: <span className="text-fg-soft">{cat.stockPor === 'familia' ? 'familia' : cat.stockPor === 'modelo' ? 'modelo' : 'sin límite'}</span>
          </div>
        </div>

        {productos.length === 0 ? (
          <EmptyState icon={Smartphone} title="Sin resultados" hint="Prueba otra búsqueda." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-muted border-b border-bg-border">
                  <th className="px-4 py-3 font-medium">SAP</th>
                  <th className="px-4 py-3 font-medium">Modelo</th>
                  {cat.stockPor === 'familia' && <th className="px-4 py-3 font-medium">Familia</th>}
                  {tieneRanking && <th className="px-4 py-3 font-medium text-right">Puntos ({mes})</th>}
                  {tieneDirecto && <th className="px-4 py-3 font-medium text-right">GP directo</th>}
                  {tieneDirecto && <th className="px-4 py-3 font-medium text-right">Uds / Vendidas</th>}
                  <th className="px-4 py-3 font-medium text-center">Destacado</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const uds = udsDe(p, mes);
                  const vend = cat.stockPor === 'familia'
                    ? (vendidas.porFamilia[p.familia] || 0)
                    : (vendidas.porModelo[p.sap] || 0);
                  const gp = gpDe(p, mes);
                  return (
                    <tr key={p.sap} className="border-b border-bg-border/60 hover:bg-bg-surface2/50">
                      <td className="px-4 py-3 tabnum text-fg-muted">{p.sap}</td>
                      <td className="px-4 py-3 text-fg">{p.modelo}</td>
                      {cat.stockPor === 'familia' && <td className="px-4 py-3 text-fg-muted">{p.familia}</td>}
                      {tieneRanking && <td className="px-4 py-3 text-right tabnum text-vf-redLight font-medium">{ptsDe(p, mes) ? fmtNum(ptsDe(p, mes)) : '—'}</td>}
                      {tieneDirecto && <td className="px-4 py-3 text-right tabnum text-gp-gold font-medium">{gp ? `${gp} GP` : '—'}</td>}
                      {tieneDirecto && (
                        <td className="px-4 py-3 text-right tabnum">
                          {uds ? (
                            <span className={vend >= uds ? 'text-vf-redLight' : 'text-fg-muted'}>
                              {fmtNum(vend)} / {fmtNum(uds)}
                            </span>
                          ) : '—'}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        {estDe(p, mes) ? <EstrellaTag tipo={cat.mecanica === 'mixta' ? 'DESTACADO' : 'ESTRELLA'} /> : <span className="text-fg-muted">—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {cat.notaStock && (
        <p className="text-xs text-fg-muted">{CATALOGO[marca].marca}: stock por {cat.stockPor}.</p>
      )}
    </div>
  );
}

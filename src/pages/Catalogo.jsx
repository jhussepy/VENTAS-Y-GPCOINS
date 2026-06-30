import { useState, useMemo } from 'react';
import { Smartphone, Search, Star, ShoppingCart, ArrowDownUp } from 'lucide-react';
import { useApp } from '../App.jsx';
import { CATALOGO, ptsDe, gpDe, udsDe, estDe, PERIODO } from '../data/incentivos.js';
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
  const { ventas, mes, venderModelo } = useApp();
  const [marca, setMarca] = useState('xiaomi');
  const [q, setQ] = useState('');
  const [orden, setOrden] = useState('desc');       // desc | asc por valor
  const [soloEstrella, setSoloEstrella] = useState(false);
  const [soloStock, setSoloStock] = useState(false);

  const cat = CATALOGO[marca];
  const vendidas = useMemo(() => unidadesVendidas(ventas, marca, mes), [ventas, marca, mes]);

  const tieneRanking = cat.mecanica === 'ranking' || cat.mecanica === 'mixta';
  const tieneDirecto = cat.mecanica === 'directo' || cat.mecanica === 'mixta';
  const otroMes = mes === 'junio' ? 'julio' : 'junio';

  // Valor principal de un producto (puntos si es ranking, GP si es directo)
  const valorDe = (p, m) => (tieneRanking ? ptsDe(p, m) : gpDe(p, m));
  // Unidades vendidas de un producto (por familia o por modelo)
  const vendDe = (p) => (cat.stockPor === 'familia' ? (vendidas.porFamilia[p.familia] || 0) : (vendidas.porModelo[p.sap] || 0));

  const productos = useMemo(() => {
    let lista = cat.productos.filter(
      (p) => p.modelo.toLowerCase().includes(q.toLowerCase()) || p.sap.includes(q)
    );
    if (soloEstrella) lista = lista.filter((p) => estDe(p, mes));
    if (soloStock && tieneDirecto) lista = lista.filter((p) => udsDe(p, mes) - vendDe(p) > 0);
    return [...lista].sort((a, b) => (orden === 'desc' ? valorDe(b, mes) - valorDe(a, mes) : valorDe(a, mes) - valorDe(b, mes)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, q, soloEstrella, soloStock, orden, mes, vendidas]);

  // Resumen de la marca
  const resumen = useMemo(() => {
    const maxVal = cat.productos.reduce((m, p) => Math.max(m, valorDe(p, mes)), 0);
    const estrellas = cat.productos.filter((p) => estDe(p, mes)).length;
    return { total: cat.productos.length, maxVal, estrellas };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, mes]);

  const unidad = tieneRanking ? 'pts' : 'GP';

  return (
    <div className="space-y-6">
      {/* Selector de marca + buscador */}
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

      {/* Resumen de la marca */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card p-4">
          <p className="text-xs text-fg-muted">Modelos</p>
          <p className="text-xl font-semibold text-fg tabnum">{fmtNum(resumen.total)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-fg-muted">Máximo ({PERIODO.etiquetas[mes]})</p>
          <p className={`text-xl font-semibold tabnum ${tieneRanking ? 'text-vf-redLight' : 'text-gp-gold'}`}>{fmtNum(resumen.maxVal)} {unidad}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-fg-muted">Destacados ⭐</p>
          <p className="text-xl font-semibold text-fg tabnum">{fmtNum(resumen.estrellas)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-fg-muted">Stock</p>
          <p className="text-sm font-medium text-fg-soft mt-1">{cat.stockPor === 'sin-limite' ? 'Sin límite' : `Por ${cat.stockPor}`}</p>
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
          {/* Controles: orden y filtros */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setOrden((o) => (o === 'desc' ? 'asc' : 'desc'))}
              className="btn bg-bg-surface2 text-fg-soft border border-bg-border hover:bg-bg-border text-xs"
              title="Ordenar por valor"
            >
              <ArrowDownUp size={14} /> {orden === 'desc' ? 'Mayor primero' : 'Menor primero'}
            </button>
            <button
              onClick={() => setSoloEstrella((s) => !s)}
              className={`btn text-xs ${soloEstrella ? 'bg-gp-gold text-black' : 'bg-bg-surface2 text-fg-soft border border-bg-border hover:bg-bg-border'}`}
            >
              <Star size={14} /> Destacados
            </button>
            {tieneDirecto && (
              <button
                onClick={() => setSoloStock((s) => !s)}
                className={`btn text-xs ${soloStock ? 'bg-emerald-600 text-white' : 'bg-bg-surface2 text-fg-soft border border-bg-border hover:bg-bg-border'}`}
              >
                Con stock
              </button>
            )}
          </div>
        </div>

        {productos.length === 0 ? (
          <EmptyState icon={Smartphone} title="Sin resultados" hint="Prueba otra búsqueda o quita los filtros." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-muted border-b border-bg-border">
                  <th className="px-4 py-3 font-medium">SAP</th>
                  <th className="px-4 py-3 font-medium">Modelo</th>
                  {tieneRanking && <th className="px-4 py-3 font-medium text-right">Puntos</th>}
                  {tieneDirecto && <th className="px-4 py-3 font-medium text-right">GP directo</th>}
                  {tieneDirecto && <th className="px-4 py-3 font-medium">Stock</th>}
                  <th className="px-4 py-3 font-medium text-center">Destacado</th>
                  <th className="px-4 py-3 font-medium text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const uds = udsDe(p, mes);
                  const vend = vendDe(p);
                  const restante = Math.max(0, uds - vend);
                  const pctStock = uds > 0 ? Math.min(100, (vend / uds) * 100) : 0;
                  const colorStock = pctStock >= 100 ? '#E60000' : pctStock >= 70 ? '#FFB81C' : '#10B981';
                  const pts = ptsDe(p, mes); const ptsOtro = ptsDe(p, otroMes);
                  const gp = gpDe(p, mes);
                  return (
                    <tr key={p.sap} className="border-b border-bg-border/60 hover:bg-bg-surface2/50">
                      <td className="px-4 py-3 tabnum text-fg-muted">{p.sap}</td>
                      <td className="px-4 py-3 text-fg">
                        {p.modelo}
                        {cat.stockPor === 'familia' && <span className="block text-[11px] text-fg-muted">Familia: {p.familia}</span>}
                      </td>
                      {tieneRanking && (
                        <td className="px-4 py-3 text-right tabnum">
                          <span className="text-vf-redLight font-medium">{pts ? fmtNum(pts) : '—'}</span>
                          {pts !== ptsOtro && (
                            <span className="block text-[11px] text-fg-muted">
                              {PERIODO.etiquetas[otroMes].slice(0, 3)}: {fmtNum(ptsOtro)} {ptsOtro > pts ? '↑' : '↓'}
                            </span>
                          )}
                        </td>
                      )}
                      {tieneDirecto && <td className="px-4 py-3 text-right tabnum text-gp-gold font-medium">{gp ? `${gp} GP` : '—'}</td>}
                      {tieneDirecto && (
                        <td className="px-4 py-3 min-w-[140px]">
                          {uds ? (
                            <div>
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="text-fg-muted">Quedan {fmtNum(restante)}</span>
                                <span className="text-fg-muted tabnum">{fmtNum(vend)}/{fmtNum(uds)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-bg-surface2 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pctStock}%`, background: colorStock }} />
                              </div>
                            </div>
                          ) : <span className="text-fg-muted">—</span>}
                        </td>
                      )}
                      <td className="px-4 py-3 text-center">
                        {estDe(p, mes) ? <EstrellaTag tipo={cat.mecanica === 'mixta' ? 'DESTACADO' : 'ESTRELLA'} /> : <span className="text-fg-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => venderModelo(marca, p.sap)}
                          className="btn bg-vf-red hover:bg-vf-redDark text-white text-xs py-1.5"
                          title="Registrar una venta con este modelo"
                        >
                          <ShoppingCart size={13} /> Vender
                        </button>
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

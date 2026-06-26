import { useMemo } from 'react';
import { Coins, Wallet, Trophy, TrendingUp, Wifi } from 'lucide-react';
import { useApp } from '../App.jsx';
import { resumenGlobal, puntosClienteNuevo, portasDetalle } from '../lib/engine.js';
import { INCENTIVOS, PUNTOS_CONVERGENCIA, PERIODO, convPts } from '../data/incentivos.js';
import { StatCard, Card, SectionTitle, Badge } from '../components/ui.jsx';
import { fmtNum } from '../lib/format.js';

export default function GPCoins() {
  const { ventas, mes } = useApp();
  const r = useMemo(() => resumenGlobal(ventas, mes), [ventas, mes]);

  // Desglose de puntos de fibra (Cliente Nuevo) por convergencia
  const desgloseFibra = useMemo(() => {
    const delMes = ventas.filter((v) => v.mes === mes && v.convergencia && v.velocidad);
    return PUNTOS_CONVERGENCIA.map((row) => {
      const count = delMes.filter((v) => v.convergencia === row.tipo && v.velocidad === row.velocidad).length;
      return { ...row, count, total: count * convPts(row, mes) };
    }).filter((x) => x.count > 0);
  }, [ventas, mes]);

  const ptsFibra = puntosClienteNuevo(ventas, mes);

  // Detalle de la llave de portas (común a todos los incentivos): % y X/Y portas
  const portas = useMemo(() => portasDetalle(ventas, mes), [ventas, mes]);
  // Objetivo de portas (75%) tomado de la llave 'portas' de cualquier incentivo
  const objetivoPortas = INCENTIVOS.clienteNuevo.llaves.find((l) => l.id === 'portas')?.objetivo ?? 75;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={Wallet} label="GP Coins directos al monedero" value={fmtNum(r.gpDirectosTotal)} sub="Samsung · Honor · JBL · Motorola" accent="text-gp-gold" />
        <StatCard icon={Trophy} label="GP Coins potenciales (ranking)" value={fmtNum(r.gpPotencialRanking)} sub="Si quedas 1º en los que clasificas" accent="text-emerald-400" />
        <StatCard icon={TrendingUp} label="Puntos de fibra (Cliente Nuevo)" value={fmtNum(ptsFibra)} accent="text-vf-red" />
        <StatCard icon={Coins} label="Total estimado GP Coins" value={fmtNum(r.gpDirectosTotal + r.gpPotencialRanking)} sub="Directos + mejor ranking" accent="text-gp-gold" />
      </div>

      {/* Llave de portas (común a todos los incentivos): % alcanzado y detalle X/Y */}
      <Card>
        <SectionTitle right={<Badge tone="neutral">{PERIODO.etiquetas[mes]}</Badge>}>
          Portas voz móvil (Individual)
        </SectionTitle>
        <div className="flex items-baseline gap-3">
          <p className={`text-3xl font-semibold tabnum ${portas.pct >= objetivoPortas ? 'text-emerald-400' : 'text-fg'}`}>
            {portas.pct}%
          </p>
          <span className="text-sm text-fg-soft tabnum">{portas.portas}/{portas.lineas} portas</span>
          <span className="text-xs text-fg-muted">objetivo {objetivoPortas}%</span>
        </div>
      </Card>

      <Card>
        <SectionTitle right={<Badge tone="neutral">{PERIODO.etiquetas[mes]}</Badge>}>
          GP Coins por incentivo
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-fg-muted border-b border-bg-border">
                <th className="px-4 py-3 font-medium">Incentivo</th>
                <th className="px-4 py-3 font-medium">Mecánica</th>
                <th className="px-4 py-3 font-medium text-right">Puntos ranking</th>
                <th className="px-4 py-3 font-medium text-right">GP directos</th>
                <th className="px-4 py-3 font-medium text-center">Clasifica</th>
              </tr>
            </thead>
            <tbody>
              {r.estados.map((e) => (
                <tr key={e.incentivoId} className="border-b border-bg-border/60 hover:bg-bg-surface2/50">
                  <td className="px-4 py-3 font-medium text-fg">{e.nombre}</td>
                  <td className="px-4 py-3">
                    <Badge tone={e.mecanica === 'directo' ? 'gold' : e.mecanica === 'mixta' ? 'red' : 'neutral'}>
                      {e.mecanica}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabnum text-fg-soft">{e.puntos ? fmtNum(e.puntos) : '—'}</td>
                  <td className="px-4 py-3 text-right tabnum text-gp-gold">{e.gp ? fmtNum(e.gp) : '—'}</td>
                  <td className="px-4 py-3 text-center">
                    {e.clasifica ? <Badge tone="green">Sí</Badge> : <Badge tone="neutral">No</Badge>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle right={<Wifi size={18} className="text-vf-red" />}>
            Desglose puntos de fibra (Cliente Nuevo)
          </SectionTitle>
          {desgloseFibra.length === 0 ? (
            <p className="text-sm text-fg-muted py-8 text-center">Sin ventas de fibra este mes.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-muted border-b border-bg-border">
                  <th className="py-2 font-medium">Convergencia</th>
                  <th className="py-2 font-medium text-center">Uds</th>
                  <th className="py-2 font-medium text-right">Pts/u</th>
                  <th className="py-2 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {desgloseFibra.map((d, i) => (
                  <tr key={i} className="border-b border-bg-border/60">
                    <td className="py-2 text-fg-soft">{d.tipo} · {d.velocidad}</td>
                    <td className="py-2 text-center tabnum">{d.count}</td>
                    <td className="py-2 text-right tabnum text-fg-muted">{fmtNum(convPts(d, mes))}</td>
                    <td className="py-2 text-right tabnum text-fg font-medium">{fmtNum(d.total)}</td>
                  </tr>
                ))}
                <tr className="font-semibold text-vf-redLight">
                  <td className="py-2" colSpan={3}>Total puntos fibra</td>
                  <td className="py-2 text-right tabnum">{fmtNum(ptsFibra)}</td>
                </tr>
              </tbody>
            </table>
          )}
        </Card>

        <Card>
          <SectionTitle><span className="flex items-center gap-2"><Trophy size={18} className="text-gp-gold" /> Tabla de premios (ranking)</span></SectionTitle>
          <div className="space-y-4">
            {r.estados.filter((e) => INCENTIVOS[e.incentivoId].premios.length).map((e) => {
              const inc = INCENTIVOS[e.incentivoId];
              return (
                <div key={e.incentivoId} className="bg-bg-surface2 rounded-lg p-4 border border-bg-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-fg">{e.nombre}</span>
                    <span className="text-xs text-fg-muted">Top {inc.premiados}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {inc.premios.map((p, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-bg-base border border-bg-border text-fg-soft">
                        {p.rango}: <span className="text-gp-gold font-semibold">{p.gpcoins} GP</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

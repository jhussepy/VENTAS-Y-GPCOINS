import { useMemo, useState } from 'react';
import { Coins, Wallet, Trophy, TrendingUp, Wifi } from 'lucide-react';
import { useApp } from '../App.jsx';
import { resumenGlobal, puntosClienteNuevo, portasDetalle } from '../lib/engine.js';
import { estadoDe } from '../lib/estados.js';
import { INCENTIVOS, PUNTOS_CONVERGENCIA, PERIODO, convPts } from '../data/incentivos.js';
import { StatCard, Card, SectionTitle, Badge } from '../components/ui.jsx';
import { fmtNum } from '../lib/format.js';

export default function GPCoins() {
  const { ventas, mes } = useApp();
  const r = useMemo(() => resumenGlobal(ventas, mes), [ventas, mes]);

  // Desglose de puntos de fibra (Cliente Nuevo) por convergencia. Solo ventas
  // ACTIVAS cuentan (igual que puntosClienteNuevo en engine.js); si no, la
  // tabla mostraría puntos "fantasma" de ventas pendientes/canceladas que
  // nunca sumarán al total real.
  const desgloseFibra = useMemo(() => {
    const delMes = ventas.filter((v) => v.mes === mes && estadoDe(v) === 'activa' && v.convergencia && v.velocidad);
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

  // En la tabla de incentivos, separamos los que ya tienen actividad de los
  // que siguen en 0 (sin puntos ni GP), para que resalte lo relevante y no se
  // pierda entre filas vacías. Los inactivos quedan colapsados tras un toggle.
  const [verInactivos, setVerInactivos] = useState(false);
  const { activos: incentivosActivos, inactivos: incentivosInactivos } = useMemo(() => {
    const activos = []; const inactivos = [];
    for (const e of r.estados) ((e.puntos || e.gp) ? activos : inactivos).push(e);
    return { activos, inactivos };
  }, [r.estados]);
  // Semáforo: verde si se cumple el objetivo, ámbar si está cerca (≥70% del
  // objetivo), rojo si queda mucho por avanzar
  const nivelPortas = portas.pct >= objetivoPortas ? 'verde' : (portas.pct >= objetivoPortas * 0.7 ? 'ambar' : 'rojo');
  const COLOR_PORTAS = {
    verde: { texto: 'text-emerald-400', barra: 'from-emerald-500 to-emerald-400' },
    ambar: { texto: 'text-gp-gold', barra: 'from-amber-500 to-gp-gold' },
    rojo: { texto: 'text-vf-redLight', barra: 'from-vf-red to-vf-redLight' },
  }[nivelPortas];

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
        <div className="flex items-baseline gap-3 mb-3">
          <p className={`text-3xl font-bold tabnum ${COLOR_PORTAS.texto}`}>
            {portas.pct}%
          </p>
          <span className="text-sm text-fg-soft tabnum">{portas.portas}/{portas.lineas} portas activas</span>
          <span className="text-xs text-fg-muted">objetivo {objetivoPortas}% · {portas.solicitadas} solicitadas</span>
        </div>
        {/* Barra con marca de objetivo */}
        <div className="relative w-full h-2.5 bg-bg-surface2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${COLOR_PORTAS.barra}`}
            style={{ width: `${Math.min(100, portas.pct)}%` }}
          />
          <div className="absolute inset-y-0 w-0.5 bg-fg/60" style={{ left: `${Math.min(100, objetivoPortas)}%` }} title={`Objetivo ${objetivoPortas}%`} />
        </div>
        <p className="text-[11px] text-fg-muted mt-1.5">La marca vertical señala el objetivo del {objetivoPortas}%.</p>
      </Card>

      <Card>
        <SectionTitle right={<Badge tone="neutral">{PERIODO.etiquetas[mes]}</Badge>}>
          GP Coins por incentivo
        </SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-fg-muted border-b border-bg-border bg-bg-surface2/60">
                <th className="px-4 py-3 font-semibold">Incentivo</th>
                <th className="px-4 py-3 font-semibold">Mecánica</th>
                <th className="px-4 py-3 font-semibold text-right">Puntos ranking</th>
                <th className="px-4 py-3 font-semibold text-right">GP directos</th>
                <th className="px-4 py-3 font-semibold text-center">Clasifica</th>
              </tr>
            </thead>
            <tbody>
              {incentivosActivos.map((e) => (
                <tr key={e.incentivoId} className="border-b border-bg-border/60 odd:bg-bg-surface2/25 hover:bg-bg-surface2/60 transition-colors">
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
              {incentivosActivos.length === 0 && (
                <tr><td colSpan={5} className="px-4 py-6 text-center text-fg-muted text-sm">Sin actividad todavía este mes.</td></tr>
              )}
              {verInactivos && incentivosInactivos.map((e) => (
                <tr key={e.incentivoId} className="border-b border-bg-border/60 odd:bg-bg-surface2/25 opacity-50">
                  <td className="px-4 py-3 font-medium text-fg">{e.nombre}</td>
                  <td className="px-4 py-3">
                    <Badge tone={e.mecanica === 'directo' ? 'gold' : e.mecanica === 'mixta' ? 'red' : 'neutral'}>
                      {e.mecanica}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right tabnum text-fg-soft">—</td>
                  <td className="px-4 py-3 text-right tabnum text-gp-gold">—</td>
                  <td className="px-4 py-3 text-center"><Badge tone="neutral">No</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
          {incentivosInactivos.length > 0 && (
            <button
              onClick={() => setVerInactivos((v) => !v)}
              className="w-full text-xs text-fg-muted hover:text-fg py-2.5 cursor-pointer border-t border-bg-border"
            >
              {verInactivos ? 'Ocultar' : 'Mostrar'} {incentivosInactivos.length} sin actividad este mes
            </button>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
                      <span key={i} className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded border ${i === 0 ? 'bg-gp-gold/15 border-gp-gold/40 text-gp-gold font-medium' : 'bg-bg-base border-bg-border text-fg-soft'}`}>
                        {i === 0 && <Trophy size={11} className="text-gp-gold" />}{p.rango}: <span className="text-gp-gold font-semibold">{p.gpcoins} GP</span>
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

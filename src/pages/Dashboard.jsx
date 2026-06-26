import { useMemo } from 'react';
import {
  ShoppingCart, Coins, Wifi, UserPlus, Trophy, KeyRound, Star,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { useApp } from '../App.jsx';
import { resumenGlobal } from '../lib/engine.js';
import { INCENTIVOS, PERIODO } from '../data/incentivos.js';
import { StatCard, Card, SectionTitle, Badge, Progress } from '../components/ui.jsx';
import { fmtNum } from '../lib/format.js';

export default function Dashboard() {
  const { ventas, mes } = useApp();
  const r = useMemo(() => resumenGlobal(ventas, mes), [ventas, mes]);

  const dataChart = r.estados
    .filter((e) => e.puntos > 0 || e.gp > 0)
    .map((e) => ({ nombre: e.nombre, valor: e.puntos || e.gp, esGp: e.mecanica === 'directo' }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label={`Ventas en ${PERIODO.etiquetas[mes]}`} value={fmtNum(r.totalVentas)} accent="text-vf-red" />
        <StatCard icon={Coins} label="GP Coins directos (monedero)" value={fmtNum(r.gpDirectosTotal)} sub="Asegurados por venta" accent="text-gp-gold" />
        <StatCard icon={Wifi} label="Instalaciones activas" value={fmtNum(r.instalacionesActivas)} accent="text-emerald-400" />
        <StatCard icon={UserPlus} label="Clientes nuevos" value={fmtNum(r.clientesNuevos)} accent="text-sky-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionTitle right={<Badge tone="neutral">{PERIODO.etiquetas[mes]}</Badge>}>
            Puntos / GP Coins por incentivo
          </SectionTitle>
          {dataChart.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              Aún no hay ventas registradas este mes. Añade ventas para ver tu progreso.
            </div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={dataChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2A2A38" />
                  <XAxis dataKey="nombre" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{ background: '#15151E', border: '1px solid #2A2A38', borderRadius: 8, color: '#fff' }}
                    formatter={(v, _n, p) => [fmtNum(v), p.payload.esGp ? 'GP Coins' : 'Puntos']}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {dataChart.map((d, i) => (
                      <Cell key={i} fill={d.esGp ? '#FFB81C' : '#E60000'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>Resumen de clasificación</SectionTitle>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-emerald-500/15 text-emerald-400"><Trophy size={22} /></div>
            <div>
              <p className="text-2xl font-semibold text-white tabnum">{r.incentivosClasificados}/6</p>
              <p className="text-xs text-slate-500">incentivos con todas las llaves</p>
            </div>
          </div>
          <div className="space-y-3">
            {r.estados.map((e) => {
              const cumplidas = e.llaves.filter((l) => l.cumple).length;
              return (
                <div key={e.incentivoId}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-slate-300">{e.nombre}</span>
                    <span className={e.clasifica ? 'text-emerald-400' : 'text-slate-500'}>
                      {cumplidas}/{e.llaves.length} llaves
                    </span>
                  </div>
                  <Progress value={(cumplidas / e.llaves.length) * 100} cumple={e.clasifica} />
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card>
        <SectionTitle right={<span className="text-xs text-slate-500">Mejor escenario si clasificas (1er puesto)</span>}>
          GP Coins potenciales por ranking
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {r.estados.filter((e) => INCENTIVOS[e.incentivoId].premios.length).map((e) => {
            const inc = INCENTIVOS[e.incentivoId];
            return (
              <div key={e.incentivoId} className="bg-bg-surface2 rounded-lg p-4 border border-bg-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white">{e.nombre}</span>
                  {e.clasifica ? <Badge tone="green">Clasificas</Badge> : <Badge tone="red">No clasificas</Badge>}
                </div>
                <p className="text-sm text-slate-400 tabnum">{fmtNum(e.puntos)} pts acumulados</p>
                <p className="text-xs text-slate-500 mt-1">
                  Top {inc.premiados} · 1º: {inc.premios[0].gpcoins} GP Coins
                </p>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

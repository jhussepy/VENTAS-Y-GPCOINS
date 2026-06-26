import { useMemo } from 'react';
import {
  ShoppingCart, Coins, Wifi, UserPlus, Trophy, KeyRound, Star, CalendarClock,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { useApp } from '../App.jsx';
import { resumenGlobal } from '../lib/engine.js';
import { INCENTIVOS, ORDEN_INCENTIVOS, PERIODO } from '../data/incentivos.js';
import { ESTADOS, ORDEN_ESTADOS, estadoDe } from '../lib/estados.js';
import { StatCard, Card, SectionTitle, Badge, Progress } from '../components/ui.jsx';
import { fmtNum } from '../lib/format.js';

export default function Dashboard() {
  const { ventas, mes } = useApp();
  const r = useMemo(() => resumenGlobal(ventas, mes), [ventas, mes]);

  const dataChart = r.estados
    .filter((e) => e.puntos > 0 || e.gp > 0)
    .map((e) => ({ nombre: e.nombre, valor: e.puntos || e.gp, esGp: e.mecanica === 'directo' }));

  // Nº total de incentivos (dinámico, en vez de hardcodear 6)
  const totalIncentivos = ORDEN_INCENTIVOS.length;

  // Distribución de ventas por estado (pendiente / activa / baja / cancelada)
  const distribucion = useMemo(() => {
    const delMes = ventas.filter((v) => v.mes === mes);
    const items = ORDEN_ESTADOS.map((k) => ({
      id: k,
      label: ESTADOS[k].label,
      color: ESTADOS[k].color,
      n: delMes.filter((v) => estadoDe(v) === k).length,
    }));
    return { total: delMes.length, items };
  }, [ventas, mes]);

  // --- Proyección / ritmo del mes activo --------------------------------------
  const proyeccion = useMemo(() => {
    // Año del período (2026) y mes activo (junio=5, julio=6 en base 0)
    const anio = Number(PERIODO.inicio.slice(0, 4));
    const mesIdx = mes === 'julio' ? 6 : 5;
    const inicioMes = new Date(anio, mesIdx, 1);
    const finMes = new Date(anio, mesIdx + 1, 0); // último día del mes
    const diasTotales = finMes.getDate();

    const hoy = new Date();
    // Día de referencia: hoy si cae dentro del mes activo; si no, el mes completo
    const dentro = hoy >= inicioMes && hoy <= finMes;
    const diaActual = dentro ? hoy.getDate() : diasTotales;

    const diasTranscurridos = Math.max(1, diaActual); // evita división por cero
    const diasRestantes = Math.max(0, diasTotales - diaActual);

    const ventasActuales = r.totalVentas;
    const proyectada = Math.round((ventasActuales / diasTranscurridos) * diasTotales);

    return { diasTotales, diasRestantes, ventasActuales, proyectada, dentro };
  }, [mes, r.totalVentas]);

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
            <div className="py-16 text-center text-fg-muted text-sm">
              Aún no hay ventas registradas este mes. Añade ventas para ver tu progreso.
            </div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={dataChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                  <XAxis dataKey="nombre" stroke="var(--fg-muted)" fontSize={12} />
                  <YAxis stroke="var(--fg-muted)" fontSize={12} />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-surface2)' }}
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 8, color: 'var(--fg)' }}
                    formatter={(v, _n, p) => [fmtNum(v), p.payload.esGp ? 'GP Coins' : 'Puntos']}
                  />
                  <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                    {dataChart.map((d, i) => (
                      <Cell key={i} fill={d.esGp ? '#FFB81C' : '#E60000'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              {/* Leyenda manual: explica el significado de cada color del gráfico */}
              <div className="flex items-center justify-center gap-6 mt-3 text-xs text-fg-soft">
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#E60000' }} />
                  Puntos de ranking
                </span>
                <span className="flex items-center gap-2">
                  <span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#FFB81C' }} />
                  GP Coins
                </span>
              </div>
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle>Resumen de clasificación</SectionTitle>
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-lg bg-emerald-500/15 text-emerald-400"><Trophy size={22} /></div>
            <div>
              <p className="text-2xl font-semibold text-fg tabnum">{r.incentivosClasificados}/{totalIncentivos}</p>
              <p className="text-xs text-fg-muted">incentivos con todas las llaves</p>
            </div>
          </div>
          <div className="space-y-3">
            {r.estados.map((e) => {
              const cumplidas = e.llaves.filter((l) => l.cumple).length;
              return (
                <div key={e.incentivoId}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-fg-soft">{e.nombre}</span>
                    <span className={e.clasifica ? 'text-emerald-400' : 'text-fg-muted'}>
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

      {/* Tarjeta de proyección / ritmo del mes activo */}
      <Card>
        <SectionTitle
          right={(
            <Badge tone="neutral">
              {proyeccion.dentro ? `${PERIODO.etiquetas[mes]} en curso` : `${PERIODO.etiquetas[mes]} (referencia)`}
            </Badge>
          )}
        >
          <span className="flex items-center gap-2"><CalendarClock size={18} className="text-vf-red" /> Ritmo y proyección del mes</span>
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-bg-surface2 rounded-lg p-4 border border-bg-border">
            <p className="text-xs text-fg-muted">Días restantes del mes</p>
            <p className="text-2xl font-semibold text-fg tabnum mt-1">{fmtNum(proyeccion.diasRestantes)}</p>
            <p className="text-xs text-fg-muted mt-1">de {proyeccion.diasTotales} días totales</p>
          </div>
          <div className="bg-bg-surface2 rounded-lg p-4 border border-bg-border">
            <p className="text-xs text-fg-muted">Ventas actuales del mes</p>
            <p className="text-2xl font-semibold text-fg tabnum mt-1">{fmtNum(proyeccion.ventasActuales)}</p>
            <p className="text-xs text-fg-muted mt-1">registradas en {PERIODO.etiquetas[mes]}</p>
          </div>
          <div className="bg-bg-surface2 rounded-lg p-4 border border-bg-border">
            <p className="text-xs text-fg-muted">Proyección fin de mes</p>
            <p className="text-2xl font-semibold text-gp-gold tabnum mt-1">{fmtNum(proyeccion.proyectada)}</p>
            <p className="text-xs text-fg-muted mt-1">al ritmo actual</p>
          </div>
        </div>
      </Card>

      {/* Distribución de ventas por estado */}
      <Card>
        <SectionTitle right={<Badge tone="neutral">{fmtNum(distribucion.total)} ventas</Badge>}>
          Distribución por estado
        </SectionTitle>
        {distribucion.total === 0 ? (
          <p className="py-6 text-center text-fg-muted text-sm">Aún no hay ventas este mes.</p>
        ) : (
          <div className="space-y-3">
            {distribucion.items.map((it) => {
              const pct = distribucion.total ? (it.n / distribucion.total) * 100 : 0;
              return (
                <div key={it.id}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-2 text-fg-soft">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: it.color }} />
                      {it.label}
                    </span>
                    <span className="text-fg-muted tabnum">{it.n} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-bg-surface2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: it.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card>
        <SectionTitle right={<span className="text-xs text-fg-muted">Mejor escenario si clasificas (1er puesto)</span>}>
          GP Coins potenciales por ranking
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {r.estados.filter((e) => INCENTIVOS[e.incentivoId].premios.length).map((e) => {
            const inc = INCENTIVOS[e.incentivoId];
            return (
              <div key={e.incentivoId} className="bg-bg-surface2 rounded-lg p-4 border border-bg-border">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-fg">{e.nombre}</span>
                  {e.clasifica ? <Badge tone="green">Clasificas</Badge> : <Badge tone="red">No clasificas</Badge>}
                </div>
                <p className="text-sm text-fg-muted tabnum">{fmtNum(e.puntos)} pts acumulados</p>
                <p className="text-xs text-fg-muted mt-1">
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

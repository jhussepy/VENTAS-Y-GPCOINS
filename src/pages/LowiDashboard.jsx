import { useMemo } from 'react';
import {
  ShoppingCart, Wifi, Clock, XCircle, TrendingDown, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { Repeat, Smartphone, Tv } from 'lucide-react';
import { useApp } from '../App.jsx';
import { resumenLowi, ESTADOS_LOWI, ORDEN_ESTADOS, VELOCIDADES_LOWI, TARIFAS_MOVIL_LOWI } from '../lib/lowi.js';
import { StatCard, Card, SectionTitle, Badge, EmptyState, HeroBanner } from '../components/ui.jsx';
import { fmtNum } from '../lib/format.js';

const COLORES_ESTADO = {
  pendiente: '#FFB81C',
  activa: '#10B981',
  baja: '#E60000',
  cancelada: '#6B7280',
};

export default function LowiDashboard() {
  const { ventasLowi } = useApp();
  const r = useMemo(() => resumenLowi(ventasLowi), [ventasLowi]);

  const dataChart = ORDEN_ESTADOS.map((k) => ({
    nombre: ESTADOS_LOWI[k].label,
    valor: r.porEstado[k],
    color: COLORES_ESTADO[k],
  }));

  // Desglose de motivos de baja (solo ventas en estado baja/cancelada con motivo)
  const motivos = useMemo(() => {
    const m = {};
    for (const v of ventasLowi) {
      if ((v.estado === 'baja' || v.estado === 'cancelada') && v.motivoBaja) {
        m[v.motivoBaja] = (m[v.motivoBaja] || 0) + 1;
      }
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [ventasLowi]);

  // Fibra activa por velocidad (ventas activas con fibra)
  const fibraVel = useMemo(() => {
    const act = ventasLowi.filter((v) => v.estado === 'activa' && (v.producto === 'fibra' || v.producto === 'fibra_movil'));
    const items = VELOCIDADES_LOWI.map((vel) => ({ label: vel, n: act.filter((v) => v.velocidad === vel).length }));
    return { items, total: act.length };
  }, [ventasLowi]);

  // Líneas móviles activas por tarifa (del detalle de líneas)
  const movilTarifa = useMemo(() => {
    const cuenta = {}; let total = 0;
    for (const v of ventasLowi) {
      if (v.estado !== 'activa') continue;
      for (const l of v.lineasMoviles || []) {
        if (!l.tarifa) continue;
        cuenta[l.tarifa] = (cuenta[l.tarifa] || 0) + 1; total += 1;
      }
    }
    return { items: TARIFAS_MOVIL_LOWI.map((t) => ({ label: t.label, n: cuenta[t.id] || 0 })), total };
  }, [ventasLowi]);

  // Contenidos TV vendidos (ventas activas con TV)
  const contenidosTV = useMemo(() => {
    const m = {};
    for (const v of ventasLowi) {
      if (v.estado === 'activa' && v.tv) m[v.tv] = (m[v.tv] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [ventasLowi]);

  if (ventasLowi.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Wifi}
          title="Aún no hay ventas de Lowi"
          hint="Ve a 'Ventas Lowi' para registrar tu primera venta o importar tu Excel. Aquí verás el seguimiento de estados y facturación."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <HeroBanner
        saludo="Panel Lowi"
        titulo="Seguimiento de ventas Lowi"
        subtitulo="Estado de instalaciones, facturación activa y portabilidad en un vistazo."
        accent="lowi"
        highlights={[
          { label: 'Ventas', value: r.total },
          { label: 'Activas', value: r.porEstado.activa },
          { label: '€/mes', value: r.facturacionActiva, format: (n) => `${Math.round(n)}€` },
        ]}
      />
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Ventas totales" value={fmtNum(r.total)} accent="text-fg" />
        <StatCard icon={Wifi} label="Activas" value={fmtNum(r.porEstado.activa)} accent="text-emerald-400" />
        <StatCard icon={Clock} label="Pendientes de instalar" value={fmtNum(r.porEstado.pendiente)} accent="text-gp-gold" />
        <StatCard icon={XCircle} label="Bajas" value={fmtNum(r.porEstado.baja)} sub={`${fmtNum(r.porEstado.cancelada)} canceladas antes de instalar`} accent="text-vf-redLight" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Repeat} label="Portas pendientes de activar" value={fmtNum(r.portasPendientes)} sub={`de ${fmtNum(r.portasTotales)} solicitadas`} accent="text-gp-gold" />
        <StatCard icon={TrendingUp} label="Tasa de activación" value={`${r.tasaActivacion.toFixed(0)}%`} sub="Activas sobre las instaladas" accent="text-sky-400" />
        <StatCard icon={TrendingDown} label="Tasa de baja" value={`${r.tasaBaja.toFixed(0)}%`} sub="Bajas sobre las instaladas" accent="text-vf-redLight" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionTitle>Ventas por estado</SectionTitle>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={dataChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                <XAxis dataKey="nombre" stroke="var(--fg-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--fg-muted)" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: 'var(--bg-surface2)', radius: 6 }}
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, color: 'var(--fg)', boxShadow: 'var(--shadow-lg)' }}
                  formatter={(v) => [fmtNum(v), 'Ventas']}
                />
                <Bar dataKey="valor" radius={[8, 8, 0, 0]} maxBarSize={84} animationDuration={700}>
                  {dataChart.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionTitle>Distribución</SectionTitle>
          <div className="space-y-3">
            {ORDEN_ESTADOS.map((k) => {
              const n = r.porEstado[k];
              const pct = r.total ? (n / r.total) * 100 : 0;
              return (
                <div key={k}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="flex items-center gap-2 text-fg-soft">
                      <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORES_ESTADO[k] }} />
                      {ESTADOS_LOWI[k].label}
                    </span>
                    <span className="text-fg-muted tabnum">{n} · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 bg-bg-surface2 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORES_ESTADO[k] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Fibra activa por velocidad y líneas móviles por tarifa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle right={<Badge tone="neutral">{fmtNum(fibraVel.total)} fibras activas</Badge>}>
            <span className="flex items-center gap-2"><Wifi size={18} className="text-emerald-400" /> Fibra activa por velocidad</span>
          </SectionTitle>
          {fibraVel.total === 0 ? (
            <p className="py-4 text-center text-fg-muted text-sm">Sin fibras activas.</p>
          ) : (
            <div className="space-y-3">
              {fibraVel.items.map((it) => {
                const pct = fibraVel.total ? (it.n / fibraVel.total) * 100 : 0;
                return (
                  <div key={it.label}>
                    <div className="flex items-center justify-between text-xs mb-1"><span className="text-fg-soft">{it.label}</span><span className="text-fg-muted tabnum">{it.n}</span></div>
                    <div className="w-full h-2 bg-bg-surface2 rounded-full overflow-hidden"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle right={<Badge tone="neutral">{fmtNum(movilTarifa.total)} líneas activas</Badge>}>
            <span className="flex items-center gap-2"><Smartphone size={18} className="text-sky-400" /> Líneas móviles por tarifa</span>
          </SectionTitle>
          {movilTarifa.total === 0 ? (
            <p className="py-4 text-center text-fg-muted text-sm">Sin líneas detalladas. Añádelas en el alta de venta.</p>
          ) : (
            <div className="space-y-3">
              {movilTarifa.items.map((it) => {
                const pct = movilTarifa.total ? (it.n / movilTarifa.total) * 100 : 0;
                return (
                  <div key={it.label}>
                    <div className="flex items-center justify-between text-xs mb-1"><span className="text-fg-soft">{it.label}</span><span className="text-fg-muted tabnum">{it.n}</span></div>
                    <div className="w-full h-2 bg-bg-surface2 rounded-full overflow-hidden"><div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Contenidos TV vendidos */}
      {contenidosTV.length > 0 && (
        <Card>
          <SectionTitle right={<Badge tone="neutral">{fmtNum(contenidosTV.reduce((a, [, n]) => a + n, 0))} con TV</Badge>}>
            Contenidos TV vendidos
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contenidosTV.map(([nombre, n]) => (
              <div key={nombre} className="bg-bg-surface2 rounded-lg p-4 border border-bg-border flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-fg-soft"><Tv size={15} className="text-sky-400 shrink-0" /> {nombre}</span>
                <span className="text-lg font-semibold text-fg tabnum">{n}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Portabilidad móvil */}
      {r.portasTotales > 0 && (
        <Card>
          <SectionTitle right={<Badge tone="neutral">{fmtNum(r.portasTotales)} portas</Badge>}>
            <span className="flex items-center gap-2"><Repeat size={18} className="text-sky-400" /> Portabilidad móvil</span>
          </SectionTitle>
          <p className="text-sm text-fg-soft mb-3">
            <span className="text-emerald-400 font-semibold tabnum">{fmtNum(r.portasActivas)}</span> activas ·{' '}
            <span className="text-gp-gold font-semibold tabnum">{fmtNum(r.portasPendientes)}</span> pendientes ·{' '}
            <span className="font-semibold tabnum">{Math.round((r.portasActivas / r.portasTotales) * 100)}%</span> activadas
          </p>
          <div className="flex w-full h-3 rounded-full overflow-hidden bg-bg-surface2">
            <div className="h-full bg-emerald-500" style={{ width: `${(r.portasActivas / r.portasTotales) * 100}%` }} />
            <div className="h-full bg-gp-gold" style={{ width: `${(r.portasPendientes / r.portasTotales) * 100}%` }} />
          </div>
        </Card>
      )}

      {motivos.length > 0 && (
        <Card>
          <SectionTitle right={<Badge tone="red">{fmtNum(r.porEstado.baja + r.porEstado.cancelada)} bajas/canceladas</Badge>}>
            Motivos de baja
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {motivos.map(([motivo, n]) => (
              <div key={motivo} className="bg-bg-surface2 rounded-lg p-4 border border-bg-border flex items-center justify-between">
                <span className="text-sm text-fg-soft">{motivo}</span>
                <span className="text-lg font-semibold text-fg tabnum">{n}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

import { useMemo } from 'react';
import {
  ShoppingCart, Wifi, Clock, XCircle, Euro, TrendingDown, TrendingUp,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import { useApp } from '../App.jsx';
import { resumenLowi, ESTADOS_LOWI, ORDEN_ESTADOS } from '../lib/lowi.js';
import { StatCard, Card, SectionTitle, Badge, EmptyState } from '../components/ui.jsx';
import { fmtNum, fmtEur } from '../lib/format.js';

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
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={ShoppingCart} label="Ventas totales" value={fmtNum(r.total)} accent="text-fg" />
        <StatCard icon={Wifi} label="Activas" value={fmtNum(r.porEstado.activa)} accent="text-emerald-400" />
        <StatCard icon={Clock} label="Pendientes de instalar" value={fmtNum(r.porEstado.pendiente)} accent="text-gp-gold" />
        <StatCard icon={XCircle} label="Bajas" value={fmtNum(r.porEstado.baja)} sub={`${fmtNum(r.porEstado.cancelada)} canceladas antes de instalar`} accent="text-vf-redLight" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Euro} label="Facturación activa (mensual)" value={fmtEur(r.facturacionActiva)} sub="Suma de cuotas de clientes activos" accent="text-emerald-400" />
        <StatCard icon={TrendingUp} label="Tasa de activación" value={`${r.tasaActivacion.toFixed(0)}%`} sub="Activas sobre las instaladas" accent="text-sky-400" />
        <StatCard icon={TrendingDown} label="Tasa de baja" value={`${r.tasaBaja.toFixed(0)}%`} sub="Bajas sobre las instaladas" accent="text-vf-redLight" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionTitle>Ventas por estado</SectionTitle>
          <div style={{ width: '100%', height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={dataChart} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" />
                <XAxis dataKey="nombre" stroke="var(--fg-muted)" fontSize={12} />
                <YAxis stroke="var(--fg-muted)" fontSize={12} allowDecimals={false} />
                <Tooltip
                  cursor={{ fill: 'var(--bg-surface2)' }}
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 8, color: 'var(--fg)' }}
                  formatter={(v) => [fmtNum(v), 'Ventas']}
                />
                <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
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

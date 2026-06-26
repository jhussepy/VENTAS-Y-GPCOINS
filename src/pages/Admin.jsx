import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useApp } from '../App.jsx';
import { resumenGlobal } from '../lib/engine.js';
import { Card, StatCard, Badge, EmptyState, SectionTitle } from '../components/ui.jsx';
import { fmtNum } from '../lib/format.js';
import { Users, ShoppingCart, Coins, Trophy, RefreshCw, ShieldAlert } from 'lucide-react';

export default function Admin() {
  const { mes, admin } = useApp();
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const cargar = async () => {
    setLoading(true);
    setError(null);
    try {
      const snap = await getDocs(collection(db, 'usuarios'));
      const data = snap.docs.map((d) => {
        const u = d.data();
        return {
          uid: d.id,
          email: u.email || '(sin email)',
          nombre: u.nombre || '',
          foto: u.foto || '',
          ventas: Array.isArray(u.ventas) ? u.ventas : [],
          ultimoAcceso: u.ultimoAcceso || 0,
        };
      });
      setAgentes(data);
    } catch (e) {
      setError('No se pudieron cargar los datos. Revisa las reglas de Firestore.');
    }
    setLoading(false);
  };

  useEffect(() => { if (admin) cargar(); }, [admin]);

  if (!admin) {
    return (
      <EmptyState icon={ShieldAlert} title="Acceso restringido" hint="Esta sección es solo para administradores." />
    );
  }

  // Resumen por agente en el mes activo
  const filas = agentes.map((a) => {
    const r = resumenGlobal(a.ventas, mes);
    return { ...a, resumen: r };
  }).sort((x, y) =>
    (y.resumen.gpDirectosTotal + y.resumen.gpPotencialRanking) -
    (x.resumen.gpDirectosTotal + x.resumen.gpPotencialRanking)
  );

  // Totales globales del equipo
  const tot = filas.reduce((acc, f) => ({
    ventas: acc.ventas + f.resumen.totalVentas,
    gp: acc.gp + f.resumen.gpDirectosTotal,
    clientes: acc.clientes + f.resumen.clientesNuevos,
  }), { ventas: 0, gp: 0, clientes: 0 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted">
          Vista de supervisor · datos de todos los agentes · <span className="text-fg-soft font-medium uppercase">{mes}</span>
        </p>
        <button className="btn-ghost" onClick={cargar} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {error && (
        <div className="text-sm px-4 py-2 rounded-lg bg-vf-red/15 text-vf-redLight" role="alert">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Agentes" value={fmtNum(agentes.length)} accent="text-vf-red" />
        <StatCard icon={ShoppingCart} label="Ventas del equipo" value={fmtNum(tot.ventas)} accent="text-vf-red" />
        <StatCard icon={Coins} label="GP Coins directos (equipo)" value={fmtNum(tot.gp)} accent="text-gp-gold" />
        <StatCard icon={Trophy} label="Clientes nuevos (equipo)" value={fmtNum(tot.clientes)} accent="text-emerald-400" />
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-bg-border">
          <SectionTitle>Ranking de agentes ({mes})</SectionTitle>
        </div>
        {loading ? (
          <EmptyState icon={RefreshCw} title="Cargando agentes…" />
        ) : filas.length === 0 ? (
          <EmptyState icon={Users} title="Sin agentes" hint="Aún no hay usuarios con datos registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-muted border-b border-bg-border">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Agente</th>
                  <th className="px-4 py-3 font-medium text-center">Ventas</th>
                  <th className="px-4 py-3 font-medium text-center">Clientes nuevos</th>
                  <th className="px-4 py-3 font-medium text-center">Instal. activas</th>
                  <th className="px-4 py-3 font-medium text-right">GP directos</th>
                  <th className="px-4 py-3 font-medium text-center">Incentivos OK</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr key={f.uid} className="border-b border-bg-border/60 hover:bg-bg-surface2/50">
                    <td className="px-4 py-3 tabnum text-fg-muted">{i + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {f.foto
                          ? <img src={f.foto} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
                          : <div className="w-7 h-7 rounded-full bg-bg-surface2 border border-bg-border" />}
                        <div className="min-w-0">
                          <div className="font-medium text-fg truncate">{f.nombre || '—'}</div>
                          <div className="text-[11px] text-fg-muted truncate">{f.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center tabnum text-fg-soft">{fmtNum(f.resumen.totalVentas)}</td>
                    <td className="px-4 py-3 text-center tabnum text-fg-soft">{fmtNum(f.resumen.clientesNuevos)}</td>
                    <td className="px-4 py-3 text-center tabnum text-fg-soft">{fmtNum(f.resumen.instalacionesActivas)}</td>
                    <td className="px-4 py-3 text-right tabnum font-semibold text-gp-gold">{fmtNum(f.resumen.gpDirectosTotal)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge tone={f.resumen.incentivosClasificados > 0 ? 'green' : 'neutral'}>
                        {f.resumen.incentivosClasificados}/6
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

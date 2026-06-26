import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useApp } from '../App.jsx';
import { resumenGlobal } from '../lib/engine.js';
import { resumenLowi } from '../lib/lowi.js';
import { ORDEN_INCENTIVOS, CATALOGO } from '../data/incentivos.js';
import { Card, StatCard, Badge, EmptyState, SectionTitle } from '../components/ui.jsx';
import { fmtNum, fmtFecha, fmtEur } from '../lib/format.js';
import { Users, ShoppingCart, Coins, Trophy, RefreshCw, ShieldAlert, Eye, X, Wifi } from 'lucide-react';

export default function Admin() {
  const { mes, admin } = useApp();
  const [agentes, setAgentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Agente seleccionado para el drill-down (objeto de fila con resumen, o null)
  const [agenteSel, setAgenteSel] = useState(null);

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
          ventasLowi: Array.isArray(u.ventasLowi) ? u.ventasLowi : [],
          tarifas: Array.isArray(u.tarifas) ? u.tarifas : [],
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
    const lowi = resumenLowi(a.ventasLowi);
    return { ...a, resumen: r, lowi };
  }).sort((x, y) =>
    (y.resumen.gpDirectosTotal + y.resumen.gpPotencialRanking) -
    (x.resumen.gpDirectosTotal + x.resumen.gpPotencialRanking)
  );

  // Totales globales del equipo
  const tot = filas.reduce((acc, f) => ({
    ventas: acc.ventas + f.resumen.totalVentas,
    gp: acc.gp + f.resumen.gpDirectosTotal,
    clientes: acc.clientes + f.resumen.clientesNuevos,
    lowiTotal: acc.lowiTotal + f.lowi.total,
    lowiActivas: acc.lowiActivas + f.lowi.porEstado.activa,
    lowiFact: acc.lowiFact + f.lowi.facturacionActiva,
  }), { ventas: 0, gp: 0, clientes: 0, lowiTotal: 0, lowiActivas: 0, lowiFact: 0 });

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

      {/* KPIs de Lowi del equipo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Wifi} label="Ventas Lowi (equipo)" value={fmtNum(tot.lowiTotal)} accent="text-sky-400" />
        <StatCard icon={Wifi} label="Lowi activas (equipo)" value={fmtNum(tot.lowiActivas)} accent="text-emerald-400" />
        <StatCard icon={Coins} label="Facturación Lowi activa" value={fmtEur(tot.lowiFact)} sub="Suma de cuotas mensuales activas" accent="text-sky-400" />
      </div>

      {/* Drill-down: detalle del agente seleccionado */}
      {agenteSel && (
        <DetalleAgente agente={agenteSel} mes={mes} onCerrar={() => setAgenteSel(null)} />
      )}

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
                  <th className="px-4 py-3 font-medium text-center">Lowi (act./tot.)</th>
                  <th className="px-4 py-3 font-medium text-right">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => (
                  <tr
                    key={f.uid}
                    onClick={() => setAgenteSel(f)}
                    className={`border-b border-bg-border/60 hover:bg-bg-surface2/50 cursor-pointer ${agenteSel?.uid === f.uid ? 'bg-bg-surface2/60' : ''}`}
                  >
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
                        {f.resumen.incentivosClasificados}/{ORDEN_INCENTIVOS.length}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-center text-fg-soft tabnum">
                      <span className="text-emerald-400">{fmtNum(f.lowi.porEstado.activa)}</span>
                      <span className="text-fg-muted"> / {fmtNum(f.lowi.total)}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {/* Evita que el click propague dos veces; igual abre el detalle */}
                      <button
                        className="btn-ghost"
                        onClick={(e) => { e.stopPropagation(); setAgenteSel(f); }}
                      >
                        <Eye size={15} /> Ver detalle
                      </button>
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

// ---------------------------------------------------------------------------
//  DETALLE DE UN AGENTE (drill-down): ventas del mes activo + resumen
// ---------------------------------------------------------------------------

// Devuelve "Marca Modelo" de un terminal, o "Sin terminal" si la venta no lleva
function terminalTexto(v) {
  if (!v.marca) return 'Sin terminal';
  const cat = CATALOGO[v.marca];
  const marca = cat?.marca || v.marca;
  const prod = cat?.productos.find((p) => p.sap === v.sap);
  const modelo = prod?.modelo || v.sap || '';
  return modelo ? `${marca} · ${modelo}` : marca;
}

function DetalleAgente({ agente, mes, onCerrar }) {
  // Ventas del mes activo del agente (los datos ya vienen cargados)
  const ventasMes = (agente.ventas || []).filter((v) => v.mes === mes);
  const r = agente.resumen; // resumen ya calculado en la fila

  return (
    <Card className="!p-0 overflow-hidden border-vf-red/30">
      <div className="p-5 border-b border-bg-border flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {agente.foto
            ? <img src={agente.foto} alt="" className="w-9 h-9 rounded-full" referrerPolicy="no-referrer" />
            : <div className="w-9 h-9 rounded-full bg-bg-surface2 border border-bg-border" />}
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-fg truncate">{agente.nombre || '—'}</h2>
            <p className="text-[11px] text-fg-muted truncate">{agente.email}</p>
          </div>
        </div>
        <button className="btn-ghost" onClick={onCerrar}>
          <X size={15} /> Cerrar
        </button>
      </div>

      {/* Resumen del agente: incentivos clasificados, GP directos y tarifas propias */}
      <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 border-b border-bg-border">
        <div className="rounded-lg bg-bg-surface2 p-4">
          <p className="text-xs text-fg-muted">Incentivos clasificados</p>
          <p className="text-xl font-semibold text-fg tabnum">
            {r.incentivosClasificados}/{ORDEN_INCENTIVOS.length}
          </p>
        </div>
        <div className="rounded-lg bg-bg-surface2 p-4">
          <p className="text-xs text-fg-muted">GP Coins directos del mes</p>
          <p className="text-xl font-semibold text-gp-gold tabnum">{fmtNum(r.gpDirectosTotal)}</p>
        </div>
        <div className="rounded-lg bg-bg-surface2 p-4">
          <p className="text-xs text-fg-muted">Lowi · activas / total</p>
          <p className="text-xl font-semibold text-fg tabnum">
            <span className="text-emerald-400">{fmtNum(agente.lowi?.porEstado.activa || 0)}</span>
            <span className="text-fg-muted"> / {fmtNum(agente.lowi?.total || 0)}</span>
          </p>
          <p className="text-[11px] text-fg-muted mt-0.5">{fmtEur(agente.lowi?.facturacionActiva || 0)} activos · {fmtNum((agente.tarifas || []).length)} tarifas</p>
        </div>
      </div>

      {/* Lista de ventas del mes activo */}
      <div className="p-5">
        <SectionTitle>Ventas de {mes} ({fmtNum(ventasMes.length)})</SectionTitle>
        {ventasMes.length === 0 ? (
          <EmptyState icon={ShoppingCart} title="Sin ventas" hint={`Este agente no tiene ventas registradas en ${mes}.`} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-fg-muted border-b border-bg-border">
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Fecha venta</th>
                  <th className="px-3 py-2 font-medium">Convergencia</th>
                  <th className="px-3 py-2 font-medium">Terminal</th>
                  <th className="px-3 py-2 font-medium text-center">Instalación</th>
                </tr>
              </thead>
              <tbody>
                {ventasMes.map((v) => (
                  <tr key={v.id} className="border-b border-bg-border/60 hover:bg-bg-surface2/50">
                    <td className="px-3 py-2 text-fg">
                      {[v.nombre, v.apellido].filter(Boolean).join(' ') || '—'}
                    </td>
                    <td className="px-3 py-2 text-fg-soft">{fmtFecha(v.fechaVenta)}</td>
                    <td className="px-3 py-2 text-fg-soft">
                      {v.convergencia || v.velocidad
                        ? [v.convergencia, v.velocidad].filter(Boolean).join(' · ')
                        : '—'}
                    </td>
                    <td className="px-3 py-2 text-fg-soft">{terminalTexto(v)}</td>
                    <td className="px-3 py-2 text-center">
                      <Badge tone={v.instalacionActiva ? 'green' : 'neutral'}>
                        {v.instalacionActiva ? 'Sí' : 'No'}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Card>
  );
}

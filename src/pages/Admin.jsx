import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import { useApp } from '../App.jsx';
import { resumenGlobal, mesEfectivo } from '../lib/engine.js';
import { rachaVentas } from '../lib/logros.js';
import { resumenLowi } from '../lib/lowi.js';
import { ESTADOS, estadoDe } from '../lib/estados.js';
import { ORDEN_INCENTIVOS, CATALOGO } from '../data/incentivos.js';
import { Card, StatCard, Badge, EmptyState, SectionTitle, PageSkeleton } from '../components/ui.jsx';
import { fmtNum, fmtFecha, fmtEur } from '../lib/format.js';
import { Users, ShoppingCart, Coins, Trophy, RefreshCw, ShieldAlert, Eye, X, Wifi, Repeat, Flame, Smartphone, Layers } from 'lucide-react';

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
    // Igual que Vodafone: solo las ventas Lowi cuyo mes efectivo (instalación,
    // o venta si aún no la hay) caiga en el Período activo de la cabecera.
    const ventasLowiMes = a.ventasLowi.filter((v) => mesEfectivo(v) === mes);
    const lowi = resumenLowi(ventasLowiMes);
    const racha = rachaVentas(a.ventas);

    // Combinado Vodafone + Lowi: ventas de fibra y líneas móviles del mes,
    // sumando ambos operadores (solo informativo, no afecta a incentivos).
    const ventasVfMes = a.ventas.filter((v) => v.mes === mes);
    const vfFibra = ventasVfMes.filter((v) => v.convergencia).length;
    const vfMovil = ventasVfMes.reduce((acc, v) => acc + (v.lineasMoviles?.length || Number(v.lineasVoz) || 0), 0);
    const lowiFibra = ventasLowiMes.filter((v) => v.producto === 'fibra' || v.producto === 'fibra_movil').length;
    const lowiMovil = ventasLowiMes.reduce((acc, v) => acc + (v.lineasMoviles?.length || Number(v.lineas) || 0), 0);
    const combinado = { fibra: vfFibra + lowiFibra, movil: vfMovil + lowiMovil, total: ventasVfMes.length + ventasLowiMes.length };

    return { ...a, resumen: r, lowi, racha, combinado };
  }).sort((x, y) =>
    (y.resumen.gpDirectosTotal + y.resumen.gpPotencialRanking) -
    (x.resumen.gpDirectosTotal + x.resumen.gpPotencialRanking)
  );

  // Totales globales del equipo
  const tot = filas.reduce((acc, f) => ({
    ventas: acc.ventas + f.resumen.totalVentas,
    gp: acc.gp + f.resumen.gpDirectosTotal,
    clientes: acc.clientes + f.resumen.clientesNuevos,
    portasActivas: acc.portasActivas + f.resumen.portasActivas,
    portasPendientes: acc.portasPendientes + f.resumen.portasPendientes,
    lowiTotal: acc.lowiTotal + f.lowi.total,
    lowiActivas: acc.lowiActivas + f.lowi.porEstado.activa,
    lowiFact: acc.lowiFact + f.lowi.facturacionActiva,
    lowiPortasActivas: acc.lowiPortasActivas + (f.lowi.portasActivas || 0),
    lowiPortasPendientes: acc.lowiPortasPendientes + (f.lowi.portasPendientes || 0),
    combFibra: acc.combFibra + f.combinado.fibra,
    combMovil: acc.combMovil + f.combinado.movil,
    combTotal: acc.combTotal + f.combinado.total,
  }), { ventas: 0, gp: 0, clientes: 0, portasActivas: 0, portasPendientes: 0, lowiTotal: 0, lowiActivas: 0, lowiFact: 0, lowiPortasActivas: 0, lowiPortasPendientes: 0, combFibra: 0, combMovil: 0, combTotal: 0 });

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

      {/* Portabilidad móvil del equipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Repeat} label="Portas activas (equipo)" value={fmtNum(tot.portasActivas)} accent="text-emerald-400" />
        <StatCard icon={Repeat} label="Portas pendientes (equipo)" value={fmtNum(tot.portasPendientes)} accent="text-gp-gold" />
      </div>

      {/* Resumen combinado Vodafone + Lowi (solo informativo, no afecta incentivos) */}
      <Card>
        <SectionTitle right={<Badge tone="neutral">{mes}</Badge>}>
          <span className="flex items-center gap-2"><Layers size={18} className="text-vf-red" /> Total combinado Vodafone + Lowi</span>
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard icon={ShoppingCart} label="Ventas totales (ambos operadores)" value={fmtNum(tot.combTotal)} accent="text-vf-red" />
          <StatCard icon={Wifi} label="Ventas de fibra (Vodafone + Lowi)" value={fmtNum(tot.combFibra)} accent="text-sky-400" />
          <StatCard icon={Smartphone} label="Líneas móviles (Vodafone + Lowi)" value={fmtNum(tot.combMovil)} accent="text-emerald-400" />
        </div>
        <p className="text-[11px] text-fg-muted mt-3">
          Suma cruda de fibra y líneas móviles de ambos operadores, solo a nivel informativo — no afecta al cálculo de
          incentivos ni GP Coins de ninguno de los dos (que siguen siendo independientes).
        </p>
      </Card>

      {/* KPIs de Lowi del equipo */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={Wifi} label="Ventas Lowi (equipo)" value={fmtNum(tot.lowiTotal)} accent="text-sky-400" />
        <StatCard icon={Wifi} label="Lowi activas (equipo)" value={fmtNum(tot.lowiActivas)} accent="text-emerald-400" />
        <StatCard icon={Coins} label="Facturación Lowi activa" value={fmtEur(tot.lowiFact)} sub="Suma de cuotas mensuales activas" accent="text-sky-400" />
      </div>

      {/* Portabilidad Lowi del equipo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard icon={Repeat} label="Portas Lowi activas (equipo)" value={fmtNum(tot.lowiPortasActivas)} accent="text-emerald-400" />
        <StatCard icon={Repeat} label="Portas Lowi pendientes (equipo)" value={fmtNum(tot.lowiPortasPendientes)} accent="text-gp-gold" />
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
          <div className="p-5"><PageSkeleton /></div>
        ) : filas.length === 0 ? (
          <EmptyState icon={Users} title="Sin agentes" hint="Aún no hay usuarios con datos registrados." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-fg-muted border-b border-bg-border bg-bg-surface2/60">
                  <th className="px-4 py-3 font-semibold">#</th>
                  <th className="px-4 py-3 font-semibold">Agente</th>
                  <th className="px-4 py-3 font-semibold text-center">Racha</th>
                  <th className="px-4 py-3 font-semibold text-center">Ventas</th>
                  <th className="px-4 py-3 font-semibold text-center">Clientes nuevos</th>
                  <th className="px-4 py-3 font-semibold text-center">Instal. activas</th>
                  <th className="px-4 py-3 font-semibold text-right">GP directos</th>
                  <th className="px-4 py-3 font-semibold text-center">Incentivos OK</th>
                  <th className="px-4 py-3 font-semibold text-center">Lowi (act./tot.)</th>
                  <th className="px-4 py-3 font-semibold text-right">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {filas.map((f, i) => {
                  const medalla = ['text-gp-gold', 'text-slate-300', 'text-amber-600'][i];
                  return (
                  <tr
                    key={f.uid}
                    onClick={() => setAgenteSel(f)}
                    className={`border-b border-bg-border/60 odd:bg-bg-surface2/25 hover:bg-bg-surface2/60 transition-colors cursor-pointer ${agenteSel?.uid === f.uid ? '!bg-bg-surface2/70' : ''}`}
                  >
                    <td className={`px-4 py-3 tabnum font-semibold ${medalla || 'text-fg-muted'}`}>{i + 1}</td>
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
                    <td className="px-4 py-3 text-center tabnum">
                      {f.racha > 0
                        ? <span className="inline-flex items-center gap-1 text-gp-gold font-semibold"><Flame size={13} /> {f.racha}</span>
                        : <span className="text-fg-muted">—</span>}
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
                <tr className="text-left text-[11px] uppercase tracking-wide text-fg-muted border-b border-bg-border bg-bg-surface2/60">
                  <th className="px-3 py-2 font-semibold">Cliente</th>
                  <th className="px-3 py-2 font-semibold">Fecha venta</th>
                  <th className="px-3 py-2 font-semibold">Convergencia</th>
                  <th className="px-3 py-2 font-semibold">Terminal</th>
                  <th className="px-3 py-2 font-semibold text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ventasMes.map((v) => (
                  <tr key={v.id} className="border-b border-bg-border/60 odd:bg-bg-surface2/25 hover:bg-bg-surface2/60 transition-colors">
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
                      <Badge tone={ESTADOS[estadoDe(v)]?.tone || 'neutral'}>
                        {ESTADOS[estadoDe(v)]?.label || '—'}
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

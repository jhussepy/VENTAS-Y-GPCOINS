import { useMemo } from 'react';
import {
  ShoppingCart, Coins, Wifi, UserPlus, Trophy, KeyRound, Star, CalendarClock, Repeat, Smartphone, Tv, BookOpen,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList,
  PieChart, Pie, AreaChart, Area,
} from 'recharts';
import { useApp } from '../App.jsx';
import { resumenGlobal, portasCruzadas } from '../lib/engine.js';
import { rachaVentas, calcularLogros } from '../lib/logros.js';
import { versiculoDelDia, bendicionDelDia } from '../data/biblia.js';
import { useVersiculo } from '../lib/bibliaApi.js';
import { fmtVentana } from '../lib/portabilidad.js';
import { INCENTIVOS, ORDEN_INCENTIVOS, PERIODO } from '../data/incentivos.js';
import { ESTADOS, ORDEN_ESTADOS, estadoDe } from '../lib/estados.js';
import { TARIFAS_MOVIL } from '../data/movil.js';

const VELOCIDADES_FIBRA = ['Fibra 300 MB', 'Fibra 600 MB', 'Fibra 1 GB'];
import { StatCard, Card, SectionTitle, Badge, Progress, HeroBanner, Insignia } from '../components/ui.jsx';
import { fmtNum } from '../lib/format.js';

// Degradado de color por incentivo para las tarjetas de ranking (estilo
// categorías de la Biblia App: cada tema con su color).
const GRAD_INCENTIVO = {
  clienteNuevo: 'from-vf-redDark to-vf-red',
  xiaomi: 'from-orange-600 to-amber-600',
  samsung: 'from-sky-700 to-blue-600',
  honor: 'from-cyan-700 to-teal-600',
  motorola: 'from-violet-700 to-purple-600',
  jbl: 'from-rose-700 to-pink-600',
};

// Etiquetas cortas para los chips de llaves del resumen de clasificación
const ETIQUETA_LLAVE = {
  clientes34: 'Cli 3P/4P',
  clientes: 'Clientes',
  portas: 'Portas',
  til65: 'TIL65',
  secureNet: 'SecNet',
  fibra: 'Fibra',
  disp: 'Disp',
};

export default function Dashboard() {
  const { ventas, mes, user, objetivosLogros } = useApp();
  const r = useMemo(() => resumenGlobal(ventas, mes), [ventas, mes]);
  // Comparativa entre los meses del período (Junio vs Julio)
  const comparativa = useMemo(() => PERIODO.meses.map((m) => {
    const rm = resumenGlobal(ventas, m);
    return { mes: PERIODO.etiquetas[m], Ventas: rm.totalVentas, Activas: rm.instalacionesActivas, 'GP Coins': rm.gpDirectosTotal };
  }), [ventas]);
  const hayComparativa = comparativa.some((c) => c.Ventas > 0);
  // Portas cuya venta se cerró en otro mes pero cuya ventana de portabilidad cae en el mes activo
  const cruzadas = useMemo(() => portasCruzadas(ventas, mes), [ventas, mes]);
  // Gamificación: racha de ventas (global, no por mes), insignias y foco del día
  const racha = useMemo(() => rachaVentas(ventas), [ventas]);
  const logros = useMemo(() => calcularLogros(r, racha, objetivosLogros), [r, racha, objetivosLogros]);
  const logrosCumplidos = logros.filter((l) => l.cumplido).length;

  // Saludo según la hora del día
  const saludo = useMemo(() => {
    const h = new Date().getHours();
    const momento = h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches';
    const nombre = (user?.displayName || '').split(' ')[0];
    return nombre ? `${momento}, ${nombre}` : momento;
  }, [user]);

  // Todos los incentivos (panorama completo), aunque algunos estén a 0
  const dataChart = r.estados
    .map((e) => ({ nombre: e.nombre, valor: e.puntos || e.gp, esGp: e.mecanica === 'directo' }));

  // Motivos de baja (ventas dadas de baja o canceladas con motivo)
  const motivosBaja = useMemo(() => {
    const m = {};
    for (const v of ventas) {
      if (v.mes !== mes) continue;
      const est = estadoDe(v);
      if ((est === 'baja' || est === 'cancelada') && v.motivoBaja) {
        m[v.motivoBaja] = (m[v.motivoBaja] || 0) + 1;
      }
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [ventas, mes]);

  // Nº total de incentivos (dinámico, en vez de hardcodear 6)
  const totalIncentivos = ORDEN_INCENTIVOS.length;

  // Contenidos de TV vendidos (paquetes 4P con TV) en el mes
  const contenidosTV = useMemo(() => {
    const m = {};
    for (const v of ventas) {
      if (v.mes !== mes || !v.tv) continue;
      m[v.tv] = (m[v.tv] || 0) + 1;
    }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  }, [ventas, mes]);

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

  // Fibra activa por velocidad (ventas activas con convergencia)
  const fibraPorVelocidad = useMemo(() => {
    const activas = ventas.filter((v) => v.mes === mes && estadoDe(v) === 'activa' && v.convergencia);
    const items = VELOCIDADES_FIBRA.map((vel) => ({ label: vel, n: activas.filter((v) => v.velocidad === vel).length }));
    return { items, total: activas.length };
  }, [ventas, mes]);

  // Líneas móviles activas por tarifa (del detalle de líneas móviles de ventas activas)
  const movilPorTarifa = useMemo(() => {
    const cuenta = {};
    let total = 0;
    for (const v of ventas) {
      if (v.mes !== mes || estadoDe(v) !== 'activa') continue;
      for (const l of v.lineasMoviles || []) {
        if (!l.tarifa) continue;
        cuenta[l.tarifa] = (cuenta[l.tarifa] || 0) + 1;
        total += 1;
      }
    }
    const items = TARIFAS_MOVIL.map((t) => ({ label: t.label, n: cuenta[t.id] || 0 }));
    return { items, total };
  }, [ventas, mes]);

  // Evolución de ventas por día del mes activo (por fecha de venta)
  const ventasPorDia = useMemo(() => {
    const anio = Number(PERIODO.inicio.slice(0, 4));
    const idx = mes === 'julio' ? 6 : 5;
    const nDias = new Date(anio, idx + 1, 0).getDate();
    const arr = Array.from({ length: nDias }, (_, i) => ({ dia: i + 1, ventas: 0 }));
    for (const v of ventas) {
      if (v.mes !== mes) continue;
      const f = v.fechaVenta || v.fechaInstalacion;
      if (!f) continue;
      const d = Number(String(f).slice(8, 10));
      if (d >= 1 && d <= nDias) arr[d - 1].ventas += 1;
    }
    const total = arr.reduce((a, b) => a + b.ventas, 0);
    return { arr, total };
  }, [ventas, mes]);

  // --- Proyección / ritmo del mes activo --------------------------------------
  // Se trabaja de lunes a viernes, así que el ritmo y la proyección se calculan
  // en días laborables, no en días de calendario (los findes no cuentan).
  const esLaborable = (d) => d.getDay() !== 0 && d.getDay() !== 6;
  // Normalizamos a medianoche para que comparar fechas no dependa de la hora
  // actual (si no, el último día del rango podría quedar fuera por unos minutos).
  const soloFecha = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const contarLaborables = (desde, hasta) => {
    let n = 0;
    const fin = soloFecha(hasta);
    for (let d = soloFecha(desde); d <= fin; d.setDate(d.getDate() + 1)) {
      if (esLaborable(d)) n += 1;
    }
    return n;
  };

  const proyeccion = useMemo(() => {
    // Año del período (2026) y mes activo (junio=5, julio=6 en base 0)
    const anio = Number(PERIODO.inicio.slice(0, 4));
    const mesIdx = mes === 'julio' ? 6 : 5;
    const inicioMes = new Date(anio, mesIdx, 1);
    const finMes = new Date(anio, mesIdx + 1, 0); // último día del mes
    const diasTotales = contarLaborables(inicioMes, finMes);

    const hoy = soloFecha(new Date());
    // Día de referencia: hoy si cae dentro del mes activo; si no, el mes completo.
    // Se normaliza a medianoche para no salir de "dentro" al pasar la medianoche
    // del último día del mes (comparar con hora real vs. finMes a las 00:00 lo
    // sacaba del período durante todo ese último día).
    const dentro = hoy >= inicioMes && hoy <= finMes;
    const diasTranscurridos = dentro ? Math.max(1, contarLaborables(inicioMes, hoy)) : diasTotales;
    const diasRestantes = dentro ? Math.max(0, contarLaborables(hoy, finMes) - (esLaborable(hoy) ? 1 : 0)) : 0;

    const ventasActuales = r.totalVentas;
    const proyectada = Math.round((ventasActuales / diasTranscurridos) * diasTotales);

    return { diasTotales, diasRestantes, ventasActuales, proyectada, dentro };
  }, [mes, r.totalVentas]);

  return (
    <div className="space-y-6">
      <HeroBanner
        saludo={saludo}
        titulo={`Tu progreso de ${PERIODO.etiquetas[mes]}`}
        subtitulo={`✝ ${bendicionDelDia()}`}
        chip={`Período ${PERIODO.inicio} → ${PERIODO.fin}`}
        accent="vf"
        highlights={[
          { label: 'Ventas', value: r.totalVentas },
          { label: 'Activas', value: r.instalacionesActivas },
          { label: 'GP Coins', value: r.gpDirectosTotal },
        ]}
      />

      <VersiculoDelDiaCard />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard icon={ShoppingCart} label={`Ventas en ${PERIODO.etiquetas[mes]}`} value={fmtNum(r.totalVentas)} accent="text-vf-red" />
        <StatCard icon={Coins} label="GP Coins directos (monedero)" value={fmtNum(r.gpDirectosTotal)} sub={`hasta ${fmtNum(r.gpPotencialMax)} por ranking si clasificas 1º`} accent="text-gp-gold" />
        <StatCard icon={Wifi} label="Instalaciones activas" value={fmtNum(r.instalacionesActivas)} accent="text-emerald-400" />
        <StatCard icon={UserPlus} label="Clientes nuevos" value={fmtNum(r.clientesNuevos)} accent="text-sky-400" />
        <StatCard icon={Repeat} label="Portas activas" value={fmtNum(r.portasActivas)} sub={`de ${fmtNum(r.portasTotales)} solicitadas`} accent="text-emerald-400" />
        <StatCard icon={Repeat} label="Portas pendientes" value={fmtNum(r.portasPendientes)} sub="por activar" accent="text-gp-gold" />
      </div>

      {/* Insignias / logros del mes (estilo perfil de la Biblia App) */}
      <Card>
        <SectionTitle right={<Badge tone="gold">{logrosCumplidos}/{logros.length} conseguidas</Badge>}>
          <span className="flex items-center gap-2"><Trophy size={18} className="text-gp-gold" /> Insignias del mes</span>
        </SectionTitle>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
          {logros.map((l) => <Insignia key={l.id} logro={l} />)}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <SectionTitle right={<Badge tone="neutral">{PERIODO.etiquetas[mes]}</Badge>}>
            Puntos / GP Coins por incentivo
          </SectionTitle>
          {r.totalVentas === 0 ? (
            <div className="py-16 text-center text-fg-muted text-sm">
              Aún no hay ventas registradas este mes. Añade ventas para ver tu progreso.
            </div>
          ) : (
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={dataChart} margin={{ top: 24, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="gradPuntos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FF4D4D" />
                      <stop offset="100%" stopColor="#E60000" />
                    </linearGradient>
                    <linearGradient id="gradGp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFD166" />
                      <stop offset="100%" stopColor="#FFB81C" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                  <XAxis dataKey="nombre" stroke="var(--fg-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--fg-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    cursor={{ fill: 'var(--bg-surface2)', radius: 6 }}
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, color: 'var(--fg)', boxShadow: 'var(--shadow-lg)' }}
                    formatter={(v, _n, p) => [fmtNum(v), p.payload.esGp ? 'GP Coins' : 'Puntos']}
                  />
                  <Bar dataKey="valor" radius={[8, 8, 0, 0]} maxBarSize={84} animationDuration={700}>
                    <LabelList dataKey="valor" position="top" fill="var(--fg-soft)" fontSize={12} fontWeight={600} formatter={(v) => (v ? fmtNum(v) : '')} />
                    {dataChart.map((d, i) => (
                      <Cell key={i} fill={d.esGp ? 'url(#gradGp)' : 'url(#gradPuntos)'} />
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
          <div className="space-y-4">
            {r.estados.map((e) => {
              const cumplidas = e.llaves.filter((l) => l.cumple).length;
              return (
                <div key={e.incentivoId}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-fg-soft font-medium">{e.nombre}</span>
                    <span className={e.clasifica ? 'text-emerald-400' : 'text-fg-muted'}>
                      {e.clasifica ? '✓ Clasificas' : `${cumplidas}/${e.llaves.length} llaves`}
                    </span>
                  </div>
                  <Progress value={(cumplidas / e.llaves.length) * 100} cumple={e.clasifica} />
                  {/* Detalle por llave: verde si cumple, gris con valor/objetivo si falta */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {e.llaves.map((l) => (
                      <span
                        key={l.id}
                        title={l.label}
                        className={`px-1.5 py-0.5 rounded text-[10px] border tabnum ${
                          l.cumple
                            ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                            : 'bg-bg-surface2 text-fg-muted border-bg-border'}`}
                      >
                        {ETIQUETA_LLAVE[l.id] || l.id} {l.tipo === 'porcentaje' ? `${l.valor}/${l.objetivo}%` : `${l.valor}/${l.objetivo}`}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      {/* Comparativa entre meses del período */}
      {hayComparativa && (
        <Card>
          <SectionTitle right={<Badge tone="neutral">{PERIODO.meses.map((m) => PERIODO.etiquetas[m]).join(' vs ')}</Badge>}>
            <span className="flex items-center gap-2"><Trophy size={18} className="text-vf-red" /> Comparativa de meses</span>
          </SectionTitle>
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <BarChart data={comparativa} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                <XAxis dataKey="mes" stroke="var(--fg-muted)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--fg-muted)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} width={30} />
                <Tooltip
                  cursor={{ fill: 'var(--bg-surface2)', radius: 6 }}
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, color: 'var(--fg)', boxShadow: 'var(--shadow-lg)' }}
                  formatter={(v, n) => [fmtNum(v), n]}
                />
                <Bar dataKey="Ventas" fill="#E60000" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={700} />
                <Bar dataKey="Activas" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={700} />
                <Bar dataKey="GP Coins" fill="#FFB81C" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={700} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center justify-center gap-6 mt-2 text-xs text-fg-soft">
            <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#E60000' }} /> Ventas</span>
            <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#10B981' }} /> Activas</span>
            <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm" style={{ background: '#FFB81C' }} /> GP Coins</span>
          </div>
        </Card>
      )}

      {/* Evolución de ventas por día del mes */}
      <Card>
        <SectionTitle right={<Badge tone="neutral">{fmtNum(ventasPorDia.total)} ventas · {PERIODO.etiquetas[mes]}</Badge>}>
          <span className="flex items-center gap-2"><CalendarClock size={18} className="text-vf-red" /> Ventas por día</span>
        </SectionTitle>
        {ventasPorDia.total === 0 ? (
          <p className="py-10 text-center text-fg-muted text-sm">Aún no hay ventas registradas este mes.</p>
        ) : (
          <div style={{ width: '100%', height: 220 }}>
            <ResponsiveContainer>
              <AreaChart data={ventasPorDia.arr} margin={{ top: 10, right: 12, left: -18, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradVentasDia" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#E60000" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#E60000" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--bg-border)" vertical={false} />
                <XAxis dataKey="dia" stroke="var(--fg-muted)" fontSize={11} tickLine={false} axisLine={false} interval={2} />
                <YAxis stroke="var(--fg-muted)" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, color: 'var(--fg)', boxShadow: 'var(--shadow-lg)' }}
                  labelFormatter={(d) => `Día ${d}`}
                  formatter={(v) => [fmtNum(v), 'Ventas']}
                />
                <Area type="monotone" dataKey="ventas" stroke="#E60000" strokeWidth={2} fill="url(#gradVentasDia)" animationDuration={700} dot={false} activeDot={{ r: 4, fill: '#E60000' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </Card>

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
            <p className="text-xs text-fg-muted">Días laborables restantes</p>
            <p className="text-2xl font-semibold text-fg tabnum mt-1">{fmtNum(proyeccion.diasRestantes)}</p>
            {proyeccion.dentro && proyeccion.diasRestantes <= 3 ? (
              <p className="text-xs text-vf-redLight font-medium mt-1">
                {proyeccion.diasRestantes === 0 ? '¡Último día laborable del mes!' : '¡Recta final del mes!'}
              </p>
            ) : (
              <p className="text-xs text-fg-muted mt-1">de {proyeccion.diasTotales} laborables (lun-vie)</p>
            )}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            {/* Donut con total al centro */}
            <div className="relative" style={{ width: '100%', height: 200 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={distribucion.items.filter((it) => it.n > 0)}
                    dataKey="n" nameKey="label"
                    cx="50%" cy="50%" innerRadius={58} outerRadius={84}
                    paddingAngle={2} stroke="none" animationDuration={700}
                  >
                    {distribucion.items.filter((it) => it.n > 0).map((it) => <Cell key={it.id} fill={it.color} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--bg-surface)', border: '1px solid var(--bg-border)', borderRadius: 12, color: 'var(--fg)', boxShadow: 'var(--shadow-lg)' }}
                    formatter={(val, name) => [fmtNum(val), name]}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-fg tabnum leading-none">{fmtNum(distribucion.total)}</span>
                <span className="text-[11px] text-fg-muted mt-0.5">ventas</span>
              </div>
            </div>
            {/* Leyenda con valores */}
            <div className="space-y-2">
              {distribucion.items.map((it) => {
                const pct = distribucion.total ? (it.n / distribucion.total) * 100 : 0;
                return (
                  <div key={it.id} className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 text-fg-soft">
                      <span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: it.color }} />
                      {it.label}
                    </span>
                    <span className="text-fg-muted tabnum">{it.n} · {pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* Motivos de baja (solo si hay alguna baja/cancelada con motivo) */}
      {motivosBaja.length > 0 && (
        <Card>
          <SectionTitle right={<Badge tone="red">{fmtNum(motivosBaja.reduce((a, [, n]) => a + n, 0))} bajas/canceladas</Badge>}>
            Motivos de baja
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {motivosBaja.map(([motivo, n]) => (
              <div key={motivo} className="bg-bg-surface2 rounded-lg p-4 border border-bg-border flex items-center justify-between">
                <span className="text-sm text-fg-soft">{motivo}</span>
                <span className="text-lg font-semibold text-fg tabnum">{n}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Contenidos de TV vendidos (4P) */}
      {contenidosTV.length > 0 && (
        <Card>
          <SectionTitle right={<Badge tone="neutral">{fmtNum(contenidosTV.reduce((a, [, n]) => a + n, 0))} con TV</Badge>}>
            Contenidos TV vendidos (4P)
          </SectionTitle>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {contenidosTV.map(([nombre, n]) => (
              <div key={nombre} className="bg-bg-surface2 rounded-lg p-4 border border-bg-border flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm text-fg-soft"><Tv size={15} className="text-vf-red shrink-0" /> {nombre}</span>
                <span className="text-lg font-semibold text-fg tabnum">{n}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Fibra activa por velocidad y líneas móviles por tarifa */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <SectionTitle right={<Badge tone="neutral">{fmtNum(fibraPorVelocidad.total)} fibras activas</Badge>}>
            <span className="flex items-center gap-2"><Wifi size={18} className="text-emerald-400" /> Fibra activa por velocidad</span>
          </SectionTitle>
          {fibraPorVelocidad.total === 0 ? (
            <p className="py-4 text-center text-fg-muted text-sm">Sin fibras activas este mes.</p>
          ) : (
            <div className="space-y-3">
              {fibraPorVelocidad.items.map((it) => {
                const pct = fibraPorVelocidad.total ? (it.n / fibraPorVelocidad.total) * 100 : 0;
                return (
                  <div key={it.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-fg-soft">{it.label}</span>
                      <span className="text-fg-muted tabnum">{it.n}</span>
                    </div>
                    <div className="w-full h-2 bg-bg-surface2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <SectionTitle right={<Badge tone="neutral">{fmtNum(movilPorTarifa.total)} líneas activas</Badge>}>
            <span className="flex items-center gap-2"><Smartphone size={18} className="text-sky-400" /> Líneas móviles por tarifa</span>
          </SectionTitle>
          {movilPorTarifa.total === 0 ? (
            <p className="py-4 text-center text-fg-muted text-sm">Sin líneas móviles detalladas este mes. Añádelas en el alta de venta.</p>
          ) : (
            <div className="space-y-3">
              {movilPorTarifa.items.map((it) => {
                const pct = movilPorTarifa.total ? (it.n / movilPorTarifa.total) * 100 : 0;
                return (
                  <div key={it.label}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-fg-soft">{it.label}</span>
                      <span className="text-fg-muted tabnum">{it.n}</span>
                    </div>
                    <div className="w-full h-2 bg-bg-surface2 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-sky-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Seguimiento de portabilidad móvil */}
      <Card>
        <SectionTitle right={<Badge tone="neutral">{fmtNum(r.portasTotales)} portas solicitadas</Badge>}>
          <span className="flex items-center gap-2"><Repeat size={18} className="text-vf-red" /> Portabilidad móvil</span>
        </SectionTitle>
        {r.portasTotales === 0 ? (
          <p className="py-6 text-center text-fg-muted text-sm">No hay portabilidades registradas este mes.</p>
        ) : (
          <>
            <p className="text-sm text-fg-soft mb-3">
              <span className="text-emerald-400 font-semibold tabnum">{fmtNum(r.portasActivas)}</span> activas ·{' '}
              <span className="text-gp-gold font-semibold tabnum">{fmtNum(r.portasPendientes)}</span> pendientes ·{' '}
              <span className="font-semibold tabnum">{Math.round((r.portasActivas / r.portasTotales) * 100)}%</span> activadas
            </p>
            <div className="flex w-full h-3 rounded-full overflow-hidden bg-bg-surface2">
              <div className="h-full bg-emerald-500" style={{ width: `${(r.portasActivas / r.portasTotales) * 100}%` }} />
              <div className="h-full bg-gp-gold" style={{ width: `${(r.portasPendientes / r.portasTotales) * 100}%` }} />
            </div>
            <div className="flex items-center gap-6 mt-3 text-xs text-fg-soft">
              <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm bg-emerald-500" /> Activas</span>
              <span className="flex items-center gap-2"><span className="inline-block w-3 h-3 rounded-sm bg-gp-gold" /> Pendientes</span>
            </div>
          </>
        )}
        {cruzadas.length > 0 && (
          <div className="mt-4 rounded-lg border border-sky-500/30 bg-sky-500/[0.06] p-3">
            <p className="text-xs font-medium text-sky-300">
              {fmtNum(cruzadas.length)} {cruzadas.length === 1 ? 'porta viene' : 'portas vienen'} de venta{cruzadas.length === 1 ? '' : 's'} de otro mes
            </p>
            <div className="mt-2 space-y-1">
              {(() => {
                // Un mismo cliente puede tener varias líneas portadas con la misma
                // fecha de ventana (varios números portados a la vez); agrupamos
                // esas filas idénticas con un contador en vez de repetirlas, para
                // que no parezca un dato duplicado por error.
                const grupos = [];
                for (const c of cruzadas) {
                  const clave = `${c.venta.id}|${c.linea.ventanaPorta}|${c.linea.activa}`;
                  const existente = grupos.find((g) => g.clave === clave);
                  if (existente) existente.n += 1;
                  else grupos.push({ clave, n: 1, ...c });
                }
                return grupos.map((g, i) => (
                  <p key={i} className="text-[11px] text-fg-muted">
                    <span className="text-fg-soft">{[g.venta.nombre, g.venta.apellido].filter(Boolean).join(' ') || 'Cliente sin nombre'}</span>
                    {' '}· venta de <span className="capitalize">{g.mesVenta}</span> · ventana {fmtVentana(g.linea.ventanaPorta)}
                    {g.linea.activa ? <span className="text-emerald-400"> · activa</span> : <span className="text-gp-gold"> · pendiente</span>}
                    {g.n > 1 && <span className="text-sky-400 font-semibold"> ×{g.n}</span>}
                  </p>
                ));
              })()}
            </div>
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
            const grad = GRAD_INCENTIVO[e.incentivoId] || 'from-slate-600 to-slate-700';
            return (
              <div key={e.incentivoId} className={`relative overflow-hidden rounded-xl p-4 text-white bg-gradient-to-br ${grad} shadow-md`}>
                <div className="absolute -top-8 -right-6 w-28 h-28 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-center justify-between mb-2 gap-2">
                    <span className="font-semibold text-base">{e.nombre}</span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${e.clasifica ? 'bg-white/25' : 'bg-black/25'}`}>
                      {e.clasifica ? '✓ Clasificas' : 'No clasificas'}
                    </span>
                  </div>
                  <p className="text-2xl font-bold tabnum leading-none">{fmtNum(e.puntos)}<span className="text-sm font-medium text-white/80"> pts</span></p>
                  <p className="text-xs text-white/80 mt-1.5">
                    Top {inc.premiados} · 1º: <span className="font-semibold">{inc.premios[0].gpcoins} GP Coins</span>
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// Tarjeta editorial del versículo del día: discreta y consistente con el
// resto del panel (no un banner llamativo), con acento dorado de marca.
function VersiculoDelDiaCard() {
  const vd = versiculoDelDia();
  const { texto, version } = useVersiculo(vd.cita, vd.texto, vd.pid);
  return (
    <div className="relative overflow-hidden rounded-2xl border border-bg-border bg-bg-surface shadow-sm">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-gp-gold to-vf-red" aria-hidden="true" />
      <div className="flex items-start gap-4 p-5 pl-6">
        <span className="p-2 rounded-lg bg-gp-gold/10 text-gp-gold shrink-0" aria-hidden="true"><BookOpen size={17} /></span>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-fg-muted">Versículo del día</p>
          <p className="font-serif text-[15px] text-fg-soft leading-relaxed mt-1.5">“{texto}”</p>
          <p className="text-xs font-semibold text-fg-muted mt-2">{vd.cita} <span className="font-normal">· {version}</span></p>
        </div>
      </div>
    </div>
  );
}

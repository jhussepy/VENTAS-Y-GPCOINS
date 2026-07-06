import { useState, createContext, useContext, lazy, Suspense, useRef, useMemo } from 'react';
import {
  LayoutDashboard, ShoppingCart, Coins, KeyRound, Trophy,
  Tag, Smartphone, Menu, Sun, Moon, LogOut, Loader2, ShieldCheck, Cloud, CloudOff, Check, Wifi,
  Download, Upload, Sparkles, Trash2, Settings, CalendarClock, BookOpen, PhoneCall, AlertTriangle,
} from 'lucide-react';
import { PERIODO } from './data/incentivos.js';
import { mesDesdeFecha } from './lib/engine.js';
import { versiculoDelDia, LEMA } from './data/biblia.js';
import { estaAtrasado } from './lib/agendados.js';
import { useAuth } from './hooks/useAuth.js';
import { useCloudData } from './hooks/useCloudData.js';
import { cerrarSesion } from './lib/firebase.js';
import { esAdmin } from './lib/admin.js';
import { exportarBackup, leerBackup } from './lib/backup.js';
import { ventasDemo, ventasLowiDemo } from './lib/demo.js';

// Páginas con carga diferida (code-splitting) para aligerar el arranque
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Ventas = lazy(() => import('./pages/Ventas.jsx'));
const GPCoins = lazy(() => import('./pages/GPCoins.jsx'));
const Llaves = lazy(() => import('./pages/Llaves.jsx'));
const Incentivos = lazy(() => import('./pages/Incentivos.jsx'));
const Tarifas = lazy(() => import('./pages/Tarifas.jsx'));
const Catalogo = lazy(() => import('./pages/Catalogo.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));
const LowiDashboard = lazy(() => import('./pages/LowiDashboard.jsx'));
const LowiVentas = lazy(() => import('./pages/LowiVentas.jsx'));
const Ajustes = lazy(() => import('./pages/Ajustes.jsx'));
const Fe = lazy(() => import('./pages/Fe.jsx'));
const Agendados = lazy(() => import('./pages/Agendados.jsx'));
import Login from './pages/Login.jsx';
import { PageSkeleton, useConfirm } from './components/ui.jsx';
import MusicPlayer from './components/MusicPlayer.jsx';

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);

const NAV = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, Comp: Dashboard },
  { id: 'ventas', label: 'Ventas', icon: ShoppingCart, Comp: Ventas },
  { id: 'gpcoins', label: 'GP Coins', icon: Coins, Comp: GPCoins },
  { id: 'llaves', label: 'Llaves', icon: KeyRound, Comp: Llaves },
  { id: 'incentivos', label: 'Incentivos', icon: Trophy, Comp: Incentivos },
  { id: 'tarifas', label: 'Tarifas', icon: Tag, Comp: Tarifas },
  { id: 'catalogo', label: 'Catálogo', icon: Smartphone, Comp: Catalogo },
];

const NAV_ADMIN = { id: 'admin', label: 'Supervisor', icon: ShieldCheck, Comp: Admin };
const NAV_FE = { id: 'fe', label: 'Fe', icon: BookOpen, Comp: Fe };
const NAV_AJUSTES = { id: 'ajustes', label: 'Ajustes', icon: Settings, Comp: Ajustes };
// Agendados: compartido entre Vodafone y Lowi (un mismo agente puede tener
// agendados de ambos mundos mezclados en su agenda)
const NAV_AGENDADOS = { id: 'agendados', label: 'Agendados', icon: PhoneCall, Comp: Agendados };

// Menú del mundo Lowi (independiente, sin GP Coins)
const NAV_LOWI = [
  { id: 'lowi-dashboard', label: 'Dashboard', icon: LayoutDashboard, Comp: LowiDashboard },
  { id: 'lowi-ventas', label: 'Ventas Lowi', icon: ShoppingCart, Comp: LowiVentas },
];

// Configuración visual de cada operador
const OPERADORES = {
  vodafone: { label: 'Vodafone', sub: 'Captación · GP Coins', logo: '/vodafone.svg', paginaInicial: 'dashboard' },
  lowi: { label: 'Lowi', sub: 'Seguimiento de ventas', logo: null, paginaInicial: 'lowi-dashboard' },
};

function Spinner() {
  const vd = versiculoDelDia();
  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg-base p-6">
      <div className="flex flex-col items-center gap-4 max-w-md text-center">
        <Loader2 size={32} className="text-vf-red animate-spin" />
        <p className="font-serif text-fg-soft leading-relaxed">“{vd.texto}”</p>
        <p className="text-xs font-semibold text-fg-muted">{vd.cita}</p>
      </div>
    </div>
  );
}

export default function App() {
  const user = useAuth();
  const { ventas, setVentas, ventasLowi, setVentasLowi, tarifas, setTarifas, precios, guardarPrecio, setPrecios, objetivosLogros, guardarObjetivoLogro, setObjetivosLogros, agendados, setAgendados, tema, setTema, loading, estadoGuardado } = useCloudData(user);
  const [operador, setOperador] = useState('vodafone'); // 'vodafone' | 'lowi'
  const [page, setPage] = useState('dashboard');
  // El período activo arranca en el mes real de hoy (no siempre "junio"),
  // para que el Dashboard/GP Coins/Llaves no muestren un mes vencido por defecto.
  const [mes, setMes] = useState(() => mesDesdeFecha(new Date()));
  const [open, setOpen] = useState(false);
  const [prefillVenta, setPrefillVenta] = useState(null); // {marca, sap} para "Vender" desde Catálogo
  const [avisoAgendaCerrado, setAvisoAgendaCerrado] = useState(false); // recordatorio de atrasados descartado esta sesión
  const backupRef = useRef(null);
  // Diálogos de confirmación/aviso con el diseño de la app (sin confirm/alert nativos)
  const { confirmar, avisar, dialogo } = useConfirm();

  // Abre el alta de venta de Vodafone con una marca/modelo ya seleccionados
  const venderModelo = (marca, sap) => {
    setOperador('vodafone');
    setPage('ventas');
    setPrefillVenta({ marca, sap });
    setOpen(false);
  };

  // Abre el alta de venta (Vodafone o Lowi, según el agendado) con los datos
  // del cliente ya rellenados. Se pasa `_agendadoId` en el prefill para que, al
  // GUARDAR la venta, se marque ese agendado como "Convertido" (no antes: si se
  // cancela el alta, el agendado sigue Pendiente). El id viaja con el prefill,
  // así queda ligado a ese formulario y no se queda "colgado" al navegar.
  const convertirAgendado = (a) => {
    const datos = { nombre: a.nombre, apellido: a.apellido, dni: a.dni, telefono: a.telefono, _agendadoId: a.id };
    if (a.operador === 'lowi') {
      setOperador('lowi');
      setPage('lowi-ventas');
    } else {
      setOperador('vodafone');
      setPage('ventas');
    }
    setPrefillVenta(datos);
    setOpen(false);
  };

  // Marca un agendado como "Convertido" (llamado desde Ventas/LowiVentas al
  // guardar una venta que venía de la agenda)
  const marcarAgendadoConvertido = (id) => {
    if (!id) return;
    setAgendados((prev) => prev.map((x) => (x.id === id ? { ...x, estado: 'convertido' } : x)));
  };

  // Restaura datos desde un archivo de copia de seguridad (reemplaza los actuales)
  const onRestaurar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const ok = await confirmar('Restaurar reemplazará TODOS tus datos actuales (ventas, Lowi y tarifas) por los del archivo.', { titulo: 'Restaurar copia', accion: 'Restaurar', peligro: true });
    if (!ok) return;
    try {
      const d = await leerBackup(file);
      setVentas(d.ventas);
      setVentasLowi(d.ventasLowi);
      setTarifas(d.tarifas);
      setPrecios(d.precios);
      setObjetivosLogros(d.objetivosLogros);
      setAgendados(d.agendados);
      avisar('Copia restaurada correctamente.', { titulo: 'Restaurado' });
    } catch {
      avisar('No se pudo leer el archivo de copia de seguridad.', { titulo: 'Error', peligro: true });
    }
  };

  // Carga datos de demostración (para presentaciones)
  const cargarDemo = async () => {
    const ok = await confirmar('Cargar datos de DEMOSTRACIÓN reemplazará tus ventas actuales (Vodafone y Lowi).', { titulo: 'Datos de demostración', accion: 'Cargar demo', peligro: true });
    if (!ok) return;
    setVentas(ventasDemo());
    setVentasLowi(ventasLowiDemo());
  };

  // Limpia todas las ventas (Vodafone y Lowi) — para dejar la app a cero
  const limpiarDatos = async () => {
    const ok = await confirmar('Esto borrará TODAS tus ventas de Vodafone y Lowi.', { titulo: 'Borrar todo', accion: 'Borrar todo', peligro: true });
    if (!ok) return;
    setVentas([]);
    setVentasLowi([]);
  };

  // Monitor de tamaño del documento (Firestore limita 1 MB por documento)
  // IMPORTANTE: este hook debe ir ANTES de cualquier return condicional
  const usoDoc = useMemo(() => {
    try { return new Blob([JSON.stringify({ ventas, ventasLowi, tarifas, precios, agendados })]).size; } catch { return 0; }
  }, [ventas, ventasLowi, tarifas, precios, agendados]);
  const LIMITE_DOC = 1024 * 1024;
  const pctUso = Math.round((usoDoc / LIMITE_DOC) * 100);
  const cercaLimite = pctUso >= 75;

  // Auth loading
  if (user === undefined) return <Spinner />;
  // Not logged in
  if (user === null) return <Login />;
  // Data loading
  if (loading) return <Spinner />;

  const admin = esAdmin(user);

  // Aviso de fin de período: cada mes cambian las ofertas/incentivos (junio→julio→agosto…),
  // así que avisamos al admin con antelación para que prepare los datos del mes siguiente.
  const DIAS_AVISO_FIN_PERIODO = 7;
  const diasParaFinPeriodo = Math.ceil((new Date(`${PERIODO.fin}T23:59:59`) - new Date()) / 86400000);
  const avisoFinPeriodo = admin && diasParaFinPeriodo >= 0 && diasParaFinPeriodo <= DIAS_AVISO_FIN_PERIODO;

  const esLowi = operador === 'lowi';
  const enAgendados = page === 'agendados';
  // Recordatorio de llamadas agendadas atrasadas (pendientes cuya hora ya pasó)
  const agendadosAtrasados = agendados.filter((a) => estaAtrasado(a)).length;
  const avisoAgenda = agendadosAtrasados > 0 && !enAgendados && !avisoAgendaCerrado;
  const nav = esLowi
    ? [...NAV_LOWI, NAV_FE, NAV_AJUSTES]
    : (admin ? [...NAV, NAV_ADMIN, NAV_FE, NAV_AJUSTES] : [...NAV, NAV_FE, NAV_AJUSTES]);
  // Agendados no está en el menú lateral (vive en el conmutador de arriba),
  // pero debe poder resolverse como página activa y para el título de cabecera.
  const paginas = [...nav, NAV_AGENDADOS];
  const opCfg = OPERADORES[operador];

  // Ir a un operador: siempre navega a su página inicial (aunque ya sea el
  // operador activo), para poder volver desde Agendados con un solo clic.
  const irAOperador = (op) => {
    setOperador(op);
    setPage(OPERADORES[op].paginaInicial);
    setOpen(false);
  };

  // Indicador de sincronización con la nube
  const guardado = {
    guardando: { icon: Cloud, text: 'Guardando…', cls: 'text-fg-muted' },
    guardado: { icon: Check, text: 'Guardado', cls: 'text-emerald-400' },
    error: { icon: CloudOff, text: 'Error al guardar', cls: 'text-vf-redLight' },
  }[estadoGuardado];
  const ctx = { ventas, setVentas, ventasLowi, setVentasLowi, tarifas, setTarifas, precios, guardarPrecio, objetivosLogros, guardarObjetivoLogro, agendados, setAgendados, convertirAgendado, marcarAgendadoConvertido, mes, setMes, user, admin, operador, venderModelo, prefillVenta, setPrefillVenta };
  const Active = paginas.find((n) => n.id === page)?.Comp ?? nav[0]?.Comp ?? Dashboard;

  return (
    <AppCtx.Provider value={ctx}>
      <div className="min-h-dvh flex">
        {/* Sidebar */}
        <aside
          className={`fixed lg:static z-40 inset-y-0 left-0 w-64 bg-bg-surface border-r border-bg-border
                      flex flex-col transition-transform duration-300
                      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        >
          <div className="h-16 flex items-center gap-3 px-5 border-b border-bg-border">
            {opCfg.logo
              ? <img src={opCfg.logo} alt={opCfg.label} className="w-8 h-8" />
              : <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center"><Wifi size={18} className="text-white" /></div>}
            <div>
              <p className="font-semibold text-fg leading-tight">{esLowi ? 'Ventas Lowi' : 'Ventas & GP Coins'}</p>
              <p className="text-[10px] text-fg-muted">{opCfg.sub}</p>
            </div>
          </div>

          {/* Conmutador de operador: Vodafone / Lowi + acceso a Agendados */}
          <div className="px-3 pt-3 space-y-1.5">
            <div className="flex bg-bg-surface2 rounded-lg p-1 border border-bg-border">
              {Object.entries(OPERADORES).map(([id, cfg]) => (
                <button
                  key={id}
                  onClick={() => irAOperador(id)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer
                              ${operador === id && !enAgendados
                                ? (id === 'lowi' ? 'bg-sky-600 text-white' : 'bg-vf-red text-white')
                                : 'text-fg-muted hover:text-fg'}`}
                  aria-pressed={operador === id && !enAgendados}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
            {/* Agendados: seguimiento de llamadas, común a Vodafone y Lowi */}
            <button
              onClick={() => { setPage('agendados'); setOpen(false); }}
              className={`w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer border
                          ${enAgendados
                            ? 'bg-vf-red text-white border-vf-red'
                            : 'bg-bg-surface2 text-fg-muted border-bg-border hover:text-fg'}`}
              aria-pressed={enAgendados}
            >
              <PhoneCall size={13} /> Agendados
            </button>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {nav.map((n) => (
              <button
                key={n.id}
                onClick={() => { setPage(n.id); setOpen(false); }}
                className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                            transition-all duration-200 cursor-pointer
                            ${page === n.id
                              ? (esLowi ? 'bg-gradient-to-r from-sky-600 to-sky-700 text-white shadow-md' : 'bg-gradient-to-r from-vf-red to-vf-redDark text-white shadow-md')
                              : 'text-fg-muted hover:text-fg hover:bg-bg-surface2 hover:translate-x-0.5'}`}
                aria-current={page === n.id ? 'page' : undefined}
              >
                {page === n.id && <span className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-1 rounded-r-full bg-white/80" />}
                <n.icon size={18} aria-hidden="true" className={page === n.id ? '' : 'group-hover:scale-110 transition-transform'} />
                {n.label}
              </button>
            ))}
          </nav>

          {/* User + logout */}
          <div className="p-3 border-t border-bg-border space-y-2">
            <div className="flex items-center gap-2 px-2">
              {user.photoURL && (
                <img src={user.photoURL} alt="" className="w-7 h-7 rounded-full" referrerPolicy="no-referrer" />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-fg truncate">{user.displayName}</p>
                <p className="text-[10px] text-fg-muted truncate">{user.email}</p>
              </div>
            </div>
            {/* Copia de seguridad de todos los datos */}
            <div className="flex gap-1">
              <button
                onClick={() => exportarBackup({ ventas, ventasLowi, tarifas, precios, objetivosLogros, agendados })}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] text-fg-muted hover:text-fg hover:bg-bg-surface2 transition-colors cursor-pointer"
                title="Descargar copia de seguridad (JSON)"
              >
                <Download size={13} /> Copia
              </button>
              <button
                onClick={() => backupRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] text-fg-muted hover:text-fg hover:bg-bg-surface2 transition-colors cursor-pointer"
                title="Restaurar desde copia de seguridad"
              >
                <Upload size={13} /> Restaurar
              </button>
              <input ref={backupRef} type="file" accept=".json" className="hidden" onChange={onRestaurar} />
            </div>
            <div className="flex gap-1">
              <button
                onClick={cargarDemo}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] text-fg-muted hover:text-fg hover:bg-bg-surface2 transition-colors cursor-pointer"
                title="Cargar datos de demostración"
              >
                <Sparkles size={13} /> Demo
              </button>
              <button
                onClick={limpiarDatos}
                className="flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-[11px] text-fg-muted hover:text-vf-redLight hover:bg-vf-red/10 transition-colors cursor-pointer"
                title="Borrar todas las ventas (Vodafone y Lowi)"
              >
                <Trash2 size={13} /> Limpiar
              </button>
            </div>
            <button
              onClick={() => cerrarSesion()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-fg-muted hover:text-vf-redLight hover:bg-vf-red/10 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
            {!esLowi && (
              <p className="text-[10px] text-fg-muted px-2">
                Período {PERIODO.inicio} → {PERIODO.fin}
              </p>
            )}
            {/* Versículo lema: trabajar como para el Señor */}
            <div className="px-2 pt-1">
              <p className="font-serif text-[11px] text-fg-muted leading-snug italic">“{LEMA.texto}”</p>
              <p className="text-[10px] font-semibold text-fg-muted/80 mt-0.5">{LEMA.cita}</p>
            </div>
          </div>
        </aside>

        {open && (
          <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setOpen(false)} />
        )}

        {/* Main */}
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between gap-4 px-4 lg:px-8 border-b border-bg-border bg-bg-base/80 backdrop-blur sticky top-0 z-20">
            <div className="flex items-center gap-3">
              <button className="lg:hidden btn-ghost p-2" onClick={() => setOpen(true)} aria-label="Abrir menú">
                <Menu size={20} />
              </button>
              <h1 className="flex items-center gap-2 text-base font-semibold text-fg capitalize">
                {(() => { const N = paginas.find((n) => n.id === page); if (!N) return null; return (<>
                  <span className={`p-1.5 rounded-lg ${esLowi ? 'bg-sky-500/10 text-sky-500' : 'bg-vf-red/10 text-vf-red'}`}><N.icon size={16} /></span>
                  {N.label}
                </>); })()}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {guardado && (
                <span className={`hidden sm:flex items-center gap-1 text-xs ${guardado.cls}`} title="Estado de sincronización en la nube">
                  <guardado.icon size={14} className={estadoGuardado === 'guardando' ? 'animate-pulse' : ''} />
                  {guardado.text}
                </span>
              )}
              {!esLowi && !enAgendados && (
                <>
                  <span className="text-xs text-fg-muted hidden sm:inline">Período activo:</span>
                  <div className="flex bg-bg-surface2 rounded-lg p-1 border border-bg-border">
                    {PERIODO.meses.map((m) => (
                      <button
                        key={m}
                        onClick={() => setMes(m)}
                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer
                                    ${mes === m ? 'bg-vf-red text-white' : 'text-fg-muted hover:text-fg'}`}
                      >
                        {PERIODO.etiquetas[m]}
                      </button>
                    ))}
                  </div>
                </>
              )}
              <button
                onClick={() => setTema(tema === 'dark' ? 'light' : 'dark')}
                className="btn-ghost p-2"
                aria-label={tema === 'dark' ? 'Activar modo claro' : 'Activar modo oscuro'}
                title={tema === 'dark' ? 'Modo claro' : 'Modo oscuro'}
              >
                {tema === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8 max-w-[1600px] w-full mx-auto">
            {avisoAgenda && (
              <div className="mb-4 flex items-center gap-3 text-sm px-4 py-3 rounded-lg bg-vf-red/10 text-vf-redLight border border-vf-red/30">
                <AlertTriangle size={18} className="shrink-0" />
                <span className="flex-1">
                  Tienes <span className="font-semibold">{agendadosAtrasados}</span> llamada{agendadosAtrasados === 1 ? '' : 's'} agendada{agendadosAtrasados === 1 ? '' : 's'} atrasada{agendadosAtrasados === 1 ? '' : 's'}.
                </span>
                <button
                  onClick={() => { setPage('agendados'); setOpen(false); }}
                  className="px-3 py-1 rounded-md text-xs font-semibold bg-vf-red text-white hover:bg-vf-redDark transition-colors cursor-pointer shrink-0"
                >
                  Ver agendados
                </button>
                <button onClick={() => setAvisoAgendaCerrado(true)} className="p-1 rounded hover:bg-vf-red/20 cursor-pointer shrink-0 text-base leading-none" aria-label="Descartar aviso" title="Descartar">
                  ✕
                </button>
              </div>
            )}
            {avisoFinPeriodo && (
              <div className="mb-4 flex items-start gap-2 text-sm px-4 py-3 rounded-lg bg-sky-500/15 text-sky-300 border border-sky-500/30">
                <CalendarClock size={18} className="shrink-0 mt-0.5" />
                <span>
                  El período de incentivos actual termina el <span className="font-semibold">{PERIODO.fin}</span>
                  {' '}(quedan {diasParaFinPeriodo} {diasParaFinPeriodo === 1 ? 'día' : 'días'}).
                  Prepara los datos del mes siguiente (puntos, estrellas, precios, tarifas) para cargarlos aquí antes de que empiece.
                </span>
              </div>
            )}
            {cercaLimite && (
              <div className="mb-4 text-sm px-4 py-3 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
                ⚠️ Tus datos ocupan el <span className="font-semibold">{pctUso}%</span> del límite de almacenamiento por usuario.
                Haz una <span className="font-semibold">Copia</span> de seguridad y avísame para migrar a almacenamiento ampliado antes de llegar al 100%.
              </div>
            )}
            <Suspense fallback={<PageSkeleton />}>
              <div key={`${operador}-${page}`} className="fade-in">
                <Active />
              </div>
            </Suspense>
          </main>
        </div>
      </div>
      {dialogo}
      <MusicPlayer />
    </AppCtx.Provider>
  );
}

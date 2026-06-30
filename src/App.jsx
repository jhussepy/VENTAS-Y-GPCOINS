import { useState, createContext, useContext, lazy, Suspense, useRef } from 'react';
import {
  LayoutDashboard, ShoppingCart, Coins, KeyRound, Trophy,
  Tag, Smartphone, Menu, Sun, Moon, LogOut, Loader2, ShieldCheck, Cloud, CloudOff, Check, Wifi,
  Download, Upload, Sparkles, Trash2,
} from 'lucide-react';
import { PERIODO } from './data/incentivos.js';
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
import Login from './pages/Login.jsx';

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
  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg-base">
      <div className="flex flex-col items-center gap-3">
        <Loader2 size={32} className="text-vf-red animate-spin" />
        <p className="text-fg-muted text-sm">Cargando…</p>
      </div>
    </div>
  );
}

export default function App() {
  const user = useAuth();
  const { ventas, setVentas, ventasLowi, setVentasLowi, tarifas, setTarifas, tema, setTema, loading, estadoGuardado } = useCloudData(user);
  const [operador, setOperador] = useState('vodafone'); // 'vodafone' | 'lowi'
  const [page, setPage] = useState('dashboard');
  const [mes, setMes] = useState('junio');
  const [open, setOpen] = useState(false);
  const [prefillVenta, setPrefillVenta] = useState(null); // {marca, sap} para "Vender" desde Catálogo
  const backupRef = useRef(null);

  // Abre el alta de venta de Vodafone con una marca/modelo ya seleccionados
  const venderModelo = (marca, sap) => {
    setOperador('vodafone');
    setPage('ventas');
    setPrefillVenta({ marca, sap });
    setOpen(false);
  };

  // Restaura datos desde un archivo de copia de seguridad (reemplaza los actuales)
  const onRestaurar = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!confirm('Restaurar reemplazará TODOS tus datos actuales (ventas, Lowi y tarifas) por los del archivo. ¿Continuar?')) return;
    try {
      const d = await leerBackup(file);
      setVentas(d.ventas);
      setVentasLowi(d.ventasLowi);
      setTarifas(d.tarifas);
      alert('Copia restaurada correctamente.');
    } catch {
      alert('No se pudo leer el archivo de copia de seguridad.');
    }
  };

  // Carga datos de demostración (para presentaciones)
  const cargarDemo = () => {
    if (!confirm('Cargar datos de DEMOSTRACIÓN reemplazará tus ventas actuales (Vodafone y Lowi). ¿Continuar?')) return;
    setVentas(ventasDemo());
    setVentasLowi(ventasLowiDemo());
  };

  // Limpia todas las ventas (Vodafone y Lowi) — para dejar la app a cero
  const limpiarDatos = () => {
    if (!confirm('Esto borrará TODAS tus ventas de Vodafone y Lowi. ¿Continuar?')) return;
    setVentas([]);
    setVentasLowi([]);
  };

  // Cambia de operador y resetea a su página inicial
  const cambiarOperador = (op) => {
    if (op === operador) return;
    setOperador(op);
    setPage(OPERADORES[op].paginaInicial);
    setOpen(false);
  };

  // Auth loading
  if (user === undefined) return <Spinner />;
  // Not logged in
  if (user === null) return <Login />;
  // Data loading
  if (loading) return <Spinner />;

  const admin = esAdmin(user);
  const esLowi = operador === 'lowi';
  const nav = esLowi ? NAV_LOWI : (admin ? [...NAV, NAV_ADMIN] : NAV);
  const opCfg = OPERADORES[operador];

  // Indicador de sincronización con la nube
  const guardado = {
    guardando: { icon: Cloud, text: 'Guardando…', cls: 'text-fg-muted' },
    guardado: { icon: Check, text: 'Guardado', cls: 'text-emerald-400' },
    error: { icon: CloudOff, text: 'Error al guardar', cls: 'text-vf-redLight' },
  }[estadoGuardado];
  const ctx = { ventas, setVentas, ventasLowi, setVentasLowi, tarifas, setTarifas, mes, setMes, user, admin, operador, venderModelo, prefillVenta, setPrefillVenta };
  const Active = nav.find((n) => n.id === page)?.Comp ?? nav[0]?.Comp ?? Dashboard;

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

          {/* Conmutador de operador: Vodafone / Lowi */}
          <div className="px-3 pt-3">
            <div className="flex bg-bg-surface2 rounded-lg p-1 border border-bg-border">
              {Object.entries(OPERADORES).map(([id, cfg]) => (
                <button
                  key={id}
                  onClick={() => cambiarOperador(id)}
                  className={`flex-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer
                              ${operador === id
                                ? (id === 'lowi' ? 'bg-sky-600 text-white' : 'bg-vf-red text-white')
                                : 'text-fg-muted hover:text-fg'}`}
                  aria-pressed={operador === id}
                >
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {nav.map((n) => (
              <button
                key={n.id}
                onClick={() => { setPage(n.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                            transition-colors cursor-pointer
                            ${page === n.id
                              ? (esLowi ? 'bg-sky-600 text-white' : 'bg-vf-red text-white')
                              : 'text-fg-muted hover:text-fg hover:bg-bg-surface2'}`}
                aria-current={page === n.id ? 'page' : undefined}
              >
                <n.icon size={18} aria-hidden="true" />
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
                onClick={() => exportarBackup({ ventas, ventasLowi, tarifas })}
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
              <h1 className="text-base font-semibold text-fg capitalize">
                {nav.find((n) => n.id === page)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              {guardado && (
                <span className={`hidden sm:flex items-center gap-1 text-xs ${guardado.cls}`} title="Estado de sincronización en la nube">
                  <guardado.icon size={14} className={estadoGuardado === 'guardando' ? 'animate-pulse' : ''} />
                  {guardado.text}
                </span>
              )}
              {!esLowi && (
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
            <Suspense fallback={<div className="py-20 flex justify-center"><Loader2 size={28} className="text-vf-red animate-spin" /></div>}>
              <div key={`${operador}-${page}`} className="fade-in">
                <Active />
              </div>
            </Suspense>
          </main>
        </div>
      </div>
    </AppCtx.Provider>
  );
}

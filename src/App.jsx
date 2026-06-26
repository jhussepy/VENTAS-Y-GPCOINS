import { useState, createContext, useContext } from 'react';
import {
  LayoutDashboard, ShoppingCart, Coins, KeyRound, Trophy,
  Tag, Smartphone, Menu, Sun, Moon, LogOut, Loader2, ShieldCheck, Cloud, CloudOff, Check,
} from 'lucide-react';
import { PERIODO } from './data/incentivos.js';
import { useAuth } from './hooks/useAuth.js';
import { useCloudData } from './hooks/useCloudData.js';
import { cerrarSesion } from './lib/firebase.js';
import { esAdmin } from './lib/admin.js';

import Dashboard from './pages/Dashboard.jsx';
import Ventas from './pages/Ventas.jsx';
import GPCoins from './pages/GPCoins.jsx';
import Llaves from './pages/Llaves.jsx';
import Incentivos from './pages/Incentivos.jsx';
import Tarifas from './pages/Tarifas.jsx';
import Catalogo from './pages/Catalogo.jsx';
import Login from './pages/Login.jsx';
import Admin from './pages/Admin.jsx';

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
  const { ventas, setVentas, tarifas, setTarifas, tema, setTema, loading, estadoGuardado } = useCloudData(user);
  const [page, setPage] = useState('dashboard');
  const [mes, setMes] = useState('junio');
  const [open, setOpen] = useState(false);

  // Auth loading
  if (user === undefined) return <Spinner />;
  // Not logged in
  if (user === null) return <Login />;
  // Data loading
  if (loading) return <Spinner />;

  const admin = esAdmin(user);
  const nav = admin ? [...NAV, NAV_ADMIN] : NAV;

  // Indicador de sincronización con la nube
  const guardado = {
    guardando: { icon: Cloud, text: 'Guardando…', cls: 'text-fg-muted' },
    guardado: { icon: Check, text: 'Guardado', cls: 'text-emerald-400' },
    error: { icon: CloudOff, text: 'Error al guardar', cls: 'text-vf-redLight' },
  }[estadoGuardado];
  const ctx = { ventas, setVentas, tarifas, setTarifas, mes, setMes, user, admin };
  const Active = nav.find((n) => n.id === page)?.Comp ?? Dashboard;

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
            <img src="/vodafone.svg" alt="Vodafone" className="w-8 h-8" />
            <div>
              <p className="font-semibold text-fg leading-tight">Ventas & GP Coins</p>
              <p className="text-[10px] text-fg-muted">Captación · Vodafone</p>
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
                              ? 'bg-vf-red text-white'
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
            <button
              onClick={() => cerrarSesion()}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-fg-muted hover:text-vf-redLight hover:bg-vf-red/10 transition-colors cursor-pointer"
            >
              <LogOut size={14} />
              Cerrar sesión
            </button>
            <p className="text-[10px] text-fg-muted px-2">
              Período {PERIODO.inicio} → {PERIODO.fin}
            </p>
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
            <Active />
          </main>
        </div>
      </div>
    </AppCtx.Provider>
  );
}

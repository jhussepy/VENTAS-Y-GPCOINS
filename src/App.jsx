import { useState, useMemo, createContext, useContext } from 'react';
import {
  LayoutDashboard, ShoppingCart, Coins, KeyRound, Trophy,
  Tag, Smartphone, Menu, X,
} from 'lucide-react';
import { useLocalStorage } from './hooks/useLocalStorage.js';
import { PERIODO } from './data/incentivos.js';

import Dashboard from './pages/Dashboard.jsx';
import Ventas from './pages/Ventas.jsx';
import GPCoins from './pages/GPCoins.jsx';
import Llaves from './pages/Llaves.jsx';
import Incentivos from './pages/Incentivos.jsx';
import Tarifas from './pages/Tarifas.jsx';
import Catalogo from './pages/Catalogo.jsx';

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

export default function App() {
  const [page, setPage] = useState('dashboard');
  const [mes, setMes] = useState('junio');
  const [ventas, setVentas] = useLocalStorage('vf_ventas', []);
  const [open, setOpen] = useState(false);

  const ctx = useMemo(() => ({ ventas, setVentas, mes, setMes }), [ventas, setVentas, mes]);
  const Active = NAV.find((n) => n.id === page)?.Comp ?? Dashboard;

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
              <p className="font-semibold text-white leading-tight">Ventas & GP Coins</p>
              <p className="text-[10px] text-slate-500">Captación · Vodafone</p>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {NAV.map((n) => (
              <button
                key={n.id}
                onClick={() => { setPage(n.id); setOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                            transition-colors cursor-pointer
                            ${page === n.id
                              ? 'bg-vf-red text-white'
                              : 'text-slate-400 hover:text-white hover:bg-bg-surface2'}`}
                aria-current={page === n.id ? 'page' : undefined}
              >
                <n.icon size={18} aria-hidden="true" />
                {n.label}
              </button>
            ))}
          </nav>
          <div className="p-4 border-t border-bg-border text-[10px] text-slate-500">
            Período {PERIODO.inicio} → {PERIODO.fin}
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
              <h1 className="text-base font-semibold text-white capitalize">
                {NAV.find((n) => n.id === page)?.label}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">Período activo:</span>
              <div className="flex bg-bg-surface2 rounded-lg p-1 border border-bg-border">
                {PERIODO.meses.map((m) => (
                  <button
                    key={m}
                    onClick={() => setMes(m)}
                    className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer
                                ${mes === m ? 'bg-vf-red text-white' : 'text-slate-400 hover:text-white'}`}
                  >
                    {PERIODO.etiquetas[m]}
                  </button>
                ))}
              </div>
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

import { useMemo, useState } from 'react';
import { Calculator, Wifi, Smartphone, RotateCcw } from 'lucide-react';
import { Card, SectionTitle, Badge } from '../components/ui.jsx';
import {
  SUBTIPOS, TARIFA_COMISION, UMBRALES_VALLA, ETIQUETA_CATEGORIA,
  comisionCategoria, comisionTotal, faltanParaSiguiente, fmtSol,
} from '../lib/comision.js';

const contadorVacio = (cat) => Object.fromEntries(SUBTIPOS[cat].map((s) => [s.id, 0]));
const ROMANOS = ['1ª', '2ª', '3ª', '4ª'];

// Bloque de una categoría (Fijo o Móvil): inputs por subtipo + su comisión
function BloqueCategoria({ cat, icon: Icon, counts, setCounts }) {
  const r = comisionCategoria(cat, counts);
  const falta = faltanParaSiguiente(r.total, UMBRALES_VALLA[cat]);
  const set = (id, v) => setCounts((p) => ({ ...p, [id]: Math.max(0, Number(v) || 0) }));

  return (
    <Card>
      <SectionTitle
        right={r.valla >= 0
          ? <Badge tone="green">{ROMANOS[r.valla]} valla</Badge>
          : <Badge tone="neutral">Sin valla</Badge>}
      >
        <span className="flex items-center gap-2"><Icon size={18} className="text-vf-red" /> {ETIQUETA_CATEGORIA[cat]}</span>
      </SectionTitle>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {SUBTIPOS[cat].map((s) => (
          <div key={s.id}>
            <label className="label">{s.label} <span className="text-fg-muted font-normal">({s.id})</span></label>
            <input type="number" min="0" className="input" value={counts[s.id]} onChange={(e) => set(s.id, e.target.value)} />
            <p className="text-[11px] text-fg-muted mt-1">
              {r.valla >= 0
                ? <>{fmtSol(r.detalle[s.id].precio)}/ud · <span className="text-fg-soft font-medium">{fmtSol(r.detalle[s.id].importe)}</span></>
                : `Precio en 1ª valla: ${fmtSol(TARIFA_COMISION[cat][s.id][0])}/ud`}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 pt-3 border-t border-bg-border">
        <div className="text-sm text-fg-soft">
          <span className="tabnum font-semibold">{r.total}</span> unidades
          {falta
            ? <span className="text-fg-muted"> · faltan <span className="text-vf-redLight font-semibold tabnum">{falta.faltan}</span> para la {ROMANOS[falta.valla]} valla</span>
            : r.valla >= 0 && <span className="text-emerald-400"> · ¡valla máxima!</span>}
        </div>
        <div className="text-right">
          <p className="text-[11px] text-fg-muted uppercase tracking-wide">Comisión {ETIQUETA_CATEGORIA[cat]}</p>
          <p className="text-xl font-bold text-gp-gold tabnum">{fmtSol(r.importe)}</p>
        </div>
      </div>
    </Card>
  );
}

export default function Comision() {
  const [fijo, setFijo] = useState(() => contadorVacio('fijo'));
  const [movil, setMovil] = useState(() => contadorVacio('movil'));

  const total = useMemo(() => comisionTotal(fijo, movil), [fijo, movil]);

  const limpiar = () => { setFijo(contadorVacio('fijo')); setMovil(contadorVacio('movil')); };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-fg-muted flex items-center gap-2">
          <Calculator size={16} className="text-vf-red" /> Calculadora de comisión Vodafone · moneda <span className="text-fg-soft font-medium">Sol (S/)</span>
        </p>
        <button className="btn-ghost" onClick={limpiar}><RotateCcw size={15} /> Limpiar</button>
      </div>

      {/* Total destacado */}
      <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-md bg-gradient-to-br from-vf-red via-vf-redDark to-rose-900">
        <div className="absolute -top-10 -right-8 w-44 h-44 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Comisión total estimada</p>
            <p className="text-4xl font-bold tabnum mt-1">{fmtSol(total.importe)}</p>
          </div>
          <div className="flex gap-6 text-sm">
            <div>
              <p className="text-white/70 text-xs">Fijo</p>
              <p className="font-semibold tabnum">{fmtSol(total.fijo.importe)}</p>
            </div>
            <div>
              <p className="text-white/70 text-xs">Móvil</p>
              <p className="font-semibold tabnum">{fmtSol(total.movil.importe)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BloqueCategoria cat="fijo" icon={Wifi} counts={fijo} setCounts={setFijo} />
        <BloqueCategoria cat="movil" icon={Smartphone} counts={movil} setCounts={setMovil} />
      </div>

      {/* Tabla de referencia de vallas */}
      <Card>
        <SectionTitle>Tabla de vallas (referencia)</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-fg-muted border-b border-bg-border bg-bg-surface2/60">
                <th className="px-3 py-2 font-semibold">Valla</th>
                <th className="px-3 py-2 font-semibold text-center" colSpan={4}>Fijo (uds · BV / MV / AV)</th>
                <th className="px-3 py-2 font-semibold text-center" colSpan={4}>Móvil (uds · BA / MV / AV)</th>
              </tr>
            </thead>
            <tbody>
              {ROMANOS.map((rom, i) => (
                <tr key={i} className="border-b border-bg-border/60 odd:bg-bg-surface2/25">
                  <td className="px-3 py-2 font-medium text-fg">{rom} valla</td>
                  <td className="px-3 py-2 text-center text-fg-muted tabnum">≥{UMBRALES_VALLA.fijo[i]}</td>
                  <td className="px-3 py-2 text-center tabnum">{fmtSol(TARIFA_COMISION.fijo.BV[i])}</td>
                  <td className="px-3 py-2 text-center tabnum">{fmtSol(TARIFA_COMISION.fijo.MV[i])}</td>
                  <td className="px-3 py-2 text-center tabnum">{fmtSol(TARIFA_COMISION.fijo.AV[i])}</td>
                  <td className="px-3 py-2 text-center text-fg-muted tabnum">≥{UMBRALES_VALLA.movil[i]}</td>
                  <td className="px-3 py-2 text-center tabnum">{fmtSol(TARIFA_COMISION.movil.BA[i])}</td>
                  <td className="px-3 py-2 text-center tabnum">{fmtSol(TARIFA_COMISION.movil.MV[i])}</td>
                  <td className="px-3 py-2 text-center tabnum">{fmtSol(TARIFA_COMISION.movil.AV[i])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[11px] text-fg-muted mt-3">
          Al alcanzar una valla, <span className="text-fg-soft font-medium">todas</span> las unidades de esa categoría se
          pagan a ese precio (retroactivo). Si no llegas a la 1ª valla, esa categoría no paga comisión.
        </p>
      </Card>
    </div>
  );
}

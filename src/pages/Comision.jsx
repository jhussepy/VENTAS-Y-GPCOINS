import { useMemo, useState } from 'react';
import { Calculator, Wifi, Smartphone, RotateCcw, DownloadCloud, FileSpreadsheet } from 'lucide-react';
import { useApp } from '../App.jsx';
import { estadoDe } from '../lib/estados.js';
import { PERIODO } from '../data/incentivos.js';
import { Card, SectionTitle, Badge } from '../components/ui.jsx';
import {
  SUBTIPOS, TARIFA_COMISION, UMBRALES_VALLA, UMBRALES_CLIENTES, ETIQUETA_CATEGORIA,
  comisionCategoria, comisionTotal, faltanParaSiguiente, contarDesdeVentas, prorratearUmbrales, fmtSol,
} from '../lib/comision.js';

const contadorVacio = (cat) => Object.fromEntries(SUBTIPOS[cat].map((s) => [s.id, 0]));
const ROMANOS = ['1ª', '2ª', '3ª', '4ª'];

// Días naturales del mes activo (para prorratear por vacaciones/ausencias)
const diasDelMes = (mes) => {
  const anio = Number(PERIODO.inicio.slice(0, 4));
  const idx = mes === 'julio' ? 6 : 5;
  return new Date(anio, idx + 1, 0).getDate();
};

// Bloque de una categoría (Fijo o Móvil): inputs por subtipo + su comisión
function BloqueCategoria({ cat, icon: Icon, counts, setCounts, umbrales, reducida }) {
  const r = comisionCategoria(cat, counts, umbrales);
  const falta = faltanParaSiguiente(r.total, umbrales);
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
            ? <span className="text-fg-muted"> · faltan <span className="text-vf-redLight font-semibold tabnum">{falta.faltan}</span> para la {ROMANOS[falta.valla]} valla{reducida ? ' (cuota reducida)' : ''}</span>
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
  const { ventas, mes } = useApp();
  const [fijo, setFijo] = useState(() => contadorVacio('fijo'));
  const [movil, setMovil] = useState(() => contadorVacio('movil'));
  const [msg, setMsg] = useState(null);
  // Días trabajados del mes (para prorratear las vallas por vacaciones/ausencias)
  const diasMes = diasDelMes(mes);
  const [diasTrab, setDiasTrab] = useState(diasMes);

  const factor = Math.max(0, Math.min(1, (Number(diasTrab) || 0) / diasMes));
  const reducida = factor < 1;
  const umbrales = useMemo(() => ({
    fijo: reducida ? prorratearUmbrales(UMBRALES_VALLA.fijo, factor) : UMBRALES_VALLA.fijo,
    movil: reducida ? prorratearUmbrales(UMBRALES_VALLA.movil, factor) : UMBRALES_VALLA.movil,
  }), [factor, reducida]);

  const total = useMemo(() => comisionTotal(fijo, movil, umbrales), [fijo, movil, umbrales]);

  const limpiar = () => { setFijo(contadorVacio('fijo')); setMovil(contadorVacio('movil')); setDiasTrab(diasMes); setMsg(null); };

  // Exporta el desglose de la comisión a Excel
  const exportar = async () => {
    const XLSX = await import('xlsx');
    const filas = [];
    for (const cat of ['fijo', 'movil']) {
      const counts = cat === 'fijo' ? fijo : movil;
      const r = comisionCategoria(cat, counts, umbrales[cat]);
      for (const s of SUBTIPOS[cat]) {
        const det = r.detalle[s.id];
        filas.push({
          Categoría: cat === 'fijo' ? 'Fijo' : 'Móvil',
          Subtipo: `${s.label} (${s.id})`,
          Unidades: det.n,
          Valla: r.valla >= 0 ? `${r.valla + 1}ª` : 'Sin valla',
          'Precio/ud (S/)': det.precio,
          'Importe (S/)': det.importe,
        });
      }
    }
    filas.push({ Categoría: 'TOTAL', Subtipo: '', Unidades: '', Valla: '', 'Precio/ud (S/)': '', 'Importe (S/)': total.importe });
    const ws = XLSX.utils.json_to_sheet(filas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comisión');
    XLSX.writeFile(wb, `comision_${PERIODO.etiquetas[mes].toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  // Precarga contando las ventas Vodafone ACTIVAS del período activo
  const precargar = () => {
    const { fijo: f, movil: m, sinClasificar } = contarDesdeVentas(ventas, mes, (v) => estadoDe(v) === 'activa');
    setFijo(f); setMovil(m);
    const totalUds = Object.values(f).reduce((a, b) => a + b, 0) + Object.values(m).reduce((a, b) => a + b, 0);
    if (totalUds === 0 && sinClasificar === 0) {
      setMsg({ tone: 'red', text: `No hay ventas Vodafone activas en ${PERIODO.etiquetas[mes]} que clasificar.` });
    } else {
      let text = `Cargadas ${totalUds} unidades activas de ${PERIODO.etiquetas[mes]}. Puedes ajustar los números a mano.`;
      if (sinClasificar > 0) {
        text += ` ⚠️ ${sinClasificar} línea${sinClasificar === 1 ? '' : 's'} móvil sin tarifa registrada no se pudo clasificar por valor: añádela${sinClasificar === 1 ? '' : 's'} a mano en Bajo/Medio/Alto.`;
      }
      setMsg({ tone: sinClasificar > 0 ? 'red' : 'green', text });
    }
    setTimeout(() => setMsg(null), 9000);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-fg-muted flex items-center gap-2">
          <Calculator size={16} className="text-vf-red" /> Calculadora de comisión Vodafone · moneda <span className="text-fg-soft font-medium">Sol (S/)</span>
        </p>
        <div className="flex gap-2">
          <button className="btn-ghost" onClick={precargar} title={`Contar mis ventas activas de ${PERIODO.etiquetas[mes]}`}>
            <DownloadCloud size={15} /> Precargar desde mis ventas ({PERIODO.etiquetas[mes]})
          </button>
          <button className="btn-ghost" onClick={exportar} disabled={total.importe === 0} title="Exportar el desglose a Excel">
            <FileSpreadsheet size={15} /> Exportar
          </button>
          <button className="btn-ghost" onClick={limpiar}><RotateCcw size={15} /> Limpiar</button>
        </div>
      </div>

      {msg && <div className={`text-sm px-4 py-2 rounded-lg ${msg.tone === 'green' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-vf-red/15 text-vf-redLight'}`} role="alert">{msg.text}</div>}

      {/* Ajuste por días trabajados (vacaciones / ausencias) */}
      <Card>
        <div className="flex flex-wrap items-center gap-3 justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium text-fg">Días trabajados este mes <span className="text-fg-muted font-normal">(vacaciones / ausencias)</span></p>
            <p className="text-[11px] text-fg-muted mt-0.5">Reduce proporcionalmente la cuota de cada valla. Ej.: 15 de 30 días = mitad de unidades.</p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="number" min="1" max={diasMes}
              className="input w-20 text-center"
              value={diasTrab}
              onChange={(e) => setDiasTrab(Math.max(1, Math.min(diasMes, Number(e.target.value) || 1)))}
            />
            <span className="text-sm text-fg-muted">de {diasMes} días</span>
            <Badge tone={reducida ? 'gold' : 'neutral'}>{Math.round(factor * 100)}% de cuota</Badge>
          </div>
        </div>
        {reducida && (
          <p className="text-[11px] text-fg-soft mt-3">
            Cuota reducida — vallas: Fijo ≥{umbrales.fijo.join(' / ')} · Móvil ≥{umbrales.movil.join(' / ')} unidades.
          </p>
        )}
      </Card>

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
        <BloqueCategoria cat="fijo" icon={Wifi} counts={fijo} setCounts={setFijo} umbrales={umbrales.fijo} reducida={reducida} />
        <BloqueCategoria cat="movil" icon={Smartphone} counts={movil} setCounts={setMovil} umbrales={umbrales.movil} reducida={reducida} />
      </div>

      {/* Tabla de referencia de vallas */}
      <Card>
        <SectionTitle>Tabla de vallas (referencia)</SectionTitle>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-fg-muted border-b border-bg-border bg-bg-surface2/60">
                <th className="px-3 py-2 font-semibold text-left" rowSpan={2}>Valla</th>
                <th className="px-3 py-2 font-semibold text-center border-l border-bg-border" rowSpan={2}>Clientes</th>
                <th className="px-3 py-2 font-semibold text-center border-l border-bg-border" colSpan={4}>Fijo</th>
                <th className="px-3 py-2 font-semibold text-center border-l border-bg-border" colSpan={4}>Móvil</th>
              </tr>
              <tr className="text-[10px] uppercase tracking-wide text-fg-muted border-b border-bg-border bg-bg-surface2/40">
                <th className="px-3 py-1.5 font-medium text-center border-l border-bg-border">Uds</th>
                <th className="px-3 py-1.5 font-medium text-center">Bajo (BV)</th>
                <th className="px-3 py-1.5 font-medium text-center">Medio (MV)</th>
                <th className="px-3 py-1.5 font-medium text-center">Alto (AV)</th>
                <th className="px-3 py-1.5 font-medium text-center border-l border-bg-border">Uds</th>
                <th className="px-3 py-1.5 font-medium text-center">Bajo (BA)</th>
                <th className="px-3 py-1.5 font-medium text-center">Medio (MV)</th>
                <th className="px-3 py-1.5 font-medium text-center">Alto (AV)</th>
              </tr>
            </thead>
            <tbody>
              {ROMANOS.map((rom, i) => (
                <tr key={i} className="border-b border-bg-border/60 odd:bg-bg-surface2/25">
                  <td className="px-3 py-2 font-medium text-fg">{rom} valla</td>
                  <td className={`px-3 py-2 text-center tabnum border-l border-bg-border font-semibold ${i === ROMANOS.length - 1 ? 'bg-gp-gold/15 text-gp-gold' : 'text-fg-soft'}`}>
                    ≥{UMBRALES_CLIENTES[i]}
                  </td>
                  <td className="px-3 py-2 text-center text-fg-muted tabnum border-l border-bg-border">≥{UMBRALES_VALLA.fijo[i]}</td>
                  <td className="px-3 py-2 text-center tabnum">{fmtSol(TARIFA_COMISION.fijo.BV[i])}</td>
                  <td className="px-3 py-2 text-center tabnum">{fmtSol(TARIFA_COMISION.fijo.MV[i])}</td>
                  <td className="px-3 py-2 text-center tabnum">{fmtSol(TARIFA_COMISION.fijo.AV[i])}</td>
                  <td className="px-3 py-2 text-center text-fg-muted tabnum border-l border-bg-border">≥{UMBRALES_VALLA.movil[i]}</td>
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

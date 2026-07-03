import {
  Star, AlertTriangle, Info, Flame, Target,
  Sparkles, ShoppingCart, Repeat, UserPlus, Coins, Trophy, Wifi,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

// Iconos disponibles para las insignias (por nombre, desde logros.js)
const ICONOS_LOGRO = { Sparkles, ShoppingCart, Repeat, UserPlus, Coins, Trophy, Wifi, Flame };

// Tarjeta "Foco del día": objetivo accionable más cercano (estilo Versículo del Día)
export function FocoDelDia({ foco, racha = 0 }) {
  if (!foco) return null;
  const cumplido = foco.tipo === 'ok';
  return (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg bg-gradient-to-br ${cumplido ? 'from-emerald-600 to-emerald-500' : 'from-indigo-600 via-violet-600 to-fuchsia-600'}`}>
      <div className="absolute -top-10 -right-6 w-40 h-40 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <div className="relative flex items-start gap-4">
        <span className="p-3 rounded-xl bg-white/15 backdrop-blur shrink-0"><Target size={24} /></span>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Foco del día</p>
          <h3 className="text-lg font-bold leading-tight mt-0.5">{foco.titulo}</h3>
          <p className="text-sm text-white/85 mt-1">{foco.texto}</p>
        </div>
        {racha > 0 && (
          <div className="shrink-0 flex flex-col items-center rounded-xl bg-white/15 backdrop-blur px-3 py-2 ring-1 ring-white/20">
            <Flame size={18} className="text-amber-300" />
            <span className="text-lg font-bold tabnum leading-none mt-0.5">{racha}</span>
            <span className="text-[10px] text-white/75">racha</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Insignia individual: medalla circular con progreso (estilo perfil de la app)
export function Insignia({ logro }) {
  const Icon = ICONOS_LOGRO[logro.icono] || Star;
  const c = logro.cumplido;
  return (
    <div className="flex flex-col items-center text-center gap-1.5" title={logro.desc}>
      <div className={`relative w-14 h-14 rounded-full flex items-center justify-center ring-2 transition-transform hover:scale-105 ${c ? 'bg-gp-gold/15 ring-gp-gold text-gp-gold' : 'bg-bg-surface2 ring-bg-border text-fg-muted'}`}>
        <Icon size={22} />
        {c && <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] ring-2 ring-bg-surface">✓</span>}
      </div>
      <span className={`text-[11px] font-medium leading-tight ${c ? 'text-fg' : 'text-fg-muted'}`}>{logro.label}</span>
      <div className="w-full h-1 bg-bg-surface2 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${c ? 'bg-gp-gold' : 'bg-vf-red'}`} style={{ width: `${logro.pct}%` }} />
      </div>
      <span className="text-[10px] text-fg-muted leading-tight">
        {c ? 'Conseguida' : `Faltan ${Math.max(0, logro.objetivo - logro.valor)}`}
      </span>
    </div>
  );
}

// ---------------------------------------------------------------------------
//  Diálogo de confirmación con el diseño de la app (sustituye a confirm/alert)
//  Uso:  const { confirmar, avisar, dialogo } = useConfirm();
//        if (!(await confirmar('¿Eliminar esta venta?', { peligro: true }))) return;
//        Renderiza {dialogo} una vez en el componente.
// ---------------------------------------------------------------------------
export function useConfirm() {
  const [estado, setEstado] = useState(null);
  const confirmar = useCallback((mensaje, opts = {}) =>
    new Promise((resolve) => setEstado({ mensaje, resolve, ...opts })), []);
  const avisar = useCallback((mensaje, opts = {}) =>
    new Promise((resolve) => setEstado({ mensaje, resolve, soloAviso: true, ...opts })), []);
  const cerrar = (ok) => { estado?.resolve(ok); setEstado(null); };

  const dialogo = estado ? (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 fade-in" onClick={() => cerrar(false)}>
      <div
        className="card w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
        role="alertdialog" aria-modal="true" aria-label={estado.titulo || 'Confirmación'}
      >
        <div className="flex items-start gap-3">
          <span className={`p-2.5 rounded-xl shrink-0 ${estado.peligro ? 'bg-vf-red/10 text-vf-red' : 'bg-sky-500/10 text-sky-400'}`}>
            {estado.peligro ? <AlertTriangle size={20} /> : <Info size={20} />}
          </span>
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-fg">{estado.titulo || (estado.soloAviso ? 'Aviso' : '¿Confirmar?')}</h2>
            <p className="text-sm text-fg-soft mt-1 leading-relaxed">{estado.mensaje}</p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          {!estado.soloAviso && <button className="btn-ghost" onClick={() => cerrar(false)} autoFocus>Cancelar</button>}
          <button className="btn-primary" onClick={() => cerrar(true)}>
            {estado.soloAviso ? 'Entendido' : (estado.accion || 'Confirmar')}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return { confirmar, avisar, dialogo };
}

export function Card({ children, className = '', accent = false }) {
  // accent: true|'red' = barra roja de marca · 'green' = éxito
  const acc = accent === 'green' ? 'card-accent card-accent-green' : (accent ? 'card-accent' : '');
  return <div className={`card p-5 ${acc} ${className}`}>{children}</div>;
}

// Cuenta ascendente animada (respeta prefers-reduced-motion)
export function useCountUp(target, duration = 900) {
  const [val, setVal] = useState(0);
  const ref = useRef(0);
  useEffect(() => {
    const fin = Number(target) || 0;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setVal(fin); return; }
    const ini = ref.current;
    const t0 = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(1, (t - t0) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // ease-out cúbico
      const cur = ini + (fin - ini) * eased;
      setVal(cur);
      if (p < 1) raf = requestAnimationFrame(tick);
      else ref.current = fin;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function AnimatedNumber({ value, format = (n) => Math.round(n).toLocaleString('es-ES') }) {
  const v = useCountUp(value);
  return <span>{format(v)}</span>;
}

// Banner de cabecera con degradado de marca y métricas destacadas
export function HeroBanner({ saludo, titulo, subtitulo, chip, highlights = [], accent = 'vf' }) {
  const grad = accent === 'lowi'
    ? 'from-sky-600 via-sky-500 to-emerald-500'
    : 'from-vf-redDark via-vf-red to-vf-redLight';
  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} text-white p-6 shadow-lg`}>
      <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-20 right-24 w-40 h-40 rounded-full bg-white/5 blur-2xl" aria-hidden="true" />
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="min-w-0">
          {saludo && <p className="text-xs font-medium uppercase tracking-wider text-white/70">{saludo}</p>}
          <h2 className="text-2xl font-bold tracking-tight mt-0.5">{titulo}</h2>
          {subtitulo && <p className="text-sm text-white/80 mt-1 max-w-xl">{subtitulo}</p>}
          {chip && <span className="inline-flex items-center gap-1 mt-3 px-2.5 py-1 rounded-lg bg-white/15 backdrop-blur text-xs font-semibold">{chip}</span>}
        </div>
        {highlights.length > 0 && (
          <div className="flex gap-3 shrink-0">
            {highlights.map((h) => (
              <div key={h.label} className="rounded-xl bg-white/12 backdrop-blur px-4 py-3 min-w-[88px] text-center ring-1 ring-white/15">
                <p className="text-2xl font-bold tabnum leading-tight"><AnimatedNumber value={h.value} format={h.format} /></p>
                <p className="text-[11px] text-white/75 mt-0.5">{h.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, sub, accent = 'text-vf-red' }) {
  // Derivamos un fondo translúcido del color de acento para el halo del icono
  const halo = {
    'text-vf-red': 'bg-vf-red/10 ring-vf-red/15',
    'text-vf-redLight': 'bg-vf-red/10 ring-vf-red/15',
    'text-gp-gold': 'bg-gp-gold/10 ring-gp-gold/20',
    'text-emerald-400': 'bg-emerald-500/10 ring-emerald-500/20',
    'text-sky-400': 'bg-sky-500/10 ring-sky-500/20',
    'text-fg': 'bg-bg-surface2 ring-bg-border',
  }[accent] || 'bg-bg-surface2 ring-bg-border';
  return (
    <div className="card p-5 flex items-start gap-4 group">
      <div className={`p-3 rounded-xl ring-1 ${halo} ${accent} transition-transform duration-200 group-hover:scale-105`}>
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-fg-muted truncate uppercase tracking-wide">{label}</p>
        <p className="text-2xl font-bold tabnum text-fg mt-0.5 leading-tight">{value}</p>
        {sub && <p className="text-xs text-fg-muted mt-1">{sub}</p>}
      </div>
    </div>
  );
}

export function Progress({ value, cumple }) {
  // Protegemos contra NaN / negativos / >100 (p. ej. divisiones por cero)
  const v = Number.isFinite(value) ? Math.max(0, Math.min(100, value)) : 0;
  return (
    <div className="w-full h-2 bg-bg-surface2 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-500 ${cumple ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-vf-red to-vf-redLight'}`}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }) {
  const tones = {
    neutral: 'bg-bg-surface2 text-fg-soft border-bg-border',
    red: 'bg-vf-red/15 text-vf-redLight border-vf-red/30',
    gold: 'bg-gp-gold/15 text-gp-gold border-gp-gold/30',
    green: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    sky: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${tones[tone]}`}>
      {children}
    </span>
  );
}

// Avatar con las iniciales del cliente y color estable derivado del nombre
const AVATAR_COLORES = ['#E60000', '#0284C7', '#059669', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D'];
export function Avatar({ nombre = '', apellido = '' }) {
  const texto = `${nombre} ${apellido}`.trim();
  const iniciales = (((nombre || '')[0] || '') + ((apellido || '')[0] || '')).toUpperCase() || '?';
  let h = 0;
  for (const c of texto) h = ((h * 31 + c.charCodeAt(0)) >>> 0);
  const color = AVATAR_COLORES[h % AVATAR_COLORES.length];
  return (
    <span
      className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0 ring-2 ring-white/10"
      style={{ background: `linear-gradient(135deg, ${color}, ${color}CC)` }}
      aria-hidden="true"
    >
      {iniciales}
    </span>
  );
}

export function EstrellaTag({ tipo = 'ESTRELLA' }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-gp-gold/15 text-gp-gold text-[10px] font-semibold border border-gp-gold/30">
      <Star size={10} fill="currentColor" /> {tipo}
    </span>
  );
}

export function SectionTitle({ children, right }) {
  return (
    <div className="flex items-center justify-between gap-3 mb-4">
      <h2 className="text-base font-semibold text-fg tracking-tight">{children}</h2>
      {right}
    </div>
  );
}

// Esqueleto de carga que imita el layout del panel (mejor percepción que un spinner)
export function PageSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Cargando contenido">
      <div className="skeleton h-28 rounded-2xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="skeleton h-80 rounded-2xl lg:col-span-2" />
        <div className="skeleton h-80 rounded-2xl" />
      </div>
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-2xl bg-bg-surface2 ring-1 ring-bg-border mb-4 text-fg-muted">
        <Icon size={32} aria-hidden="true" />
      </div>
      <p className="text-fg-soft font-medium">{title}</p>
      {hint && <p className="text-sm text-fg-muted mt-1.5 max-w-sm leading-relaxed">{hint}</p>}
    </div>
  );
}

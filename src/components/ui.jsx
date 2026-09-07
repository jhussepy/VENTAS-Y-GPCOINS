import {
  Star, AlertTriangle, Info, Flame, Target,
  Sparkles, ShoppingCart, Repeat, UserPlus, Coins, Trophy, Wifi,
  CheckCircle2, XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

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

// Anillo de progreso circular (estilo Apple Watch) con degradado
export function ProgressRing({ pct = 0, size = 64, stroke = 4, colorA = '#E60000', colorB = '#FF4D4D', track = 'var(--bg-surface2)', children }) {
  const p = Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const gid = `ring-${colorA.replace('#', '')}-${colorB.replace('#', '')}`;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={colorA} />
            <stop offset="100%" stopColor={colorB} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#${gid})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - p / 100)}
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}

// Insignia individual: medalla circular con anillo de progreso alrededor
export function Insignia({ logro }) {
  const Icon = ICONOS_LOGRO[logro.icono] || Star;
  const c = logro.cumplido;
  return (
    <div className="flex flex-col items-center text-center gap-1.5 group" title={logro.desc}>
      <ProgressRing
        pct={c ? 100 : logro.pct}
        size={62} stroke={4}
        colorA={c ? '#D99700' : '#B30000'}
        colorB={c ? '#FFB81C' : '#FF4D4D'}
      >
        <div className={`w-11 h-11 rounded-full flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${c ? 'bg-gp-gold/15 text-gp-gold' : 'bg-bg-surface2 text-fg-muted'}`}>
          <Icon size={20} />
        </div>
        {c && <span className="absolute bottom-0 right-0 w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] ring-2 ring-bg-surface">✓</span>}
      </ProgressRing>
      <span className={`text-[11px] font-medium leading-tight ${c ? 'text-fg' : 'text-fg-muted'}`}>{logro.label}</span>
      <span className="text-[10px] text-fg-muted leading-tight">
        {c ? 'Conseguida' : `Faltan ${Math.max(0, logro.objetivo - logro.valor)} de ${logro.objetivo}`}
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
    new Promise((resolve) => { setEstado({ mensaje, resolve, ...opts }); }), []);
  const avisar = useCallback((mensaje, opts = {}) =>
    new Promise((resolve) => { setEstado({ mensaje, resolve, soloAviso: true, ...opts }); }), []);
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

// ---------------------------------------------------------------------------
//  Toasts: notificaciones flotantes con auto-cierre y barra de progreso.
//  Uso:  const { toast, toasts } = useToasts();  →  toast('Venta guardada')
//        toast('Error al importar', 'error')     →  renderiza {toasts} una vez.
// ---------------------------------------------------------------------------
const TOAST_ICONS = { ok: CheckCircle2, error: XCircle, info: Info };
const TOAST_COLORS = {
  ok: 'border-emerald-500/40 text-emerald-400',
  error: 'border-vf-red/40 text-vf-redLight',
  info: 'border-sky-500/40 text-sky-400',
};
export function useToasts() {
  const [lista, setLista] = useState([]);
  const quitar = useCallback((id) => setLista((p) => p.filter((t) => t.id !== id)), []);
  const toast = useCallback((mensaje, tipo = 'ok', ms = 3500) => {
    const id = Date.now() + Math.random();
    setLista((p) => [...p.slice(-3), { id, mensaje, tipo, ms }]);
    setTimeout(() => quitar(id), ms);
  }, [quitar]);

  const toasts = lista.length ? createPortal(
    <div className="fixed bottom-4 right-4 z-[80] flex flex-col gap-2 items-end pointer-events-none" aria-live="polite">
      {lista.map((t) => {
        const Icon = TOAST_ICONS[t.tipo] || Info;
        return (
          <div
            key={t.id}
            className={`toast-in pointer-events-auto relative overflow-hidden flex items-center gap-2.5 pl-3.5 pr-3 py-2.5
                        rounded-xl border bg-bg-surface shadow-lg text-sm text-fg-soft max-w-xs ${TOAST_COLORS[t.tipo] || TOAST_COLORS.info}`}
            role="status"
          >
            <Icon size={17} className="shrink-0" />
            <span className="flex-1 min-w-0">{t.mensaje}</span>
            <button onClick={() => quitar(t.id)} className="text-fg-muted hover:text-fg cursor-pointer text-base leading-none shrink-0" aria-label="Cerrar aviso">✕</button>
            <span className="toast-bar absolute bottom-0 left-0 h-0.5 bg-current opacity-40" style={{ animationDuration: `${t.ms}ms` }} />
          </div>
        );
      })}
    </div>,
    document.body,
  ) : null;

  return { toast, toasts };
}

// Ráfaga de confeti CSS (ligera, sin dependencias). Se monta y desaparece sola.
const CONFETI_COLORES = ['#E60000', '#FFB81C', '#10B981', '#0EA5E9', '#FF4D4D', '#A855F7'];
export function Confeti({ n = 18 }) {
  const piezas = Array.from({ length: n }, (_, i) => {
    const ang = (i / n) * Math.PI * 2;
    const dist = 60 + (i % 5) * 22;
    return {
      '--dx': `${Math.cos(ang) * dist}px`,
      '--dy': `${Math.sin(ang) * dist - 40}px`,
      '--rot': `${(i % 2 ? 1 : -1) * (180 + i * 20)}deg`,
      background: CONFETI_COLORES[i % CONFETI_COLORES.length],
      animationDelay: `${(i % 6) * 30}ms`,
    };
  });
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-visible" aria-hidden="true">
      {piezas.map((s, i) => (
        <span
          key={i}
          className="absolute w-2 h-2 rounded-[2px]"
          style={{ ...s, animation: 'confeti 0.9s ease-out both' }}
        />
      ))}
    </div>
  );
}

// Hook: devuelve true durante `ms` cuando `contador` AUMENTA (no en el primer render)
export function useCelebracion(contador, ms = 1200) {
  const [activa, setActiva] = useState(false);
  const prev = useRef(null);
  useEffect(() => {
    if (prev.current !== null && contador > prev.current) {
      setActiva(true);
      const t = setTimeout(() => setActiva(false), ms);
      return () => clearTimeout(t);
    }
    prev.current = contador;
  }, [contador, ms]);
  useEffect(() => { prev.current = contador; }, [contador]);
  return activa;
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
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${grad} text-white p-6 shadow-lg ring-1 ring-white/15`}>
      <div className="absolute -top-16 -right-10 w-56 h-56 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-20 right-24 w-40 h-40 rounded-full bg-white/5 blur-2xl" aria-hidden="true" />
      <div className="absolute -bottom-14 -left-10 w-44 h-44 rounded-full bg-black/15 blur-3xl" aria-hidden="true" />
      {/* Filo superior luminoso, como en las tarjetas */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" aria-hidden="true" />
      <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="min-w-0">
          {saludo && <p className="text-xs font-semibold uppercase tracking-[0.14em] text-transparent bg-clip-text bg-gradient-to-r from-white to-white/60">{saludo}</p>}
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-0.5 drop-shadow-sm">{titulo}</h2>
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

// Sparkline SVG sin dependencias: dibuja una tendencia compacta con relleno
// degradado y punto final. `data` es un array de números.
export function Sparkline({ data = [], stroke = '#E60000', height = 34, className = '' }) {
  if (!data || data.length < 2) return null;
  const w = 100, h = height;
  const max = Math.max(...data), min = Math.min(...data);
  const span = max - min || 1;
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => [i * step, h - 3 - ((v - min) / span) * (h - 6)]);
  const linea = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const area = `${linea} L${w},${h} L0,${h} Z`;
  const [lx, ly] = pts[pts.length - 1];
  const gid = `spk${Math.round(pts[0][1] * 1000 + data.length)}`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" width="100%" height={h}
         className={className} aria-hidden="true">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${gid})`} />
      <path d={linea} fill="none" stroke={stroke} strokeWidth="2"
            strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="2.4" fill={stroke} />
    </svg>
  );
}

const ACCENT_HEX = {
  'text-vf-red': '#E60000',
  'text-vf-redLight': '#FF4D4D',
  'text-gp-gold': '#FFB81C',
  'text-emerald-400': '#10B981',
  'text-sky-400': '#0EA5E9',
  'text-fg': '#8B95A7',
};

// Azulejo de icono en degradado por acento (icono blanco, con sombra del color)
const ACCENT_TILE = {
  'text-vf-red': 'from-vf-red to-vf-redDark shadow-vf-red/30',
  'text-vf-redLight': 'from-vf-redLight to-vf-red shadow-vf-red/30',
  'text-gp-gold': 'from-gp-gold to-gp-goldDark shadow-gp-gold/30',
  'text-emerald-400': 'from-emerald-500 to-emerald-600 shadow-emerald-500/30',
  'text-sky-400': 'from-sky-500 to-sky-600 shadow-sky-500/30',
  'text-fg': 'from-slate-500 to-slate-600 shadow-slate-500/30',
};

export function StatCard({ icon: Icon, label, value, sub, accent = 'text-vf-red', spark, delta }) {
  const hex = ACCENT_HEX[accent] || '#E60000';
  const tile = ACCENT_TILE[accent] || ACCENT_TILE['text-vf-red'];
  return (
    <div className="card p-5 group relative overflow-hidden">
      {/* Marca de agua: el icono grande y translúcido de fondo */}
      <Icon size={104} aria-hidden="true" className={`absolute -right-5 -bottom-6 opacity-[0.05] ${accent} pointer-events-none transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6`} />
      <div className="relative flex items-start gap-4">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${tile} text-white shadow-lg transition-transform duration-200 group-hover:scale-105`}>
          <Icon size={22} aria-hidden="true" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-semibold text-fg-muted truncate uppercase tracking-[0.08em]">{label}</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-3xl font-extrabold tabnum text-fg leading-none tracking-tight">
              {typeof value === 'number' ? <AnimatedNumber value={value} /> : value}
            </p>
            {delta != null && delta !== 0 && (
              <span className={`text-[11px] font-semibold tabnum ${delta > 0 ? 'text-emerald-400' : 'text-vf-redLight'}`}>
                {delta > 0 ? '▲' : '▼'} {Math.abs(delta)}
              </span>
            )}
          </div>
          {sub && <p className="text-xs text-fg-muted mt-1.5">{sub}</p>}
          {spark && spark.length > 1 && (
            <div className="mt-2.5 -mb-0.5"><Sparkline data={spark} stroke={hex} height={30} /></div>
          )}
        </div>
      </div>
    </div>
  );
}

// Estilo de tooltip unificado para todos los gráficos Recharts
export const TOOLTIP_STYLE = {
  background: 'var(--bg-surface)',
  border: '1px solid var(--bg-border)',
  borderRadius: 12,
  color: 'var(--fg)',
  boxShadow: 'var(--shadow-lg)',
  fontSize: 12,
};

// Leyenda de gráfico coherente: puntos de color + etiqueta, centrada
export function ChartLegend({ items = [], className = '' }) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-fg-soft ${className}`}>
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: it.color }} />
          {it.label}
        </span>
      ))}
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
      <h2 className="relative text-[15px] font-bold text-fg tracking-tight pl-3
                     before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2
                     before:h-4 before:w-1 before:rounded-full
                     before:bg-gradient-to-b before:from-vf-red before:to-vf-redLight">
        {children}
      </h2>
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

import { Star } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

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
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${tones[tone]}`}>
      {children}
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

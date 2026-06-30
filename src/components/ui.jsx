import { Star } from 'lucide-react';

export function Card({ children, className = '', accent = false }) {
  return <div className={`card p-5 ${accent ? 'card-accent' : ''} ${className}`}>{children}</div>;
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

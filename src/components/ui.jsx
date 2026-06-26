import { Star } from 'lucide-react';

export function Card({ children, className = '' }) {
  return <div className={`card p-5 ${className}`}>{children}</div>;
}

export function StatCard({ icon: Icon, label, value, sub, accent = 'text-vf-red' }) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`p-3 rounded-lg bg-bg-surface2 ${accent}`}>
        <Icon size={22} aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-fg-muted truncate">{label}</p>
        <p className="text-2xl font-semibold tabnum text-fg">{value}</p>
        {sub && <p className="text-xs text-fg-muted mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

export function Progress({ value, cumple }) {
  return (
    <div className="w-full h-2 bg-bg-surface2 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-300 ${cumple ? 'bg-emerald-500' : 'bg-vf-red'}`}
        style={{ width: `${Math.min(100, value)}%` }}
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
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-fg">{children}</h2>
      {right}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-4 rounded-full bg-bg-surface2 mb-4 text-fg-muted">
        <Icon size={32} aria-hidden="true" />
      </div>
      <p className="text-fg-soft font-medium">{title}</p>
      {hint && <p className="text-sm text-fg-muted mt-1 max-w-sm">{hint}</p>}
    </div>
  );
}

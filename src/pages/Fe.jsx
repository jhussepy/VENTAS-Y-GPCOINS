import { useState } from 'react';
import { BookOpen, Heart, Check, ChevronLeft, ChevronRight, Sparkles, ExternalLink } from 'lucide-react';
import { versiculoDelDia, PLANES, planPorId, PLANES_YOUVERSION_URL } from '../data/biblia.js';
import {
  leerProgreso, alternarDia, resumenPlan,
  leerFavoritos, alternarFavorito, esFavorito,
} from '../lib/fe.js';
import { Card, SectionTitle, Badge } from '../components/ui.jsx';
import { useVersiculo } from '../lib/bibliaApi.js';
import { useHoy, fechaDeHoy } from '../hooks/useHoy.js';

// Tarjeta grande del versículo del día con botón de favorito
function VersiculoDelDia({ versiculo, favorito, onFav }) {
  // Muestra RVR1909 al instante y lo sustituye por la versión configurada
  // (p. ej. NTV) si el usuario conectó su clave de API.Bible.
  const { texto, version } = useVersiculo(versiculo.cita, versiculo.texto, versiculo.pid);
  return (
    <div className="relative overflow-hidden rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700">
      <div className="absolute -top-14 -right-10 w-52 h-52 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-white/70">Versículo del día</p>
          <button
            onClick={onFav}
            className="p-2 rounded-full hover:bg-white/15 transition-colors cursor-pointer"
            aria-label={favorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
            title={favorito ? 'Quitar de favoritos' : 'Guardar en favoritos'}
          >
            <Heart size={20} className={favorito ? 'fill-white text-white' : 'text-white/80'} />
          </button>
        </div>
        <p className="font-serif text-xl sm:text-2xl leading-relaxed mt-3">“{texto}”</p>
        <p className="text-sm font-semibold text-white/85 mt-4">{versiculo.cita} · {version}</p>
      </div>
    </div>
  );
}

// Detalle de un plan: lista de días con marca de leído
function DetallePlan({ plan, progreso, onToggle, onVolver }) {
  const r = resumenPlan(progreso, plan.id);
  return (
    <div className="space-y-6">
      <button onClick={onVolver} className="btn-ghost text-sm"><ChevronLeft size={16} /> Volver a planes</button>

      <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-lg bg-gradient-to-br ${plan.color}`}>
        <div className="absolute -top-12 -right-8 w-44 h-44 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
        <div className="relative">
          <h2 className="text-2xl font-bold">{plan.titulo}</h2>
          <p className="text-sm text-white/85 mt-1">{plan.desc}</p>
          <div className="mt-4 flex items-center gap-3">
            <div className="flex-1 h-2 rounded-full bg-white/25 overflow-hidden">
              <div className="h-full rounded-full bg-white transition-all duration-500" style={{ width: `${r.pct}%` }} />
            </div>
            <span className="text-xs font-semibold tabnum">{r.leidos}/{r.total}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {plan.dias.map((d, i) => {
          const leido = !!progreso?.[plan.id]?.[i];
          return (
            <Card key={i} className={leido ? 'border-emerald-500/40' : ''}>
              <div className="flex items-start gap-3">
                <button
                  onClick={() => onToggle(plan.id, i)}
                  className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center shrink-0 border-2 transition-colors cursor-pointer ${leido ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-bg-border text-fg-muted hover:border-vf-red'}`}
                  aria-label={leido ? 'Marcar como no leído' : 'Marcar como leído'}
                >
                  {leido ? <Check size={16} /> : <span className="text-xs font-semibold">{i + 1}</span>}
                </button>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-fg">Día {i + 1} · {d.cita}</p>
                  <p className="font-serif text-fg-soft leading-relaxed mt-1">{d.texto}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function Fe() {
  const [progreso, setProgreso] = useState(() => leerProgreso());
  const [favs, setFavs] = useState(() => leerFavoritos());
  const [planAbierto, setPlanAbierto] = useState(null);
  const [webAbierta, setWebAbierta] = useState(false);

  const hoy = useHoy();
  const vd = versiculoDelDia(fechaDeHoy(hoy));
  const toggleDia = (planId, i) => setProgreso(alternarDia(planId, i));
  const toggleFav = (v) => setFavs(alternarFavorito(v));

  if (webAbierta) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => setWebAbierta(false)} className="btn-ghost text-sm"><ChevronLeft size={16} /> Volver</button>
          <a href={PLANES_YOUVERSION_URL} target="_blank" rel="noopener noreferrer" className="btn-ghost text-sm">
            Abrir en YouVersion <ExternalLink size={14} />
          </a>
        </div>
        <div className="rounded-2xl overflow-hidden border border-bg-border shadow-sm bg-bg-surface">
          <iframe
            src={PLANES_YOUVERSION_URL}
            title="Planes de YouVersion"
            className="w-full"
            style={{ height: 'calc(100dvh - 8rem)', border: 0 }}
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    );
  }

  if (planAbierto) {
    return (
      <DetallePlan
        plan={planPorId(planAbierto)}
        progreso={progreso}
        onToggle={toggleDia}
        onVolver={() => setPlanAbierto(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <VersiculoDelDia versiculo={vd} favorito={esFavorito(favs, vd.cita)} onFav={() => toggleFav(vd)} />

      {/* Planes de lectura */}
      <div>
        <SectionTitle right={<Badge tone="neutral">{PLANES.length} planes</Badge>}>
          <span className="flex items-center gap-2"><BookOpen size={18} className="text-vf-red" /> Planes de lectura</span>
        </SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {PLANES.map((plan) => {
            const r = resumenPlan(progreso, plan.id);
            return (
              <button
                key={plan.id}
                onClick={() => setPlanAbierto(plan.id)}
                className="text-left group"
              >
                <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-md bg-gradient-to-br ${plan.color} transition-transform group-hover:-translate-y-0.5`}>
                  <div className="absolute -top-8 -right-6 w-28 h-28 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wide text-white/70">{plan.dias.length} días</span>
                      {r.completo
                        ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/25 flex items-center gap-1"><Check size={11} /> Completo</span>
                        : r.leidos > 0 && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/20">En curso</span>}
                    </div>
                    <h3 className="text-lg font-bold mt-2 leading-tight">{plan.titulo}</h3>
                    <p className="text-xs text-white/80 mt-1">{plan.desc}</p>
                    <div className="mt-4 flex items-center gap-2">
                      <div className="flex-1 h-1.5 rounded-full bg-white/25 overflow-hidden">
                        <div className="h-full rounded-full bg-white" style={{ width: `${r.pct}%` }} />
                      </div>
                      <ChevronRight size={16} className="text-white/80" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explorar planes en YouVersion (Bible App) */}
      <div>
        <SectionTitle right={<Badge tone="neutral">YouVersion</Badge>}>
          <span className="flex items-center gap-2"><Sparkles size={18} className="text-vf-red" /> Explorar más planes</span>
        </SectionTitle>
        <p className="text-xs text-fg-muted -mt-2 mb-3">Cientos de planes de la Bible App (YouVersion) para iniciarlos en tu cuenta.</p>
        <button
          onClick={() => setWebAbierta(true)}
          className="group block w-full text-left"
        >
          <div className="relative overflow-hidden rounded-2xl p-5 text-white shadow-md bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 transition-transform group-hover:-translate-y-0.5">
            <div className="absolute -top-8 -right-6 w-32 h-32 rounded-full bg-white/10 blur-2xl" aria-hidden="true" />
            <div className="relative flex items-center gap-4">
              <span className="text-3xl leading-none shrink-0" aria-hidden="true">📖</span>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-bold leading-tight">Explorar planes en YouVersion</h3>
                <p className="text-xs text-white/80 mt-0.5">Paz, oración, familia, finanzas, la Biblia en un año y más.</p>
              </div>
              <ChevronRight size={18} className="text-white/80 shrink-0" />
            </div>
          </div>
        </button>
      </div>

      {/* Versículos favoritos */}
      {favs.length > 0 && (
        <Card>
          <SectionTitle right={<Badge tone="red">{favs.length}</Badge>}>
            <span className="flex items-center gap-2"><Heart size={18} className="text-vf-red" fill="currentColor" /> Mis versículos favoritos</span>
          </SectionTitle>
          <div className="space-y-3">
            {favs.map((f) => (
              <div key={f.cita} className="flex items-start gap-3 bg-bg-surface2 rounded-lg p-3 border border-bg-border">
                <Sparkles size={16} className="text-gp-gold shrink-0 mt-1" />
                <div className="min-w-0 flex-1">
                  <p className="font-serif text-fg-soft leading-relaxed">{f.texto}</p>
                  <p className="text-xs font-semibold text-fg-muted mt-1">{f.cita}</p>
                </div>
                <button onClick={() => toggleFav(f)} className="text-fg-muted hover:text-vf-redLight cursor-pointer" aria-label="Quitar de favoritos" title="Quitar de favoritos">
                  <Heart size={16} fill="currentColor" />
                </button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

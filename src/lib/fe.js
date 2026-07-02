// ============================================================================
//  Persistencia del rincón de Fe: progreso de planes y versículos favoritos.
//  Se guarda en localStorage (personal, offline, sin tocar Firestore).
// ============================================================================
import { PLANES, planPorId } from '../data/biblia.js';

const KEY_PROGRESO = 'fe_planes_progreso'; // { [planId]: { [diaIdx]: true } }
const KEY_FAVS = 'fe_favoritos';           // [{ cita, texto }]

const leer = (k, def) => {
  try { const v = JSON.parse(localStorage.getItem(k)); return v ?? def; } catch { return def; }
};
const escribir = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* ignora */ } };

// --- Progreso de planes -----------------------------------------------------
export const leerProgreso = () => leer(KEY_PROGRESO, {});

// Marca/desmarca un día de un plan como leído y devuelve el progreso nuevo
export function alternarDia(planId, diaIdx) {
  const prog = leerProgreso();
  const plan = { ...(prog[planId] || {}) };
  if (plan[diaIdx]) delete plan[diaIdx]; else plan[diaIdx] = true;
  const next = { ...prog, [planId]: plan };
  escribir(KEY_PROGRESO, next);
  return next;
}

// Nº de días leídos de un plan según un objeto de progreso ya cargado
export const diasLeidos = (progreso, planId) => Object.keys(progreso?.[planId] || {}).length;

// Resumen {leidos, total, pct, completo} de un plan
export function resumenPlan(progreso, planId) {
  const plan = planPorId(planId);
  const total = plan ? plan.dias.length : 0;
  const leidos = Math.min(diasLeidos(progreso, planId), total);
  const pct = total ? Math.round((leidos / total) * 100) : 0;
  return { leidos, total, pct, completo: total > 0 && leidos >= total };
}

// Nº de planes con al menos un día leído (para "Mis planes")
export const planesEnCurso = (progreso) =>
  PLANES.filter((p) => diasLeidos(progreso, p.id) > 0);

// --- Favoritos --------------------------------------------------------------
export const leerFavoritos = () => leer(KEY_FAVS, []);
export const esFavorito = (favs, cita) => (favs || []).some((f) => f.cita === cita);

// Añade/quita un versículo de favoritos y devuelve la lista nueva
export function alternarFavorito(versiculo) {
  const favs = leerFavoritos();
  const existe = favs.some((f) => f.cita === versiculo.cita);
  const next = existe ? favs.filter((f) => f.cita !== versiculo.cita) : [{ cita: versiculo.cita, texto: versiculo.texto }, ...favs];
  escribir(KEY_FAVS, next);
  return next;
}

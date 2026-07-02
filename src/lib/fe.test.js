import { describe, it, expect, beforeEach } from 'vitest';
import { versiculoDelDia, VERSICULOS, PLANES } from '../data/biblia.js';
import { resumenPlan, alternarDia, alternarFavorito, esFavorito, leerFavoritos, leerProgreso } from './fe.js';

// localStorage mínimo para el entorno de test
beforeEach(() => {
  const store = {};
  global.localStorage = {
    getItem: (k) => (k in store ? store[k] : null),
    setItem: (k, v) => { store[k] = String(v); },
    removeItem: (k) => { delete store[k]; },
  };
});

describe('versiculoDelDia', () => {
  it('es estable para el mismo día y rota entre días', () => {
    const a = versiculoDelDia(new Date('2026-07-01'));
    const b = versiculoDelDia(new Date('2026-07-01'));
    const c = versiculoDelDia(new Date('2026-07-02'));
    expect(a).toEqual(b);
    expect(a.cita).not.toBe(c.cita);
  });
  it('siempre devuelve un versículo válido del catálogo', () => {
    const v = versiculoDelDia(new Date('2026-12-31'));
    expect(VERSICULOS).toContainEqual(v);
  });
});

describe('progreso de planes', () => {
  it('marca y desmarca días y calcula el resumen', () => {
    const plan = PLANES[0];
    alternarDia(plan.id, 0);
    alternarDia(plan.id, 1);
    let r = resumenPlan(leerProgreso(), plan.id);
    expect(r.leidos).toBe(2);
    expect(r.total).toBe(plan.dias.length);
    expect(r.completo).toBe(false);

    alternarDia(plan.id, 0); // desmarca
    r = resumenPlan(leerProgreso(), plan.id);
    expect(r.leidos).toBe(1);
  });

  it('marca completo cuando se leen todos los días', () => {
    const plan = PLANES[1];
    plan.dias.forEach((_, i) => alternarDia(plan.id, i));
    const r = resumenPlan(leerProgreso(), plan.id);
    expect(r.completo).toBe(true);
    expect(r.pct).toBe(100);
  });
});

describe('favoritos', () => {
  it('añade y quita un versículo de favoritos', () => {
    const v = VERSICULOS[0];
    let favs = alternarFavorito(v);
    expect(esFavorito(favs, v.cita)).toBe(true);
    favs = alternarFavorito(v);
    expect(esFavorito(favs, v.cita)).toBe(false);
    expect(leerFavoritos()).toHaveLength(0);
  });
});

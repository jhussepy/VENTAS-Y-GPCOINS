const equal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const plain = x => x && typeof x === 'object' && !Array.isArray(x);

// Three-way merge: changes to different fields survive; competing edits fail visibly.
export function fusionar(current, before, after, strict = true, path = '') {
  if (equal(before, after)) return current;
  if (equal(current, before) || equal(current, after)) return after;
  if (plain(before) && plain(after) && plain(current)) {
    const result = { ...current };
    for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (equal(before[key], after[key])) continue;
      const value = fusionar(current[key], before[key], after[key], strict, `${path}.${key}`);
      if (value === undefined) delete result[key]; else result[key] = value;
    }
    return result;
  }
  if (strict) throw new Error(`Conflicto en ${path || 'el registro'}. Hay un cambio de otra sesión; descarga tus pendientes antes de resolverlo.`);
  return after;
}

export function fusionarRegistros(current = [], before = [], after = [], strict = true) {
  const result = new Map(current.map(v => [v.id, v]));
  const old = new Map(before.map(v => [v.id, v]));
  const next = new Map(after.map(v => [v.id, v]));
  for (const id of new Set([...old.keys(), ...next.keys()])) {
    if (equal(old.get(id), next.get(id))) continue;
    const value = fusionar(result.get(id), old.get(id), next.get(id), strict, id);
    if (value === undefined) result.delete(id); else result.set(id, value);
  }
  return [...result.values()];
}
export const camposColeccion = ['ventas', 'ventasLowi', 'agendados'];
export function aplicarOperacion(datos, operacion, strict = false) {
  const next = { ...datos };
  for (const [campo, { before, after }] of Object.entries(operacion.changes)) {
    next[campo] = camposColeccion.includes(campo)
      ? fusionarRegistros(next[campo], before, after, strict)
      : fusionar(next[campo], before, after, strict, campo);
  }
  return next;
}

export const fmtNum = (n) => new Intl.NumberFormat('es-ES').format(n ?? 0);
export const fmtEur = (n) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n ?? 0);
export const fmtFecha = (s) => {
  if (!s) return '—';
  // Parseamos la cadena YYYY-MM-DD directamente: new Date('YYYY-MM-DD') se
  // interpreta en UTC y en zonas horarias negativas mostraría el día anterior.
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[3]}/${m[2]}/${m[1]}`;
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

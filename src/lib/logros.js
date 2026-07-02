// ============================================================================
//  Gamificación: racha de ventas, insignias/logros y "foco del día"
//  Inspirado en la Biblia App (racha + insignias con progreso).
//  Todo se calcula desde los datos que ya existen (ventas + resumen).
// ============================================================================

// Fecha local YYYY-MM-DD sin desfase de zona horaria
const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Racha: nº de días consecutivos (terminando hoy o ayer) con al menos una venta.
// Si la última venta fue anteayer o antes, la racha es 0 (se rompió).
export function rachaVentas(ventas = [], hoy = new Date()) {
  const dias = new Set(ventas.map((v) => String(v.fechaVenta || '').slice(0, 10)).filter(Boolean));
  if (dias.size === 0) return 0;

  const hoyStr = iso(hoy);
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1);
  const ayerStr = iso(ayer);

  // El punto de partida es hoy si hay venta hoy; si no, ayer (aún cuenta la racha).
  let cursor;
  if (dias.has(hoyStr)) cursor = new Date(hoy);
  else if (dias.has(ayerStr)) cursor = ayer;
  else return 0;

  let racha = 0;
  while (dias.has(iso(cursor))) {
    racha += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return racha;
}

// Insignias/logros del mes activo. Devuelve {id, label, desc, icono, valor,
// objetivo, cumplido, pct}. `icono` es el nombre de un icono de lucide-react.
export function calcularLogros(resumen, racha = 0) {
  const r = resumen || {};
  const def = [
    { id: 'primera', label: 'Primera venta', desc: 'Registra tu primera venta del mes', icono: 'Sparkles', valor: r.totalVentas || 0, objetivo: 1 },
    { id: 'diez', label: 'Diez del tirón', desc: '10 ventas en el mes', icono: 'ShoppingCart', valor: r.totalVentas || 0, objetivo: 10 },
    { id: 'portas', label: 'Portador', desc: '5 portas activadas', icono: 'Repeat', valor: r.portasActivas || 0, objetivo: 5 },
    { id: 'clientes', label: 'Captador', desc: '5 clientes nuevos', icono: 'UserPlus', valor: r.clientesNuevos || 0, objetivo: 5 },
    { id: 'gp', label: 'Monedero', desc: 'Genera tus primeros GP Coins directos', icono: 'Coins', valor: r.gpDirectosTotal || 0, objetivo: 1 },
    { id: 'clasifica', label: 'En el podio', desc: 'Clasifica en un incentivo', icono: 'Trophy', valor: r.incentivosClasificados || 0, objetivo: 1 },
    { id: 'instalador', label: 'Instalador', desc: '8 instalaciones activas', icono: 'Wifi', valor: r.instalacionesActivas || 0, objetivo: 8 },
    { id: 'racha7', label: 'Constante', desc: '7 días seguidos vendiendo', icono: 'Flame', valor: racha, objetivo: 7 },
  ];
  return def.map((l) => {
    const pct = l.objetivo ? Math.min(100, Math.round((l.valor / l.objetivo) * 100)) : 0;
    return { ...l, cumplido: l.valor >= l.objetivo, pct };
  });
}

// "Foco del día": el objetivo accionable más cercano de completar.
// Recorre todas las llaves no cumplidas de todos los incentivos y devuelve la
// que menos falta le queda, con un mensaje claro. Si no hay ninguna (todo
// cumplido o sin datos), devuelve un mensaje motivador.
const ETIQUETA_LLAVE = {
  clientes34: 'clientes nuevos 3P/4P', clientes: 'clientes nuevos', portas: 'portas',
  til65: 'líneas TIL65', secureNet: 'activaciones Secure Net', fibra: 'fibras activas', disp: 'dispositivos',
};

export function focoDelDia(resumen) {
  const estados = resumen?.estados || [];
  let mejor = null;
  for (const e of estados) {
    for (const ll of e.llaves || []) {
      if (ll.cumple) continue;
      if (ll.tipo === 'porcentaje') continue; // el % de portas se cubre aparte
      const falta = (ll.objetivo || 0) - (ll.valor || 0);
      if (falta <= 0) continue;
      if (!mejor || falta < mejor.falta) {
        mejor = { falta, incentivo: e.nombre, llave: ETIQUETA_LLAVE[ll.id] || ll.id };
      }
    }
  }
  if (mejor) {
    return {
      tipo: 'objetivo',
      titulo: `Te ${mejor.falta === 1 ? 'falta' : 'faltan'} ${mejor.falta} para una llave`,
      texto: `${mejor.falta} ${mejor.llave} más para desbloquear una llave de ${mejor.incentivo}.`,
    };
  }
  const total = resumen?.totalVentas || 0;
  if (total === 0) {
    return { tipo: 'vacio', titulo: '¡A por la primera venta!', texto: 'Registra tu primera venta del mes para empezar a sumar.' };
  }
  return { tipo: 'ok', titulo: '¡Vas muy bien!', texto: `Llevas ${total} ventas este mes. Sigue así para escalar en el ranking.` };
}

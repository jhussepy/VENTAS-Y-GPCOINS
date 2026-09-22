import { useEffect, useState } from 'react';
import { mesActivoCampanaDesdeFecha, CAMPANA_ACTIVA } from '../data/campanas.js';
const allowed = new Set(['mi-dia','clientes','ingresos','recuperacion','dashboard','ventas','gpcoins','comision','llaves','incentivos','tarifas','catalogo','lowi-dashboard','lowi-ventas','agendados','fe','ajustes']);
function leer() {
  const p = new URLSearchParams(window.location.hash.slice(1));
  const page = allowed.has(p.get('pagina')) ? p.get('pagina') : 'mi-dia';
  const mes = CAMPANA_ACTIVA.meses.some(m => m.id === p.get('mes')) ? p.get('mes') : mesActivoCampanaDesdeFecha(new Date());
  return { page, mes, operador: page.startsWith('lowi-') ? 'lowi' : p.get('operador') === 'lowi' ? 'lowi' : 'vodafone' };
}
export function useNavigation() {
  const [route, setRoute] = useState(leer);
  useEffect(() => {
    const change = () => setRoute(leer()); window.addEventListener('hashchange', change);
    return () => window.removeEventListener('hashchange', change);
  }, []);
  useEffect(() => {
    const hash = `#${new URLSearchParams({ pagina: route.page, mes: route.mes, operador: route.operador })}`;
    if (window.location.hash !== hash) window.history.pushState(null, '', hash);
  }, [route]);
  const update = patch => setRoute(prev => ({ ...prev, ...patch }));
  return { ...route, setPage: page => update({ page }), setMes: mes => update({ mes }), setOperador: operador => update({ operador }) };
}

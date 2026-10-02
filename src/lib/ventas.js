import { unidadesVendidas, mesesImplicados, mesEntrega } from './engine.js';
import { avisosContacto } from './validacion.js';
import { estadoDe } from './estados.js';
import { CATALOGO, PERIODO, udsDe } from '../data/incentivos.js';
import { etiquetaMesCampana } from '../data/campanas.js';

export function mesesSeguimientoVentas(ventas = []) {
  return Array.from(new Set(
    ventas
      .flatMap((venta) => Array.from(mesesImplicados(venta)))
      .filter((mes) => mes && !PERIODO.meses.includes(mes))
  )).sort();
}

export function filtrarVentas(ventas = [], {
  filtroMes = 'todos',
  filtroEstado = 'todos',
  busqueda = '',
} = {}) {
  const q = String(busqueda || '').trim().toLowerCase();
  return ventas.filter((venta) => {
    // Una venta también aparece en el mes de una porta cruzada.
    if (filtroMes !== 'todos' && !mesesImplicados(venta).has(filtroMes)) return false;
    if (filtroEstado !== 'todos' && estadoDe(venta) !== filtroEstado) return false;
    if (!q) return true;
    return [
      venta.nombre,
      venta.apellido,
      venta.dni,
      venta.telefono,
      venta.email,
      venta.pedido,
      venta.idWeb,
    ].some((campo) => String(campo || '').toLowerCase().includes(q));
  });
}

export function errorVentaParaGuardar(venta) {
  if (!String(venta?.nombre || '').trim() || !String(venta?.apellido || '').trim()) {
    return 'Indica al menos nombre y apellido para guardar la venta.';
  }
  return '';
}

export function analizarVentaParaGuardar(venta, ventas = []) {
  const avisos = [];

  if (venta?.fechaVenta && (venta.fechaVenta < PERIODO.inicio || venta.fechaVenta > PERIODO.fin)) {
    avisos.push(
      `La fecha de venta está fuera del período del incentivo (${PERIODO.inicio} → ${PERIODO.fin}). Se guardará para seguimiento, sin aplicar reglas antiguas.`
    );
  }

  const mesSinReglas = !!venta?.mes && !PERIODO.meses.includes(venta.mes);
  if (mesSinReglas) {
    avisos.push(
      `${etiquetaMesCampana(venta.mes)} no tiene reglas de GP Coins/comisión configuradas. La venta seguirá visible en Ventas.`
    );
  }

  avisos.push(...avisosContacto(venta || {}));

  let mesStock = '';
  if (venta?.marca && venta?.sap) {
    const prod = CATALOGO[venta.marca]?.productos.find((p) => p.sap === venta.sap);
    if (prod) {
      // El stock de incentivos sigue la misma regla que GP Coins:
      // cuenta en el mes real de entrega del terminal.
      mesStock = mesEntrega(venta);
      const tope = udsDe(prod, mesStock);
      if (tope > 0) {
        const otras = ventas.filter((guardada) => guardada.id !== venta.id);
        const { porModelo, porFamilia } = unidadesVendidas(
          [...otras, venta],
          venta.marca,
          mesStock,
        );
        const usadasModelo = porModelo[venta.sap] || 0;
        const usadasFamilia = prod.familia
          ? (porFamilia[prod.familia] || 0)
          : usadasModelo;
        const usadas = Math.max(usadasModelo, usadasFamilia);
        if (usadas >= tope) {
          avisos.push(
            `Aviso de stock: se alcanzaría el tope de ${tope} uds (${usadas}) para ${prod.modelo} en ${mesStock}. El stock es global de plataforma; la venta se guarda igualmente.`
          );
        }
      }
    }
  }

  return { avisos, mesSinReglas, mesStock };
}

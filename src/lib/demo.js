// ============================================================================
//  Datos de demostración para presentaciones (Vodafone + Lowi)
//  Genera un conjunto realista y vistoso. No se usa en producción real.
// ============================================================================
import { ventaVacia } from './engine.js';
import { ventaLowiVacia } from './lowi.js';

const v = (over) => ({ ...ventaVacia(), mes: 'junio', estado: 'activa', ...over });
const l = (over) => ({ ...ventaLowiVacia(), ...over });

// --- Ventas Vodafone --------------------------------------------------------
export function ventasDemo() {
  const base = [];

  // 6 clientes nuevos 4P activos con portas activadas, TIL65 y Secure Net
  const nombres = [
    ['Lucía', 'Martín'], ['Hugo', 'García'], ['Sofía', 'Romero'],
    ['Mateo', 'Navarro'], ['Valeria', 'Ortega'], ['Diego', 'Santos'],
  ];
  const velos = ['Fibra 1 GB', 'Fibra 600 MB', 'Fibra 1 GB', 'Fibra 300 MB', 'Fibra 1 GB', 'Fibra 600 MB'];
  nombres.forEach(([nombre, apellido], i) => {
    base.push(v({
      nombre, apellido, dni: `1234567${i}A`, telefono: `60011122${i}`,
      fechaVenta: `2026-06-${String(8 + i).padStart(2, '0')}`,
      fechaInstalacion: `2026-06-${String(12 + i).padStart(2, '0')}`,
      convergencia: '4P', velocidad: velos[i], clienteNuevo: true, fibraActiva: true,
      lineasVoz: 1, portasVoz: 1, portasActivas: 1, til65: 1, secureNet: 1,
      pedido: `PED-10${i}`,
    }));
  });

  // Ventas con dispositivos (GP directos / puntos)
  base.push(v({ nombre: 'Carmen', apellido: 'Flores', convergencia: '4P', velocidad: 'Fibra 1 GB', tv: 'Netflix Estándar', clienteNuevo: true, fibraActiva: true, marca: 'samsung', sap: '316414', dispositivoEntregado: true, cantidad: 2, lineasVoz: 1, portasVoz: 1, portasActivas: 1, secureNet: 1, fechaVenta: '2026-06-16', pedido: 'PED-201' }));
  base.push(v({ nombre: 'Pablo', apellido: 'Gil', marca: 'samsung', sap: '316414', dispositivoEntregado: true, cantidad: 1, fechaVenta: '2026-06-17', pedido: 'PED-202' }));
  base.push(v({ nombre: 'Elena', apellido: 'Cano', marca: 'honor', sap: '316351', dispositivoEntregado: true, cantidad: 2, fechaVenta: '2026-06-18', pedido: 'PED-203' }));
  base.push(v({ nombre: 'Marcos', apellido: 'Ibáñez', marca: 'xiaomi', sap: '316512', dispositivoEntregado: true, cantidad: 1, fechaVenta: '2026-06-19', pedido: 'PED-204' }));
  base.push(v({ nombre: 'Nuria', apellido: 'Vidal', marca: 'jbl', sap: '301459', dispositivoEntregado: true, cantidad: 3, fechaVenta: '2026-06-20', pedido: 'PED-205' }));

  // Ventas en otros estados (para distribución y motivos de baja)
  base.push(v({ nombre: 'Iván', apellido: 'Prieto', estado: 'pendiente', convergencia: '3P', velocidad: 'Fibra 600 MB', clienteNuevo: true, lineasVoz: 2, portasVoz: 2, fechaVenta: '2026-06-22', pedido: 'PED-301' }));
  base.push(v({ nombre: 'Sara', apellido: 'Vega', convergencia: '4P', velocidad: 'Fibra 600 MB', tv: 'DAZN Fútbol', clienteNuevo: true, fibraActiva: true, lineasVoz: 1, portasVoz: 1, portasActivas: 1, secureNet: 1, fechaVenta: '2026-06-14', pedido: 'PED-206' }));
  base.push(v({ nombre: 'Rosa', apellido: 'León', estado: 'baja', motivoBaja: 'Precio / competencia', convergencia: '4P', velocidad: 'Fibra 1 GB', clienteNuevo: true, fechaVenta: '2026-06-05', fechaBaja: '2026-06-21', pedido: 'PED-302' }));
  base.push(v({ nombre: 'Tomás', apellido: 'Reyes', estado: 'cancelada', motivoBaja: 'Mala cobertura', convergencia: '3P', velocidad: 'Fibra 300 MB', clienteNuevo: true, fechaVenta: '2026-06-06', pedido: 'PED-303' }));

  return base;
}

// --- Ventas Lowi ------------------------------------------------------------
export function ventasLowiDemo() {
  return [
    l({ nombre: 'Andrea', apellido: 'Mora', dni: '22334455A', telefono: '600222111', producto: 'fibra_movil', velocidad: 'Fibra 600 Mb', tv: 'Netflix', lineas: 2, cuota: 35, estado: 'activa', fechaVenta: '2026-06-10', fechaInstalacion: '2026-06-14', pedido: 'LW-101', lineasMoviles: [{ tarifa: '50gb', numero: '600111001', tipo: 'porta', operador: 'Movistar', activa: true }, { tarifa: '10gb', numero: '600111002', tipo: 'nueva', operador: '', activa: false }] }),
    l({ nombre: 'Sergio', apellido: 'Cabrera', producto: 'fibra', velocidad: 'Fibra 1 Gb', cuota: 30, estado: 'activa', fechaVenta: '2026-06-11', fechaInstalacion: '2026-06-15', pedido: 'LW-102' }),
    l({ nombre: 'Paula', apellido: 'Herrero', producto: 'fibra_movil', velocidad: 'Fibra 300 Mb', tv: 'Lowi TV', lineas: 1, cuota: 28, estado: 'activa', fechaVenta: '2026-06-12', fechaInstalacion: '2026-06-16', pedido: 'LW-103', lineasMoviles: [{ tarifa: '100gb', numero: '600111003', tipo: 'porta', operador: 'Orange', activa: true }] }),
    l({ nombre: 'Jorge', apellido: 'Ramos', producto: 'movil', lineas: 1, cuota: 12, estado: 'pendiente', fechaVenta: '2026-06-19', pedido: 'LW-104' }),
    l({ nombre: 'Cristina', apellido: 'Lozano', producto: 'fibra', velocidad: 'Fibra 600 Mb', cuota: 25, estado: 'pendiente', fechaVenta: '2026-06-20', pedido: 'LW-105' }),
    l({ nombre: 'Raúl', apellido: 'Méndez', producto: 'fibra_movil', velocidad: 'Fibra 1 Gb', lineas: 2, cuota: 40, estado: 'baja', motivoBaja: 'Precio / competencia', fechaVenta: '2026-06-02', fechaInstalacion: '2026-06-06', fechaBaja: '2026-06-22', pedido: 'LW-106' }),
    l({ nombre: 'Beatriz', apellido: 'Crespo', producto: 'fibra', velocidad: 'Fibra 300 Mb', cuota: 22, estado: 'cancelada', motivoBaja: 'Mudanza', fechaVenta: '2026-06-03', pedido: 'LW-107' }),
    l({ nombre: 'Álvaro', apellido: 'Núñez', producto: 'fibra_movil', velocidad: 'Fibra 600 Mb', tv: 'Pack Deportes', lineas: 1, cuota: 33, estado: 'activa', fechaVenta: '2026-06-13', fechaInstalacion: '2026-06-18', pedido: 'LW-108', lineasMoviles: [{ tarifa: '300gb', numero: '600111004', tipo: 'porta', operador: 'DIGI', activa: false }] }),
  ];
}

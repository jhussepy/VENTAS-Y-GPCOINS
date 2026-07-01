import { describe, it, expect } from 'vitest';
import { mesDesdeFecha, ventaVacia, resumenGlobal, portasDetalle, valorLlave, puntosClienteNuevo, portasCruzadas, estadoEntregaTerminal } from './engine.js';
import { dniValido, telefonoValido, emailValido } from './validacion.js';
import { resumenLowi, mesLowi, ventaLowiVacia } from './lowi.js';

describe('mesDesdeFecha', () => {
  it('clasifica junio y julio correctamente (getMonth base 0)', () => {
    expect(mesDesdeFecha('2026-06-15')).toBe('junio');
    expect(mesDesdeFecha('2026-07-01')).toBe('julio');
  });
  it('por defecto junio si no hay fecha', () => {
    expect(mesDesdeFecha('')).toBe('junio');
  });
  it('no se desfasa por zona horaria en límites de mes', () => {
    expect(mesDesdeFecha('2026-06-30')).toBe('junio');
    expect(mesDesdeFecha('2026-07-01')).toBe('julio');
  });
});

describe('validación de DNI', () => {
  it('acepta DNI válidos', () => {
    expect(dniValido('12345678Z')).toBe(true);
    expect(dniValido('87654321X')).toBe(true);
  });
  it('rechaza DNI con letra incorrecta', () => {
    expect(dniValido('12345678A')).toBe(false);
  });
  it('acepta NIE válido', () => {
    expect(dniValido('X0000000T')).toBe(true);
  });
  it('campo vacío se considera válido (opcional)', () => {
    expect(dniValido('')).toBe(true);
  });
});

describe('validación de teléfono', () => {
  it('acepta móviles/fijos españoles', () => {
    expect(telefonoValido('600111222')).toBe(true);
    expect(telefonoValido('+34 600 111 222')).toBe(true);
    expect(telefonoValido('912345678')).toBe(true);
  });
  it('rechaza números mal formados', () => {
    expect(telefonoValido('12345')).toBe(false);
    expect(telefonoValido('500111222')).toBe(false);
  });
});

describe('validación de email', () => {
  it('acepta y rechaza correctamente', () => {
    expect(emailValido('a@b.com')).toBe(true);
    expect(emailValido('malformado')).toBe(false);
    expect(emailValido('')).toBe(true);
  });
});

describe('resumenLowi', () => {
  it('cuenta estados y facturación activa', () => {
    const v = [
      { ...ventaLowiVacia(), estado: 'activa', cuota: 30 },
      { ...ventaLowiVacia(), estado: 'activa', cuota: 20 },
      { ...ventaLowiVacia(), estado: 'baja', cuota: 40 },
      { ...ventaLowiVacia(), estado: 'pendiente', cuota: 25 },
    ];
    const r = resumenLowi(v);
    expect(r.total).toBe(4);
    expect(r.porEstado.activa).toBe(2);
    expect(r.facturacionActiva).toBe(50);
    // instaladas = activas(2) + bajas(1) = 3 → tasa activación 2/3
    expect(Math.round(r.tasaActivacion)).toBe(67);
  });
});

describe('resumenLowi: portabilidad desde líneas móviles', () => {
  it('cuenta portas activas/pendientes de ventas activas', async () => {
    const { resumenLowi, ventaLowiVacia } = await import('./lowi.js');
    const ventas = [
      { ...ventaLowiVacia(), estado: 'activa', lineasMoviles: [
        { tipo: 'porta', activa: true }, { tipo: 'porta', activa: false }, { tipo: 'nueva', activa: false },
      ] },
      { ...ventaLowiVacia(), estado: 'pendiente', lineasMoviles: [{ tipo: 'porta', activa: true }] }, // no activa → no cuenta
    ];
    const r = resumenLowi(ventas);
    expect(r.portasTotales).toBe(2);
    expect(r.portasActivas).toBe(1);
    expect(r.portasPendientes).toBe(1);
  });
});

describe('mesLowi', () => {
  it('extrae YYYY-MM de la fecha', () => {
    expect(mesLowi('2026-06-15')).toBe('2026-06');
    expect(mesLowi('')).toBe('');
  });
});

describe('portabilidad en resumenGlobal', () => {
  it('agrega portas totales, activas y pendientes (con clamp)', () => {
    const ventas = [
      { ...ventaVacia(), mes: 'junio', estado: 'activa', portasVoz: 3, portasActivas: 2 },
      { ...ventaVacia(), mes: 'junio', estado: 'pendiente', portasVoz: 2, portasActivas: 2 }, // cuenta aunque la venta esté pendiente
    ];
    const r = resumenGlobal(ventas, 'junio');
    expect(r.portasTotales).toBe(5);
    expect(r.portasActivas).toBe(4); // las portas se cuentan por su propia activación
    expect(r.portasPendientes).toBe(1);
  });
});

describe('portasDetalle usa portas activas para el %', () => {
  it('el porcentaje se calcula sobre activas, no solicitadas', () => {
    const ventas = [
      { ...ventaVacia(), mes: 'junio', estado: 'activa', portasVoz: 4, portasActivas: 0, lineasVoz: 4 },
    ];
    const d = portasDetalle(ventas, 'junio');
    expect(d.portas).toBe(0);        // activas
    expect(d.solicitadas).toBe(4);   // solicitadas aparte
    expect(d.lineas).toBe(4);
    expect(d.pct).toBe(0);           // 0 activas → 0%
  });
});

describe('portas atribuidas al mes de su ventana de portabilidad', () => {
  // Venta cerrada en junio, con 2 portas cuya ventana de portabilidad es julio
  const ventaCruzada = {
    ...ventaVacia(), mes: 'junio', estado: 'activa',
    lineasMoviles: [
      { tipo: 'porta', activa: true, ventanaPorta: '2026-07-01T02:00', tarifa: 'total' },
      { tipo: 'porta', activa: true, ventanaPorta: '2026-07-01T02:00', tarifa: 'total' },
    ],
  };

  it('no cuenta las portas en junio (mes de la venta)', () => {
    const r = resumenGlobal([ventaCruzada], 'junio');
    expect(r.portasActivas).toBe(0);
    expect(r.portasTotales).toBe(0);
  });

  it('cuenta las portas en julio (mes de la ventana)', () => {
    const r = resumenGlobal([ventaCruzada], 'julio');
    expect(r.portasActivas).toBe(2);
    expect(r.portasTotales).toBe(2);
    expect(portasDetalle([ventaCruzada], 'julio').pct).toBe(100);
  });

  it('la línea sin ventana cae en el mes de la venta', () => {
    const v = { ...ventaVacia(), mes: 'junio', estado: 'activa',
      lineasMoviles: [{ tipo: 'porta', activa: true, ventanaPorta: '', tarifa: 'total' }] };
    expect(resumenGlobal([v], 'junio').portasActivas).toBe(1);
    expect(resumenGlobal([v], 'julio').portasActivas).toBe(0);
  });

  it('portasCruzadas detecta la venta de junio cuya ventana cae en julio', () => {
    const cruzadas = portasCruzadas([ventaCruzada], 'julio');
    expect(cruzadas).toHaveLength(2);
    expect(cruzadas[0].mesVenta).toBe('junio');
    expect(portasCruzadas([ventaCruzada], 'junio')).toHaveLength(0);
  });
});

describe('gpPotencialMax', () => {
  it('existe y es el techo teórico (>= asegurado por ranking)', () => {
    const r = resumenGlobal([], 'junio');
    expect(r.gpPotencialMax).toBeGreaterThanOrEqual(r.gpPotencialRanking);
  });
});

describe('valorLlave solo cuenta ventas activas', () => {
  it('cliente nuevo pendiente no suma; activo sí', () => {
    const ventas = [
      { ...ventaVacia(), mes: 'junio', clienteNuevo: true, estado: 'activa' },
      { ...ventaVacia(), mes: 'junio', clienteNuevo: true, estado: 'pendiente' },
      { ...ventaVacia(), mes: 'junio', clienteNuevo: true, estado: 'baja' },
    ];
    expect(valorLlave(ventas, 'xiaomi', 'clientes', 'junio')).toBe(1);
  });
  it('fibra y dispositivos solo cuentan en ventas activas (con SAP válido)', () => {
    const ventas = [
      { ...ventaVacia(), mes: 'junio', fibraActiva: true, marca: 'xiaomi', sap: '316512', dispositivoEntregado: true, cantidad: 2, estado: 'activa' },
      { ...ventaVacia(), mes: 'junio', fibraActiva: true, marca: 'xiaomi', sap: '316512', dispositivoEntregado: true, cantidad: 5, estado: 'pendiente' },
    ];
    expect(valorLlave(ventas, 'xiaomi', 'fibra', 'junio')).toBe(1);
    expect(valorLlave(ventas, 'xiaomi', 'disp', 'junio')).toBe(2);
  });
  it('dispositivos: un SAP inexistente no cuenta', () => {
    const ventas = [{ ...ventaVacia(), mes: 'junio', marca: 'xiaomi', sap: 'NO-EXISTE', cantidad: 3, estado: 'activa' }];
    expect(valorLlave(ventas, 'xiaomi', 'disp', 'junio')).toBe(0);
  });
  it('TIL65 solo cuenta en cliente nuevo 3P/4P', () => {
    const ventas = [
      { ...ventaVacia(), mes: 'junio', estado: 'activa', clienteNuevo: true, convergencia: '4P', til65: 2 },
      { ...ventaVacia(), mes: 'junio', estado: 'activa', clienteNuevo: false, convergencia: '4P', til65: 5 }, // no cliente nuevo
      { ...ventaVacia(), mes: 'junio', estado: 'activa', clienteNuevo: true, convergencia: '', til65: 4 },     // sin 3P/4P
    ];
    expect(valorLlave(ventas, 'clienteNuevo', 'til65', 'junio')).toBe(2);
  });
});

describe('puntos y GP solo cuentan ventas activas', () => {
  it('una venta pendiente no aporta puntos de cliente nuevo', () => {
    const base = { ...ventaVacia(), mes: 'junio', convergencia: '4P', velocidad: 'Fibra 1 GB' };
    const soloActiva = puntosClienteNuevo([{ ...base, estado: 'activa' }], 'junio');
    const conPendiente = puntosClienteNuevo(
      [{ ...base, estado: 'activa' }, { ...base, estado: 'pendiente' }], 'junio'
    );
    expect(soloActiva).toBeGreaterThan(0);
    expect(conPendiente).toBe(soloActiva); // la pendiente no suma
  });
  it('resumenGlobal: GP directos no cuentan ventas no activas', () => {
    const v = [
      { ...ventaVacia(), mes: 'junio', marca: 'samsung', sap: 'x', estado: 'pendiente' },
    ];
    const r = resumenGlobal(v, 'junio');
    expect(r.gpDirectosTotal).toBe(0);
  });
});

describe('dispositivo no entregado NO genera puntos ni GP', () => {
  it('sin entregar → 0; entregado → cuenta', () => {
    const sinEntregar = [{ ...ventaVacia(), mes: 'junio', estado: 'activa', marca: 'honor', sap: '316351', cantidad: 1 }];
    expect(resumenGlobal(sinEntregar, 'junio').gpDirectosTotal).toBe(0);
    const entregado = [{ ...ventaVacia(), mes: 'junio', estado: 'activa', marca: 'honor', sap: '316351', dispositivoEntregado: true, cantidad: 1 }];
    expect(resumenGlobal(entregado, 'junio').gpDirectosTotal).toBe(14);
  });
});

describe('GP directos respetan el tope de stock', () => {
  it('capa las unidades de una familia a su stock (uds)', () => {
    // Samsung S26+ (sap 316396): gp 28, uds_junio 20, familia "S26+"
    const ventas = [
      { ...ventaVacia(), mes: 'junio', marca: 'samsung', sap: '316396', dispositivoEntregado: true, cantidad: 25, estado: 'activa' },
    ];
    const r = resumenGlobal(ventas, 'junio');
    expect(r.gpDirectosTotal).toBe(20 * 28); // 25 vendidas → capadas a 20
  });
  it('por debajo del tope acredita todo', () => {
    const ventas = [
      { ...ventaVacia(), mes: 'junio', marca: 'honor', sap: '316351', dispositivoEntregado: true, cantidad: 3, estado: 'activa' },
    ];
    const r = resumenGlobal(ventas, 'junio');
    expect(r.gpDirectosTotal).toBe(3 * 14); // honor uds 300, sin cap
  });
});

describe('estados no activos NO generan puntos ni GP', () => {
  const conv = { convergencia: '4P', velocidad: 'Fibra 1 GB', clienteNuevo: true, mes: 'junio' };
  it('cancelada → 0 puntos de cliente nuevo', () => {
    expect(puntosClienteNuevo([{ ...ventaVacia(), ...conv, estado: 'cancelada' }], 'junio')).toBe(0);
  });
  it('baja y pendiente → 0 puntos', () => {
    expect(puntosClienteNuevo([{ ...ventaVacia(), ...conv, estado: 'baja' }], 'junio')).toBe(0);
    expect(puntosClienteNuevo([{ ...ventaVacia(), ...conv, estado: 'pendiente' }], 'junio')).toBe(0);
  });
  it('resumenGlobal: una cancelada no aporta puntos ni clasifica', () => {
    const r = resumenGlobal([{ ...ventaVacia(), ...conv, estado: 'cancelada' }], 'junio');
    const cn = r.estados.find((e) => e.incentivoId === 'clienteNuevo');
    expect(cn.puntos).toBe(0);
    expect(r.incentivosClasificados).toBe(0);
  });
  it('la misma venta activa SÍ genera puntos (control)', () => {
    expect(puntosClienteNuevo([{ ...ventaVacia(), ...conv, estado: 'activa' }], 'junio')).toBeGreaterThan(0);
  });
});

describe('resumenLineas (líneas móviles)', () => {
  it('deriva líneas, portas, activas y TIL65 desde el detalle', async () => {
    const { resumenLineas } = await import('../data/movil.js');
    const lm = [
      { tarifa: 'ilim60', tipo: 'nueva', activa: false },
      { tarifa: 'ilimtotal', tipo: 'porta', operador: 'Movistar', activa: true },
      { tarifa: 'basica', tipo: 'porta', operador: 'Orange', activa: false },
    ];
    const r = resumenLineas(lm);
    expect(r.lineasVoz).toBe(3);
    expect(r.portasVoz).toBe(2);
    expect(r.portasActivas).toBe(1);
    expect(r.til65).toBe(1); // solo la "Ilimitada Total (TIL65)"
  });
});

describe('líneas móviles → portas activas suman en el Dashboard', () => {
  it('2 portas activas vía líneas se reflejan en resumenGlobal', async () => {
    const { resumenLineas } = await import('../data/movil.js');
    const lineasMoviles = [
      { tarifa: 'ilim60', tipo: 'porta', operador: 'Movistar', activa: true },
      { tarifa: 'ilim160', tipo: 'porta', operador: 'Orange', activa: true },
      { tarifa: 'basica', tipo: 'nueva', activa: false },
    ];
    // Así construye la venta el formulario al guardar (aggregates derivados de las líneas)
    const venta = { ...ventaVacia(), mes: 'junio', estado: 'activa', lineasMoviles, ...resumenLineas(lineasMoviles) };
    const r = resumenGlobal([venta], 'junio');
    expect(venta.portasActivas).toBe(2);
    expect(venta.portasVoz).toBe(2);
    expect(venta.lineasVoz).toBe(3);
    expect(r.portasActivas).toBe(2);   // ✅ suman al Dashboard
    expect(r.portasTotales).toBe(2);
    expect(r.portasPendientes).toBe(0);
  });
});

describe('calcFinanciacion (configurador de terminal)', () => {
  it('cuota = precio / meses; total fijo', async () => {
    const { calcFinanciacion } = await import('../data/financiacion.js');
    expect(calcFinanciacion({ precio: 648, meses: 36 })).toEqual({ pagoInicial: 0, cuota: 18, total: 648 });
    expect(calcFinanciacion({ precio: 648, meses: 24 })).toEqual({ pagoInicial: 0, cuota: 27, total: 648 });
  });
  it('seguro suma a la cuota; pago al contado pone todo en inicial', async () => {
    const { calcFinanciacion } = await import('../data/financiacion.js');
    expect(calcFinanciacion({ precio: 648, meses: 36, seguroExtra: 6 }).cuota).toBe(24);
    expect(calcFinanciacion({ precio: 648, meses: 36, contado: true })).toEqual({ pagoInicial: 648, cuota: 0, total: 648 });
  });
});

describe('datos de demostración', () => {
  it('generan un panel con al menos un incentivo clasificado y GP > 0', async () => {
    const { ventasDemo } = await import('./demo.js');
    const r = resumenGlobal(ventasDemo(), 'junio');
    expect(r.totalVentas).toBeGreaterThan(0);
    expect(r.incentivosClasificados).toBeGreaterThanOrEqual(1);
    expect(r.gpDirectosTotal).toBeGreaterThan(0);
  });
});

describe('ventaVacia', () => {
  it('incluye los campos de contacto nuevos', () => {
    const v = ventaVacia();
    expect(v).toHaveProperty('dni');
    expect(v).toHaveProperty('telefono');
    expect(v).toHaveProperty('email');
    expect(v).toHaveProperty('direccion');
    expect(v).toHaveProperty('pedido');
  });
});

describe('estadoEntregaTerminal', () => {
  const ahora = new Date('2026-07-01T12:00:00');

  it('null si la venta no lleva terminal', () => {
    expect(estadoEntregaTerminal({ ...ventaVacia(), marca: '' }, ahora)).toBeNull();
  });

  it('entregado si ya se marcó como entregado', () => {
    const v = { ...ventaVacia(), marca: 'xiaomi', dispositivoEntregado: true };
    expect(estadoEntregaTerminal(v, ahora)).toBe('entregado');
  });

  it('respeta una incidencia de entrega manual aunque haya pasado el plazo', () => {
    const v = { ...ventaVacia(), marca: 'xiaomi', incidenciaEntrega: 'cliente_ausente' };
    expect(estadoEntregaTerminal(v, ahora)).toBe('cliente_ausente');
  });

  it('pendiente si no hay portas que bloqueen la entrega', () => {
    const v = { ...ventaVacia(), marca: 'xiaomi', lineasMoviles: [{ tipo: 'nueva' }] };
    expect(estadoEntregaTerminal(v, ahora)).toBe('pendiente');
  });

  it('esperando_porta si la porta aún no está activa', () => {
    const v = { ...ventaVacia(), marca: 'xiaomi', lineasMoviles: [{ tipo: 'porta', activa: false, ventanaPorta: '2026-06-28T02:00' }] };
    expect(estadoEntregaTerminal(v, ahora)).toBe('esperando_porta');
  });

  it('esperando_48h si la porta está activa pero no han pasado las 48h', () => {
    const v = { ...ventaVacia(), marca: 'xiaomi', lineasMoviles: [{ tipo: 'porta', activa: true, ventanaPorta: '2026-06-30T02:00' }] };
    expect(estadoEntregaTerminal(v, ahora)).toBe('esperando_48h');
  });

  it('lista cuando ya pasaron 48h desde la ventana activa', () => {
    const v = { ...ventaVacia(), marca: 'xiaomi', lineasMoviles: [{ tipo: 'porta', activa: true, ventanaPorta: '2026-06-28T02:00' }] };
    expect(estadoEntregaTerminal(v, ahora)).toBe('lista');
  });

  it('usa la ventana más tardía cuando hay varias portas activas', () => {
    const v = {
      ...ventaVacia(), marca: 'xiaomi',
      lineasMoviles: [
        { tipo: 'porta', activa: true, ventanaPorta: '2026-06-20T02:00' },
        { tipo: 'porta', activa: true, ventanaPorta: '2026-06-30T02:00' },
      ],
    };
    expect(estadoEntregaTerminal(v, ahora)).toBe('esperando_48h');
  });
});

import { describe, it, expect } from 'vitest';
import { mesDesdeFecha, ventaVacia, resumenGlobal, portasDetalle, valorLlave, puntosClienteNuevo } from './engine.js';
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
  it('fibra y dispositivos solo cuentan en ventas activas', () => {
    const ventas = [
      { ...ventaVacia(), mes: 'junio', fibraActiva: true, marca: 'xiaomi', cantidad: 2, estado: 'activa' },
      { ...ventaVacia(), mes: 'junio', fibraActiva: true, marca: 'xiaomi', cantidad: 5, estado: 'pendiente' },
    ];
    expect(valorLlave(ventas, 'xiaomi', 'fibra', 'junio')).toBe(1);
    expect(valorLlave(ventas, 'xiaomi', 'disp', 'junio')).toBe(2);
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

describe('GP directos respetan el tope de stock', () => {
  it('capa las unidades de una familia a su stock (uds)', () => {
    // Samsung S26+ (sap 316396): gp 28, uds_junio 20, familia "S26+"
    const ventas = [
      { ...ventaVacia(), mes: 'junio', marca: 'samsung', sap: '316396', cantidad: 25, estado: 'activa' },
    ];
    const r = resumenGlobal(ventas, 'junio');
    expect(r.gpDirectosTotal).toBe(20 * 28); // 25 vendidas → capadas a 20
  });
  it('por debajo del tope acredita todo', () => {
    const ventas = [
      { ...ventaVacia(), mes: 'junio', marca: 'honor', sap: '316351', cantidad: 3, estado: 'activa' },
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

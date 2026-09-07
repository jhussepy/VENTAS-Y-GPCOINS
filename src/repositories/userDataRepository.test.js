import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => mocks);
vi.mock('../lib/firebase.js', () => ({ db: { nombre: 'db-test' } }));

import {
  calcularCambiosColeccion,
  guardarCampoUsuario,
  guardarPerfilUsuario,
  normalizarDatosUsuario,
  observarDatosUsuario,
  sincronizarColeccionUsuario,
} from './userDataRepository.js';

describe('normalizarDatosUsuario', () => {
  it('genera una estructura segura para documentos inexistentes', () => {
    expect(normalizarDatosUsuario(null)).toEqual({
      ventas: [],
      ventasLowi: [],
      tarifas: [],
      precios: {},
      objetivosLogros: {},
      agendados: [],
      tema: 'dark',
      versionEsquema: 1,
    });
  });

  it('conserva campos válidos y reemplaza tipos incompatibles', () => {
    const venta = { id: 'venta-1' };
    expect(normalizarDatosUsuario({
      ventas: [venta],
      ventasLowi: 'incorrecto',
      tarifas: null,
      precios: { sap: 10 },
      objetivosLogros: [],
      agendados: [{ id: 'agenda-1' }],
      tema: 'tema-invalido',
    })).toEqual({
      ventas: [venta],
      ventasLowi: [],
      tarifas: [],
      precios: { sap: 10 },
      objetivosLogros: {},
      agendados: [{ id: 'agenda-1' }],
      tema: 'dark',
      versionEsquema: 1,
    });
  });
});

describe('acceso al documento de usuario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.doc.mockImplementation((_db, ...partes) => ({ path: partes.join('/') }));
    mocks.collection.mockImplementation((_db, _usuarios, _uid, ruta) => ({ ruta }));
    mocks.setDoc.mockResolvedValue(undefined);
    mocks.deleteDoc.mockResolvedValue(undefined);
  });

  it('guarda un perfil normalizado con merge', async () => {
    await guardarPerfilUsuario({ uid: 'uid-1', email: 'a@b.test', displayName: null }, 1234);

    expect(mocks.doc).toHaveBeenCalledWith({ nombre: 'db-test' }, 'usuarios', 'uid-1');
    expect(mocks.setDoc).toHaveBeenCalledWith(
      { path: 'usuarios/uid-1' },
      { email: 'a@b.test', nombre: '', foto: '', ultimoAcceso: 1234 },
      { merge: true },
    );
  });

  it('normaliza el snapshot antes de entregarlo al consumidor', () => {
    const unsubscribe = vi.fn();
    const onData = vi.fn();
    const onError = vi.fn();
    mocks.onSnapshot.mockImplementation((_ref, next) => {
      next({ exists: () => true, data: () => ({ ventas: [{ id: 'v1' }] }) });
      return unsubscribe;
    });

    const cancelar = observarDatosUsuario('uid-1', { onData, onError });
    expect(onData).toHaveBeenCalledWith(expect.objectContaining({
      ventas: [{ id: 'v1' }],
      ventasLowi: [],
      tema: 'dark',
    }));
    expect(mocks.onSnapshot.mock.calls[0][2]).toBe(onError);
    cancelar();
    expect(unsubscribe).toHaveBeenCalledOnce();
  });

  it('espera las tres subcolecciones antes de emitir un documento v2', () => {
    const cancelaciones = [];
    const onData = vi.fn();
    mocks.onSnapshot.mockImplementation((ref, next) => {
      const cancelar = vi.fn();
      cancelaciones.push(cancelar);
      if (ref.path) {
        next({ exists: () => true, data: () => ({ versionEsquema: 2, tema: 'light' }) });
      } else {
        const datos = ref.ruta === 'ventasVodafone' ? [{ nombre: 'Ana' }] : [];
        next({
          docs: datos.map((dato, i) => ({ id: `${ref.ruta}-${i}`, data: () => dato })),
        });
      }
      return cancelar;
    });

    const cancelar = observarDatosUsuario('uid-1', { onData, onError: vi.fn() });

    expect(mocks.collection).toHaveBeenCalledTimes(3);
    expect(onData).toHaveBeenCalledOnce();
    expect(onData).toHaveBeenCalledWith(expect.objectContaining({
      versionEsquema: 2,
      tema: 'light',
      ventas: [{ id: 'ventasVodafone-0', nombre: 'Ana' }],
      ventasLowi: [],
      agendados: [],
    }));
    cancelar();
    expect(cancelaciones).toHaveLength(4);
    cancelaciones.forEach((fn) => expect(fn).toHaveBeenCalledOnce());
  });

  it('guarda únicamente campos autorizados', async () => {
    await guardarCampoUsuario('uid-1', 'ventas', [{ id: 'v1' }]);
    expect(mocks.setDoc).toHaveBeenCalledWith(
      { path: 'usuarios/uid-1' },
      { ventas: [{ id: 'v1' }] },
      { merge: true },
    );
    expect(() => guardarCampoUsuario('uid-1', 'rolAdmin', true))
      .toThrow('Campo de usuario no permitido: rolAdmin');
  });

  it('rechaza operaciones sin uid', () => {
    expect(() => guardarCampoUsuario('', 'ventas', [])).toThrow('Se necesita un uid');
  });
});

describe('escrituras del esquema v2', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.doc.mockImplementation((_db, ...partes) => ({ path: partes.join('/') }));
    mocks.setDoc.mockResolvedValue(undefined);
    mocks.deleteDoc.mockResolvedValue(undefined);
  });

  it('clasifica registros creados, actualizados y eliminados', () => {
    expect(calcularCambiosColeccion(
      [{ id: 'igual', valor: 1 }, { id: 'editar', valor: 1 }, { id: 'borrar' }],
      [{ id: 'igual', valor: 1 }, { id: 'editar', valor: 2 }, { id: 'crear' }],
    )).toEqual({
      creados: [{ id: 'crear' }],
      actualizados: [{ id: 'editar', valor: 2 }],
      eliminados: ['borrar'],
    });
  });

  it('escribe y elimina únicamente los documentos que cambiaron', async () => {
    await sincronizarColeccionUsuario(
      'uid-1',
      'ventas',
      [{ id: 'editar', valor: 1 }, { id: 'borrar' }],
      [{ id: 'editar', valor: 2 }, { id: 'crear' }],
    );

    expect(mocks.setDoc).toHaveBeenCalledTimes(2);
    expect(mocks.setDoc).toHaveBeenCalledWith(
      { path: 'usuarios/uid-1/ventasVodafone/crear' },
      { id: 'crear' },
    );
    expect(mocks.setDoc).toHaveBeenCalledWith(
      { path: 'usuarios/uid-1/ventasVodafone/editar' },
      { id: 'editar', valor: 2 },
    );
    expect(mocks.deleteDoc).toHaveBeenCalledWith({ path: 'usuarios/uid-1/ventasVodafone/borrar' });
  });

  it('rechaza colecciones desconocidas, ids vacíos y duplicados', () => {
    expect(() => sincronizarColeccionUsuario('uid-1', 'otra', [], []))
      .toThrow('Colección de usuario no permitida');
    expect(() => calcularCambiosColeccion([], [{}])).toThrow('necesitan un id de texto');
    expect(() => calcularCambiosColeccion([], [{ id: 'ruta/no-valida' }])).toThrow('Id no válido');
    expect(() => calcularCambiosColeccion([], [{ id: 'x' }, { id: 'x' }]))
      .toThrow('Id duplicado');
  });
});

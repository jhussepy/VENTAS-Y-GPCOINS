import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  collection: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => mocks);
vi.mock('../lib/firebase.js', () => ({ db: { nombre: 'db-test' } }));

import {
  calcularCambiosColeccion,
  cargarUsuariosSupervisor,
  guardarCampoUsuario,
  guardarPerfilUsuario,
  migrarUsuarioAV2,
  normalizarDatosUsuario,
  observarDatosUsuario,
  reemplazarDatosUsuario,
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

  it('carga agentes v1 y v2 para el panel de supervisor', async () => {
    mocks.collection.mockImplementation((_db, _usuarios, _uid, ruta) => ({ ruta }));
    mocks.getDocs.mockImplementation((ref) => {
      if (!ref.ruta) {
        return Promise.resolve({ docs: [
          { id: 'legacy', data: () => ({ email: 'legacy@test', ventas: [{ id: 'l1' }] }) },
          { id: 'nuevo', data: () => ({ email: 'nuevo@test', versionEsquema: 2, ventas: [{ id: 'ignorar' }] }) },
        ] });
      }
      const porRuta = {
        ventasVodafone: [{ id: 'v2', data: () => ({ nombre: 'Venta v2' }) }],
        ventasLowi: [],
        agendados: [{ id: 'a2', data: () => ({ nombre: 'Agenda v2' }) }],
      };
      return Promise.resolve({ docs: porRuta[ref.ruta] });
    });

    const usuarios = await cargarUsuariosSupervisor();

    expect(usuarios).toHaveLength(2);
    expect(usuarios[0]).toMatchObject({ uid: 'legacy', ventas: [{ id: 'l1' }] });
    expect(usuarios[1]).toMatchObject({
      uid: 'nuevo',
      ventas: [{ id: 'v2', nombre: 'Venta v2' }],
      ventasLowi: [],
      agendados: [{ id: 'a2', nombre: 'Agenda v2' }],
    });
  });

  it('reemplaza un backup legacy en una sola escritura', async () => {
    await reemplazarDatosUsuario('uid-1', 1, {}, {
      ventas: [{ id: 'v1' }], ventasLowi: [], agendados: [],
      tarifas: [{ id: 't1' }], precios: {}, objetivosLogros: {},
    });

    expect(mocks.setDoc).toHaveBeenCalledOnce();
    expect(mocks.setDoc).toHaveBeenCalledWith(
      { path: 'usuarios/uid-1' },
      expect.objectContaining({ ventas: [{ id: 'v1' }], tarifas: [{ id: 't1' }] }),
      { merge: true },
    );
  });

  it('reemplaza un backup v2 eliminando documentos ausentes', async () => {
    await reemplazarDatosUsuario(
      'uid-1',
      2,
      { ventas: [{ id: 'borrar' }], ventasLowi: [], agendados: [] },
      { ventas: [{ id: 'crear' }], ventasLowi: [], agendados: [], tarifas: [], precios: {}, objetivosLogros: {} },
    );

    expect(mocks.setDoc).toHaveBeenCalledWith(
      { path: 'usuarios/uid-1/ventasVodafone/crear' },
      { id: 'crear' },
    );
    expect(mocks.deleteDoc).toHaveBeenCalledWith({ path: 'usuarios/uid-1/ventasVodafone/borrar' });
  });

  it('valida todo el backup v2 antes de iniciar escrituras', () => {
    expect(() => reemplazarDatosUsuario(
      'uid-1',
      2,
      { ventas: [], ventasLowi: [], agendados: [] },
      { ventas: [{ id: 'valida' }], ventasLowi: [{ id: '' }], agendados: [] },
    )).toThrow('necesitan un id de texto');
    expect(mocks.setDoc).not.toHaveBeenCalled();
    expect(mocks.deleteDoc).not.toHaveBeenCalled();
  });

  it('migra, verifica y solo entonces activa el esquema v2', async () => {
    const rondas = {};
    const progreso = vi.fn();
    mocks.collection.mockImplementation((_db, _usuarios, _uid, ruta) => ({ ruta }));
    mocks.getDocs.mockImplementation((ref) => {
      rondas[ref.ruta] = (rondas[ref.ruta] || 0) + 1;
      const esVerificacion = rondas[ref.ruta] === 2;
      const docs = esVerificacion && ref.ruta === 'ventasVodafone'
        ? [{ id: 'v1', data: () => ({ nombre: 'Ana' }) }]
        : [];
      return Promise.resolve({ docs });
    });

    const resultado = await migrarUsuarioAV2('uid-1', {
      ventas: [{ id: 'v1', nombre: 'Ana' }], ventasLowi: [], agendados: [],
      tarifas: [], precios: {}, objetivosLogros: {},
    }, { ahora: 999, onProgress: progreso });

    expect(resultado).toEqual({
      versionEsquema: 2,
      conteos: { ventas: 1, ventasLowi: 0, agendados: 0 },
    });
    expect(progreso.mock.calls.map(([etapa]) => etapa)).toEqual([
      'respaldo', 'copiando', 'verificando', 'activando', 'completada',
    ]);
    expect(mocks.setDoc).toHaveBeenCalledWith(
      { path: 'usuarios/uid-1' },
      {
        versionEsquema: 2,
        migracionV2: {
          completadaEn: 999,
          conteos: { ventas: 1, ventasLowi: 0, agendados: 0 },
        },
      },
      { merge: true },
    );
  });

  it('no activa v2 cuando la verificación no coincide', async () => {
    mocks.collection.mockImplementation((_db, _usuarios, _uid, ruta) => ({ ruta }));
    mocks.getDocs.mockResolvedValue({ docs: [] });

    await expect(migrarUsuarioAV2('uid-1', {
      ventas: [{ id: 'v1' }], ventasLowi: [], agendados: [],
      tarifas: [], precios: {}, objetivosLogros: {},
    })).rejects.toThrow('no coincide');
    expect(mocks.setDoc.mock.calls.some(([, datos]) => datos.versionEsquema === 2)).toBe(false);
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

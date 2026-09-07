import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  setDoc: vi.fn(),
}));

vi.mock('firebase/firestore', () => mocks);
vi.mock('../lib/firebase.js', () => ({ db: { nombre: 'db-test' } }));

import {
  guardarCampoUsuario,
  guardarPerfilUsuario,
  normalizarDatosUsuario,
  observarDatosUsuario,
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
    });
  });
});

describe('acceso al documento de usuario', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.doc.mockReturnValue({ path: 'usuarios/uid-1' });
    mocks.setDoc.mockResolvedValue(undefined);
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

    expect(observarDatosUsuario('uid-1', { onData, onError })).toBe(unsubscribe);
    expect(onData).toHaveBeenCalledWith(expect.objectContaining({
      ventas: [{ id: 'v1' }],
      ventasLowi: [],
      tema: 'dark',
    }));
    expect(mocks.onSnapshot.mock.calls[0][2]).toBe(onError);
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

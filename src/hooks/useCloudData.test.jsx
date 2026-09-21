// @vitest-environment jsdom
import { act } from 'react';
import { create } from 'react-test-renderer';
import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';
const mock = vi.hoisted(() => ({ observer: null, remote: null, save: vi.fn(), load: vi.fn(), profile: vi.fn() }));
vi.mock('../repositories/userDataRepository.js', async () => {
  const { calcularCambiosColeccion, normalizarDatosUsuario } = await vi.importActual('../repositories/userDataRepository.js');
  return { calcularCambiosColeccion, normalizarDatosUsuario, guardarPerfilUsuario: mock.profile, guardarOperacionUsuario: mock.save, cargarDatosCoherentes: mock.load,
    observarDatosCoherentes: (_uid, callbacks) => { mock.observer = callbacks; return vi.fn(); }, migrarUsuarioAV2: vi.fn() };
});
vi.mock('../lib/firebase.js', () => ({ db: {} }));
import { useCloudData } from './useCloudData.js';
import { aplicarOperacion } from '../lib/mutations.js';
const owner = { uid:'owner', email:'jhussepy08@gmail.com', emailVerified:true };
const empty = () => ({ ventas:[], ventasLowi:[], agendados:[], tarifas:[], precios:{}, objetivosLogros:{}, personal:{}, tema:'dark', versionEsquema:1, revision:0 });
let state, tree;
function Probe({user = owner}) { state = useCloudData(user); return null; }
const tick = () => act(async () => { await Promise.resolve(); });
const mount = async user => { await act(async () => { tree = create(<Probe user={user} />); }); };
const emit = async datos => { await act(async () => mock.observer.onData(datos)); };
beforeEach(() => {
  localStorage.clear(); mock.remote = empty(); mock.observer = null; vi.clearAllMocks();
  Object.defineProperty(navigator, 'locks', { configurable:true, value:{ request: vi.fn((_key, _options, callback) => callback({ name:'lock' })) } });
  mock.profile.mockResolvedValue(); mock.load.mockImplementation(async () => mock.remote);
  mock.save.mockImplementation(async (_uid, op) => { mock.remote = { ...aplicarOperacion(mock.remote, op, true), revision:mock.remote.revision+1 }; });
});
afterEach(async () => { if(tree) { await act(async () => tree.unmount()); tree=null; } });

describe('cola durable y estado global de sincronización', () => {
  it('no lee ni escribe datos para cuentas ajenas o sin verificar', async () => {
    await mount({...owner,email:'otra@gmail.com'});
    expect(mock.profile).not.toHaveBeenCalled(); expect(mock.observer).toBeNull();
  });
  it('envía al guardar, sin ventana de pérdida de 1500 ms', async () => {
    await mount(); await emit(empty());
    await act(async () => state.setVentas([{id:'a'}]));
    expect(mock.save).toHaveBeenCalledOnce(); expect(state.ventas).toEqual([{id:'a'}]); expect(state.estadoGuardado).toBe('guardado');
  });
  it('un snapshot antiguo no elimina cambios locales pendientes', async () => {
    mock.save.mockRejectedValue(new Error('Sin conexión'));
    await mount(); await emit(empty());
    await act(async () => state.setVentas([{id:'a'}]));
    await emit({...empty(), ventas:[{id:'remoto'}]});
    await act(async () => state.setVentas(prev => [...prev,{id:'b'}]));
    expect(state.ventas.map(v=>v.id)).toEqual(['remoto','a','b']);
  });
  it('un fallo bloquea el falso Guardado aunque cambie otra colección', async () => {
    mock.save.mockRejectedValue(new Error('Permiso denegado'));
    await mount(); await emit(empty());
    await act(async () => state.setVentas([{id:'a'}]));
    await act(async () => state.setAgendados([{id:'b'}]));
    expect(state.estadoGuardado).toBe('error'); expect(state.pendientes).toBe(2);
    await expect(state.esperarGuardado()).rejects.toThrow('Permiso');
  });
  it('recupera cambios tras cerrar y reabrir, y los envía una sola vez', async () => {
    mock.save.mockRejectedValue(new Error('Offline'));
    await mount(); await emit(empty()); await act(async () => state.setVentas([{id:'a'}]));
    await act(async () => tree.unmount()); tree=null;
    mock.save.mockImplementation(async (_uid, op) => { mock.remote=aplicarOperacion(mock.remote,op,true); });
    await mount(); await tick();
    expect(state.ventas).toEqual([{id:'a'}]); expect(state.pendientes).toBe(0);
    expect(JSON.parse(localStorage.getItem('gpcoins:outbox:owner')).queue).toHaveLength(0);
  });
  it('rechaza el cambio si no puede protegerlo en almacenamiento local', async () => {
    await mount(); await emit(empty());
    const spy=vi.spyOn(Storage.prototype,'setItem').mockImplementation(()=>{throw new Error('full');});
    expect(()=>state.setVentas([{id:'a'}])).toThrow('espacio local');
    expect(mock.save).not.toHaveBeenCalled(); expect(state.ventas).toEqual([]); spy.mockRestore();
  });
  it('conversión de agenda y venta van en la misma operación', async () => {
    mock.remote={...empty(),agendados:[{id:'agenda',estado:'pendiente'}]};
    await mount(); await emit(mock.remote);
    await act(async () => state.guardarVenta('ventas',{id:'venta'},'agenda'));
    expect(mock.save.mock.calls[0][1].changes).toHaveProperty('ventas');
    expect(mock.save.mock.calls[0][1].changes).toHaveProperty('agendados');
    expect(state.agendados[0].estado).toBe('convertido');
  });
  it('eliminar y recuperar preserva el registro íntegro', async () => {
    mock.remote={...empty(),ventas:[{id:'a',nombre:'Ana'}]}; await mount(); await emit(mock.remote);
    await act(async()=>state.setVentas([]));
    const id=Object.keys(state.personal.papelera)[0]; expect(state.personal.papelera[id].registro.nombre).toBe('Ana');
    await act(async()=>state.restaurarPapelera(id));
    expect(state.ventas).toEqual([{id:'a',nombre:'Ana'}]); expect(state.personal.papelera).toEqual({});
  });
  it('una segunda pestaña no puede sobrescribir la cola', async()=>{
    navigator.locks.request.mockImplementation((_key,_opts,callback)=>callback(null));
    await mount(); expect(state.errorGuardado).toContain('otra pestaña'); expect(mock.observer).toBeNull();
  });
});

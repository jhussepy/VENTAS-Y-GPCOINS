import { useState, useEffect, useRef } from 'react';
import { calcularCambiosColeccion, cargarDatosCoherentes, guardarOperacionUsuario, guardarPerfilUsuario, migrarUsuarioAV2, normalizarDatosUsuario, observarDatosCoherentes } from '../repositories/userDataRepository.js';
import { aplicarOperacion, camposColeccion } from '../lib/mutations.js';
import { esPropietario } from '../lib/admin.js';
import { crearBackup, descargarJSON } from '../lib/backup.js';
import { nuevoId } from '../lib/id.js';
import { crearCierre } from '../lib/personal.js';
import { isoMesCampana } from '../data/campanas.js';

export function useCloudData(user) {
  const uid = esPropietario(user) ? user.uid : null;
  const [datos, setDatos] = useState(() => normalizarDatosUsuario(null));
  const [loading, setLoading] = useState(true);
  const [estadoGuardado, setEstado] = useState('idle');
  const [errorGuardado, setError] = useState('');
  const [pendientes, setPendientes] = useState(0);
  const session = useRef(null);

  useEffect(() => {
    setDatos(normalizarDatosUsuario(null));
    setLoading(!!uid); setEstado('idle'); setError(''); setPendientes(0);
    if (!uid) { session.current = null; return; }
    const key = `gpcoins:outbox:${uid}`;
    const s = { base: normalizarDatosUsuario(null), queue: [], view: null, alive: true, ready: false, writable: false, running: null, revision: -1 };
    session.current = s;
    const fail = error => {
      s.error = error;
      if (s.alive) { setEstado('error'); setError(error.message || 'No se pudo sincronizar.'); setLoading(false); }
    };
    const saveLocal = () => localStorage.setItem(key, JSON.stringify({ base: s.base, queue: s.queue }));
    const publish = () => {
      s.view = s.queue.reduce((base, op) => aplicarOperacion(base, op), s.base);
      if (s.alive) { setDatos(s.view); setPendientes(s.queue.length); }
    };
    const loadLocal = () => {
      const raw = localStorage.getItem(key);
      if (raw) {
        const cache = JSON.parse(raw);
        if (!Array.isArray(cache.queue) || !cache.base) throw new Error('La copia local necesita recuperación. Descárgala antes de continuar.');
        s.base = normalizarDatosUsuario(cache.base); s.queue = cache.queue;
        s.ready = true; publish(); setLoading(false);
      }
    };
    const run = () => {
      if (s.running) return s.running;
      if (!s.writable || !s.ready || !s.alive) return Promise.resolve();
      s.running = (async () => {
        s.error = null;
        if (s.queue.length) { setEstado('guardando'); setError(''); }
        while (s.queue.length && s.alive) {
          const op = s.queue[0];
          await guardarOperacionUsuario(uid, op);
          const base = await cargarDatosCoherentes(uid);
          // Persist the acknowledgement before removing it from the visible queue.
          const queue = s.queue.slice(1);
          localStorage.setItem(key, JSON.stringify({ base, queue }));
          s.base = base; s.revision = base.revision || 0; s.queue = queue;
          publish();
        }
        if (s.alive) setEstado(s.queue.length ? 'guardando' : 'guardado');
      })().catch(fail).finally(() => {
        s.running = null;
        if (s.alive && !s.error && s.queue.length) void run();
      });
      return s.running;
    };
    s.run = run;
    s.enqueue = changes => {
      if (s.exclusive) throw new Error('Espera a que termine la restauración o migración.');
      if (!s.ready || !s.writable) throw new Error('Abre una sola pestaña para editar y espera a que termine la carga.');
      if (s.view.versionEsquema >= 2) {
        const count = Object.entries(changes).filter(([campo]) => camposColeccion.includes(campo)).reduce((n, [, change]) => { const c = calcularCambiosColeccion(change.before, change.after); return n + c.creados.length + c.actualizados.length + c.eliminados.length; }, 0);
        if (count > 400) throw new Error('Esta operación supera 400 cambios. Divídela antes de continuar; no se ha modificado ningún dato.');
      }
      const op = { id: nuevoId(), creado: new Date().toISOString(), changes };
      const nextView = aplicarOperacion(s.view, op);
      const rootData = { ...nextView };
      if (nextView.versionEsquema >= 2) for (const campo of camposColeccion) delete rootData[campo];
      if (new Blob([JSON.stringify(rootData)]).size > 850000) throw new Error('La operación supera el espacio seguro del documento. Descarga una copia y migra el almacenamiento antes de continuar.');
      const queue = [...s.queue, op];
      // If disk is full, reject before pretending the edit succeeded.
      try { localStorage.setItem(key, JSON.stringify({ base: s.base, queue })); }
      catch { const error = new Error('No hay espacio local para proteger el cambio. Descarga una copia antes de continuar.'); fail(error); throw error; }
      s.queue = queue; publish(); setEstado('guardando'); void run();
    };
    s.flush = async () => { await run(); if (s.queue.length || s.error) throw s.error || new Error('Hay cambios pendientes de sincronizar.'); };
    let releaseLock;
    let unsubscribe = () => {};
    const start = async () => {
      try {
        loadLocal();
        guardarPerfilUsuario(user).catch(fail);
        unsubscribe = observarDatosCoherentes(uid, {
          onData: base => {
            if (!s.alive || (base.revision || 0) < s.revision) return;
            s.base = base; s.revision = base.revision || 0; s.ready = true;
            try { saveLocal(); publish(); setLoading(false); if (!s.running) void run(); } catch (error) { fail(error); }
          }, onError: fail,
        });
        if (s.ready) void run();
      } catch (error) { fail(error); }
    };
    // A single editor per browser prevents two tabs replacing the same outbox.
    if (navigator.locks?.request) {
      navigator.locks.request(`gpcoins-editor:${uid}`, { ifAvailable: true }, async lock => {
        if (!s.alive) return;
        if (!lock) { fail(new Error('GP COINS ya está abierto en otra pestaña. Ciérrala y recarga esta para editar.')); return; }
        s.writable = true;
        const held = new Promise(resolve => { releaseLock = resolve; });
        await start();
        await held;
      }).catch(fail);
    } else {
      fail(new Error('Este navegador no permite proteger el guardado entre pestañas. Usa un navegador actualizado con HTTPS.'));
    }
    const online = () => { if (s.ready) void run(); else if (s.writable) void start(); };
    const beforeUnload = e => { if (s.queue.length) { e.preventDefault(); e.returnValue = ''; } };
    window.addEventListener('online', online);
    window.addEventListener('beforeunload', beforeUnload);
    return () => {
      s.alive = false; unsubscribe();
      Promise.resolve(s.running).finally(() => releaseLock?.());
      window.removeEventListener('online', online); window.removeEventListener('beforeunload', beforeUnload);
      // The durable queue remains available after closing or signing out.
    };
  }, [uid]);

  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(datos.tema);
    try { localStorage.setItem('vf_tema', JSON.stringify(datos.tema)); } catch { /* theme is cosmetic */ }
  }, [datos.tema]);

  const actualizar = (campo, fn) => {
    const s = session.current;
    if (!s?.view) throw new Error('Espera a que carguen los datos.');
    const before = s.view[campo];
    const after = typeof fn === 'function' ? fn(before) : fn;
    const changes = { [campo]: { before, after } };
    if (camposColeccion.includes(campo)) {
      const ids = new Set(after.map(v => v.id));
      const borrados = before.filter(v => !ids.has(v.id));
      if (borrados.length) {
        const personal = s.view.personal;
        const papelera = { ...(personal.papelera || {}) };
        for (const registro of borrados) papelera[nuevoId()] = { campo, registro, eliminadoEn: new Date().toISOString() };
        changes.personal = { before: personal, after: { ...personal, papelera } };
      }
    }
    s.enqueue(changes);
  };
  const guardarVenta = (campo, venta, agendaId) => {
    const s = session.current;
    const before = s.view[campo];
    const after = before.some(v => v.id === venta.id) ? before.map(v => v.id === venta.id ? venta : v) : [venta, ...before];
    const changes = { [campo]: { before, after } };
    if (agendaId) changes.agendados = { before: s.view.agendados, after: s.view.agendados.map(a => a.id === agendaId ? { ...a, estado: 'convertido', ventaId: venta.id } : a) };
    s.enqueue(changes);
  };
  const restaurarDatos = async nuevos => {
    const s = session.current;
    await s.flush();
    localStorage.setItem(`gpcoins:recuperacion:${uid}`, JSON.stringify(crearBackup(s.view)));
    const changes = Object.fromEntries(['ventas', 'ventasLowi', 'agendados', 'tarifas', 'precios', 'objetivosLogros', 'personal', 'tema'].map(campo => [campo, { before: s.view[campo], after: nuevos[campo] ?? s.view[campo] }]));
    s.enqueue(changes); s.exclusive = true;
    try { await s.flush(); } finally { s.exclusive = false; }
  };
  const migrarEsquemaV2 = async onProgress => {
    const s = session.current; await s.flush(); s.exclusive = true;
    try {
      localStorage.setItem(`gpcoins:recuperacion:${uid}`, JSON.stringify(crearBackup(s.view)));
      const result = await migrarUsuarioAV2(uid, s.view, { onProgress });
      s.base = await cargarDatosCoherentes(uid); s.view = s.base; setDatos(s.base); return result;
    } finally { s.exclusive = false; }
  };
  return { ...datos, loading, estadoGuardado, errorGuardado, pendientes, versionDatos: datos.versionEsquema,
    setVentas: fn => actualizar('ventas', fn), setVentasLowi: fn => actualizar('ventasLowi', fn), setAgendados: fn => actualizar('agendados', fn),
    setTarifas: fn => actualizar('tarifas', fn), setPrecios: fn => actualizar('precios', fn), setObjetivosLogros: fn => actualizar('objetivosLogros', fn),
    setPersonal: fn => actualizar('personal', fn), setTema: fn => actualizar('tema', fn), guardarVenta,
    guardarPrecio: (sap, mes, valor) => actualizar('precios', prev => ({ ...prev, [sap]: { ...prev[sap], [mes]: Number(valor) || 0 } })),
    guardarObjetivoLogro: (id, valor) => actualizar('objetivosLogros', prev => { const next = { ...prev }; if (valor > 0) next[id] = valor; else delete next[id]; return next; }),
    cerrarMes: async mes => {
      const s = session.current; await s.flush();
      const periodo = isoMesCampana(mes);
      if (s.view.personal.cierres?.[periodo]) throw new Error('Este mes ya está cerrado.');
      actualizar('personal', p => ({ ...p, cierres: { ...p.cierres, [periodo]: crearCierre(s.view.ventas, mes) } }));
      await s.flush();
    },
    recuperarDesdeNube: async () => {
      const s = session.current;
      if (!s?.writable) throw new Error('Esta pestaña no tiene el permiso de edición.');
      s.exclusive = true;
      try {
        await s.running;
        const base = await cargarDatosCoherentes(uid);
        localStorage.setItem(`gpcoins:pendientes-archivados:${uid}`, JSON.stringify({ base: s.base, queue: s.queue, datos: s.view }));
        localStorage.setItem(`gpcoins:outbox:${uid}`, JSON.stringify({ base, queue: [] }));
        s.base = base; s.view = base; s.queue = []; s.error = null; s.revision = base.revision || 0;
        setDatos(base); setPendientes(0); setError(''); setEstado('guardado');
      } finally { s.exclusive = false; }
    },
    restaurarPapelera: id => {
      const s = session.current; const personal = s.view.personal; const item = personal.papelera?.[id];
      if (!item) return;
      if (s.view[item.campo].some(v => v.id === item.registro.id)) throw new Error('Ya existe un registro con ese ID. No se sobrescribirá.');
      const papelera = { ...personal.papelera }; delete papelera[id];
      s.enqueue({ [item.campo]: { before: s.view[item.campo], after: [item.registro, ...s.view[item.campo]] }, personal: { before: personal, after: { ...personal, papelera } } });
    },
    restaurarDatos, migrarEsquemaV2, reintentarGuardado: () => session.current?.run(), esperarGuardado: () => session.current?.flush(),
    descargarPendientes: () => descargarJSON({ ...crearBackup(session.current?.view || datos), pendientes: session.current?.queue || [], copiaLocal: localStorage.getItem(`gpcoins:outbox:${uid}`) }, 'gpcoins-recuperacion-pendientes.json'),
  };
}

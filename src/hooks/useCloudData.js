import { useState, useEffect, useRef } from 'react';
import { guardarCampoUsuario, guardarPerfilUsuario, observarDatosUsuario, reemplazarDatosUsuario, sincronizarColeccionUsuario } from '../repositories/userDataRepository.js';

const DEBOUNCE_MS = 1500;

export function useCloudData(user) {
  const uid = user?.uid;
  const [ventas, setVentasState] = useState([]);
  const [ventasLowi, setVentasLowiState] = useState([]);
  const [tarifas, setTarifasState] = useState([]);
  const [precios, setPreciosState] = useState({}); // { [sap]: { junio, julio } }
  const [objetivosLogros, setObjetivosLogrosState] = useState({}); // { [idLogro]: objetivoPersonalizado }
  const [agendados, setAgendadosState] = useState([]); // clientes que piden que se les llame otro día/hora
  const [tema, setTemaState] = useState('dark');
  const [loading, setLoading] = useState(true);
  const [estadoGuardado, setEstadoGuardado] = useState('idle'); // idle | guardando | guardado | error
  const timers = useRef({});
  const versionEsquema = useRef(1);
  const colecciones = useRef({ ventas: [], ventasLowi: [], agendados: [] });
  const colasEscritura = useRef({});
  const uidActual = useRef(uid);

  useEffect(() => {
    uidActual.current = uid;
    if (!uid) { setLoading(false); return; }
    // Al cambiar de usuario: reinicia el estado para no mostrar datos del anterior
    setLoading(true);
    setEstadoGuardado('idle');
    versionEsquema.current = 1;
    colecciones.current = { ventas: [], ventasLowi: [], agendados: [] };
    colasEscritura.current = {};
    setVentasState([]);
    setVentasLowiState([]);
    setTarifasState([]);
    setPreciosState({});
    setObjetivosLogrosState({});
    setAgendadosState([]);
    // Guarda/actualiza el perfil para que el admin pueda identificar al agente
    guardarPerfilUsuario(user).catch((e) => console.error('No se pudo guardar el perfil:', e));
    const unsub = observarDatosUsuario(uid, {
      onData: (d) => {
        versionEsquema.current = d.versionEsquema;
        colecciones.current = { ventas: d.ventas, ventasLowi: d.ventasLowi, agendados: d.agendados };
        setVentasState(d.ventas);
        setVentasLowiState(d.ventasLowi);
        setTarifasState(d.tarifas);
        setPreciosState(d.precios);
        setObjetivosLogrosState(d.objetivosLogros);
        setAgendadosState(d.agendados);
        setTemaState(d.tema);
        try { localStorage.setItem('vf_tema', JSON.stringify(d.tema)); } catch { /* ignore */ }
        if (d.tema) {
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(d.tema);
        }
        setLoading(false);
      },
      onError: (e) => {
        console.error('No se pudieron cargar los datos de la nube:', e);
        setEstadoGuardado('error');
        setLoading(false);
      },
    });
    // Cleanup: cancela el listener y los timers de guardado pendientes del usuario saliente
    const timersRef = timers.current;
    return () => {
      unsub();
      Object.values(timersRef).forEach(clearTimeout);
    };
  }, [uid]);

  const persist = (field, value) => {
    clearTimeout(timers.current[field]);
    setEstadoGuardado('guardando');
    timers.current[field] = setTimeout(() => {
      guardarCampoUsuario(uid, field, value)
        .then(() => {
          setEstadoGuardado('guardado');
          // Tras 2s volvemos a reposo (registrado para poder limpiarlo en el cleanup)
          clearTimeout(timers.current._idle);
          timers.current._idle = setTimeout(() => setEstadoGuardado('idle'), 2000);
        })
        .catch((e) => { console.error('Error al guardar en la nube:', e); setEstadoGuardado('error'); });
    }, DEBOUNCE_MS);
  };

  const persistColeccion = (field, prev, next) => {
    if (versionEsquema.current < 2) {
      persist(field, next);
      return;
    }
    setEstadoGuardado('guardando');
    try {
      const tarea = (colasEscritura.current[field] || Promise.resolve())
        .catch(() => {})
        .then(() => sincronizarColeccionUsuario(uid, field, prev, next));
      colasEscritura.current[field] = tarea;
      tarea
        .then(() => {
          if (uidActual.current !== uid) return;
          setEstadoGuardado('guardado');
          clearTimeout(timers.current._idle);
          timers.current._idle = setTimeout(() => setEstadoGuardado('idle'), 2000);
        })
        .catch((e) => {
          console.error('Error al guardar la colección:', e);
          if (uidActual.current === uid) setEstadoGuardado('error');
        });
    } catch (e) {
      console.error('Error al preparar la colección:', e);
      setEstadoGuardado('error');
    }
  };

  const actualizarColeccion = (field, setState, fn) => {
    const prev = colecciones.current[field];
    const next = typeof fn === 'function' ? fn(prev) : fn;
    colecciones.current = { ...colecciones.current, [field]: next };
    setState(next);
    if (uid) persistColeccion(field, prev, next);
  };

  const setVentas = (fn) => actualizarColeccion('ventas', setVentasState, fn);

  const setVentasLowi = (fn) => actualizarColeccion('ventasLowi', setVentasLowiState, fn);

  const setTarifas = (fn) => {
    setTarifasState((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      if (uid) persist('tarifas', next);
      return next;
    });
  };

  // Reemplaza todo el objeto de precios (usado al restaurar copia de seguridad)
  const setPrecios = (obj) => {
    const next = obj && typeof obj === 'object' ? obj : {};
    setPreciosState(next);
    if (uid) persist('precios', next);
  };

  // Guarda el precio de un terminal por SAP y mes: precios[sap][mes] = valor
  const guardarPrecio = (sap, mes, valor) => {
    setPreciosState((prev) => {
      const next = { ...prev, [sap]: { ...(prev[sap] || {}), [mes]: Number(valor) || 0 } };
      if (uid) persist('precios', next);
      return next;
    });
  };

  // Reemplaza todos los objetivos personalizados de insignias (usado al restaurar copia de seguridad)
  const setObjetivosLogros = (obj) => {
    const next = obj && typeof obj === 'object' ? obj : {};
    setObjetivosLogrosState(next);
    if (uid) persist('objetivosLogros', next);
  };

  // Guarda/borra el objetivo personalizado de una sola insignia
  const guardarObjetivoLogro = (id, valor) => {
    setObjetivosLogrosState((prev) => {
      const next = { ...prev };
      if (valor > 0) next[id] = valor; else delete next[id];
      if (uid) persist('objetivosLogros', next);
      return next;
    });
  };

  const setAgendados = (fn) => actualizarColeccion('agendados', setAgendadosState, fn);

  const restaurarDatos = async (datos) => {
    Object.values(timers.current).forEach(clearTimeout);
    setEstadoGuardado('guardando');
    const version = versionEsquema.current;
    const actuales = colecciones.current;
    const pendientes = Object.values(colasEscritura.current).map((tarea) => tarea.catch(() => {}));
    const tarea = Promise.all(pendientes)
      .then(() => reemplazarDatosUsuario(uid, version, actuales, datos));
    if (version >= 2) {
      Object.keys(colecciones.current).forEach((campo) => { colasEscritura.current[campo] = tarea; });
    }
    try {
      await tarea;
      if (uidActual.current !== uid) return;
      colecciones.current = {
        ventas: datos.ventas,
        ventasLowi: datos.ventasLowi,
        agendados: datos.agendados,
      };
      setVentasState(datos.ventas);
      setVentasLowiState(datos.ventasLowi);
      setAgendadosState(datos.agendados);
      setTarifasState(datos.tarifas);
      setPreciosState(datos.precios);
      setObjetivosLogrosState(datos.objetivosLogros);
      setEstadoGuardado('guardado');
    } catch (e) {
      console.error('No se pudo restaurar la copia:', e);
      if (uidActual.current === uid) setEstadoGuardado('error');
      throw e;
    }
  };

  const setTema = (t) => {
    setTemaState(t);
    // Persistimos también en localStorage para el anti-parpadeo de index.html
    try { localStorage.setItem('vf_tema', JSON.stringify(t)); } catch { /* ignore */ }
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(t);
    if (uid) persist('tema', t);
  };

  return { ventas, setVentas, ventasLowi, setVentasLowi, tarifas, setTarifas, precios, guardarPrecio, setPrecios, objetivosLogros, guardarObjetivoLogro, setObjetivosLogros, agendados, setAgendados, restaurarDatos, tema, setTema, loading, estadoGuardado };
}

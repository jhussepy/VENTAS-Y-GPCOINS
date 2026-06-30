import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

const DEBOUNCE_MS = 1500;

export function useCloudData(user) {
  const uid = user?.uid;
  const [ventas, setVentasState] = useState([]);
  const [ventasLowi, setVentasLowiState] = useState([]);
  const [tarifas, setTarifasState] = useState([]);
  const [precios, setPreciosState] = useState({}); // { [sap]: { junio, julio } }
  const [tema, setTemaState] = useState('dark');
  const [loading, setLoading] = useState(true);
  const [estadoGuardado, setEstadoGuardado] = useState('idle'); // idle | guardando | guardado | error
  const timers = useRef({});

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    // Al cambiar de usuario: reinicia el estado para no mostrar datos del anterior
    setLoading(true);
    setVentasState([]);
    setVentasLowiState([]);
    setTarifasState([]);
    setPreciosState({});
    const ref = doc(db, 'usuarios', uid);
    // Guarda/actualiza el perfil para que el admin pueda identificar al agente
    setDoc(ref, {
      email: user.email || '',
      nombre: user.displayName || '',
      foto: user.photoURL || '',
      ultimoAcceso: Date.now(),
    }, { merge: true }).catch((e) => console.error('No se pudo guardar el perfil:', e));
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (Array.isArray(d.ventas)) setVentasState(d.ventas);
        if (Array.isArray(d.ventasLowi)) setVentasLowiState(d.ventasLowi);
        if (Array.isArray(d.tarifas)) setTarifasState(d.tarifas);
        if (d.precios && typeof d.precios === 'object') setPreciosState(d.precios);
        if (d.tema) {
          setTemaState(d.tema);
          try { localStorage.setItem('vf_tema', JSON.stringify(d.tema)); } catch { /* ignore */ }
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(d.tema);
        }
      }
      setLoading(false);
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
      setDoc(doc(db, 'usuarios', uid), { [field]: value }, { merge: true })
        .then(() => {
          setEstadoGuardado('guardado');
          // Tras 2s volvemos a estado de reposo
          setTimeout(() => setEstadoGuardado('idle'), 2000);
        })
        .catch((e) => { console.error('Error al guardar en la nube:', e); setEstadoGuardado('error'); });
    }, DEBOUNCE_MS);
  };

  const setVentas = (fn) => {
    setVentasState((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      if (uid) persist('ventas', next);
      return next;
    });
  };

  const setVentasLowi = (fn) => {
    setVentasLowiState((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      if (uid) persist('ventasLowi', next);
      return next;
    });
  };

  const setTarifas = (fn) => {
    setTarifasState((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      if (uid) persist('tarifas', next);
      return next;
    });
  };

  // Guarda el precio de un terminal por SAP y mes: precios[sap][mes] = valor
  const guardarPrecio = (sap, mes, valor) => {
    setPreciosState((prev) => {
      const next = { ...prev, [sap]: { ...(prev[sap] || {}), [mes]: Number(valor) || 0 } };
      if (uid) persist('precios', next);
      return next;
    });
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

  return { ventas, setVentas, ventasLowi, setVentasLowi, tarifas, setTarifas, precios, guardarPrecio, tema, setTema, loading, estadoGuardado };
}

import { useState, useEffect, useRef } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

const DEBOUNCE_MS = 1500;

export function useCloudData(uid) {
  const [ventas, setVentasState] = useState([]);
  const [tarifas, setTarifasState] = useState([]);
  const [tema, setTemaState] = useState('dark');
  const [loading, setLoading] = useState(true);
  const timers = useRef({});

  useEffect(() => {
    if (!uid) { setLoading(false); return; }
    const ref = doc(db, 'usuarios', uid);
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (Array.isArray(d.ventas)) setVentasState(d.ventas);
        if (Array.isArray(d.tarifas)) setTarifasState(d.tarifas);
        if (d.tema) {
          setTemaState(d.tema);
          const root = document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add(d.tema);
        }
      }
      setLoading(false);
    });
    return unsub;
  }, [uid]);

  const persist = (field, value) => {
    clearTimeout(timers.current[field]);
    timers.current[field] = setTimeout(() => {
      setDoc(doc(db, 'usuarios', uid), { [field]: value }, { merge: true });
    }, DEBOUNCE_MS);
  };

  const setVentas = (fn) => {
    setVentasState((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : fn;
      if (uid) persist('ventas', next);
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

  const setTema = (t) => {
    setTemaState(t);
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(t);
    if (uid) persist('tema', t);
  };

  return { ventas, setVentas, tarifas, setTarifas, tema, setTema, loading };
}

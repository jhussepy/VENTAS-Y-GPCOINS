import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export const CAMPOS_PERSISTIBLES = new Set([
  'ventas', 'ventasLowi', 'tarifas', 'precios', 'objetivosLogros', 'agendados', 'tema',
]);

const objetoPlano = (valor) => (
  valor && typeof valor === 'object' && !Array.isArray(valor) ? valor : {}
);

// Frontera de normalización para documentos antiguos, incompletos o
// manipulados. El hook siempre recibe la misma estructura segura.
export function normalizarDatosUsuario(datos) {
  const d = objetoPlano(datos);
  return {
    ventas: Array.isArray(d.ventas) ? d.ventas : [],
    ventasLowi: Array.isArray(d.ventasLowi) ? d.ventasLowi : [],
    tarifas: Array.isArray(d.tarifas) ? d.tarifas : [],
    precios: objetoPlano(d.precios),
    objetivosLogros: objetoPlano(d.objetivosLogros),
    agendados: Array.isArray(d.agendados) ? d.agendados : [],
    tema: d.tema === 'light' || d.tema === 'dark' ? d.tema : 'dark',
  };
}

const referenciaUsuario = (uid) => {
  if (!uid) throw new Error('Se necesita un uid para acceder a los datos del usuario.');
  return doc(db, 'usuarios', uid);
};

export function guardarPerfilUsuario(user, ahora = Date.now()) {
  return setDoc(referenciaUsuario(user?.uid), {
    email: user.email || '',
    nombre: user.displayName || '',
    foto: user.photoURL || '',
    ultimoAcceso: ahora,
  }, { merge: true });
}

export function observarDatosUsuario(uid, { onData, onError }) {
  return onSnapshot(
    referenciaUsuario(uid),
    (snapshot) => onData(normalizarDatosUsuario(snapshot.exists() ? snapshot.data() : null)),
    onError,
  );
}

export function guardarCampoUsuario(uid, campo, valor) {
  if (!CAMPOS_PERSISTIBLES.has(campo)) {
    throw new Error(`Campo de usuario no permitido: ${campo}`);
  }
  return setDoc(referenciaUsuario(uid), { [campo]: valor }, { merge: true });
}

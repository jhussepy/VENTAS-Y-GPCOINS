import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export const CAMPOS_PERSISTIBLES = new Set([
  'ventas', 'ventasLowi', 'tarifas', 'precios', 'objetivosLogros', 'agendados', 'tema',
]);

export const COLECCIONES_V2 = {
  ventas: 'ventasVodafone',
  ventasLowi: 'ventasLowi',
  agendados: 'agendados',
};

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
    versionEsquema: Number(d.versionEsquema) >= 2 ? 2 : 1,
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
  let cancelarColecciones = [];
  let versionObservada = 1;
  let datosDocumento = normalizarDatosUsuario(null);
  let datosColecciones = null;

  const detenerColecciones = () => {
    cancelarColecciones.forEach((cancelar) => cancelar());
    cancelarColecciones = [];
    datosColecciones = null;
  };

  const emitirColecciones = () => {
    if (!datosColecciones || Object.values(datosColecciones).some((valor) => valor === null)) return;
    onData({ ...datosDocumento, ...datosColecciones });
  };

  const iniciarColecciones = () => {
    detenerColecciones();
    datosColecciones = { ventas: null, ventasLowi: null, agendados: null };
    cancelarColecciones = Object.entries(COLECCIONES_V2).map(([campo, ruta]) => onSnapshot(
      collection(db, 'usuarios', uid, ruta),
      (snapshot) => {
        datosColecciones[campo] = snapshot.docs.map((item) => {
          const datos = item.data();
          return { ...datos, id: item.id };
        });
        emitirColecciones();
      },
      onError,
    ));
  };

  const cancelarDocumento = onSnapshot(
    referenciaUsuario(uid),
    (snapshot) => {
      datosDocumento = normalizarDatosUsuario(snapshot.exists() ? snapshot.data() : null);
      if (datosDocumento.versionEsquema >= 2) {
        if (versionObservada < 2) {
          versionObservada = 2;
          iniciarColecciones();
        } else {
          emitirColecciones();
        }
      } else {
        versionObservada = 1;
        detenerColecciones();
        onData(datosDocumento);
      }
    },
    onError,
  );

  return () => {
    cancelarDocumento();
    detenerColecciones();
  };
}

export function guardarCampoUsuario(uid, campo, valor) {
  if (!CAMPOS_PERSISTIBLES.has(campo)) {
    throw new Error(`Campo de usuario no permitido: ${campo}`);
  }
  return setDoc(referenciaUsuario(uid), { [campo]: valor }, { merge: true });
}

const mapaPorId = (registros, etiqueta) => {
  if (!Array.isArray(registros)) throw new Error(`${etiqueta} debe ser un array.`);
  const mapa = new Map();
  registros.forEach((registro) => {
    const id = registro?.id;
    if (typeof id !== 'string' || !id.trim()) {
      throw new Error(`Todos los registros de ${etiqueta} necesitan un id de texto.`);
    }
    if (id.includes('/')) throw new Error(`Id no válido en ${etiqueta}: ${id}`);
    if (mapa.has(id)) throw new Error(`Id duplicado en ${etiqueta}: ${id}`);
    mapa.set(id, registro);
  });
  return mapa;
};

export function calcularCambiosColeccion(anteriores, siguientes) {
  const antes = mapaPorId(anteriores, 'anteriores');
  const despues = mapaPorId(siguientes, 'siguientes');
  const creados = [];
  const actualizados = [];
  const eliminados = [];

  despues.forEach((registro, id) => {
    if (!antes.has(id)) creados.push(registro);
    else if (JSON.stringify(antes.get(id)) !== JSON.stringify(registro)) actualizados.push(registro);
  });
  antes.forEach((_registro, id) => {
    if (!despues.has(id)) eliminados.push(id);
  });
  return { creados, actualizados, eliminados };
}

export function sincronizarColeccionUsuario(uid, campo, anteriores, siguientes) {
  const ruta = COLECCIONES_V2[campo];
  if (!ruta) throw new Error(`Colección de usuario no permitida: ${campo}`);
  if (!uid) throw new Error('Se necesita un uid para sincronizar datos del usuario.');
  const cambios = calcularCambiosColeccion(anteriores, siguientes);
  const referencia = (id) => doc(db, 'usuarios', uid, ruta, id);
  const escrituras = [
    ...cambios.creados.map((registro) => setDoc(referencia(registro.id), registro)),
    ...cambios.actualizados.map((registro) => setDoc(referencia(registro.id), registro)),
    ...cambios.eliminados.map((id) => deleteDoc(referencia(id))),
  ];
  return Promise.all(escrituras);
}

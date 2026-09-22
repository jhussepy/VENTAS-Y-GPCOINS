import { fusionar, fusionarRegistros } from '../lib/mutations.js';
import { collection, deleteDoc, doc, getDocs, getDocFromServer, getDocsFromServer, onSnapshot, setDoc, runTransaction, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export const CAMPOS_PERSISTIBLES = new Set([
  'ventas', 'ventasLowi', 'tarifas', 'precios', 'objetivosLogros', 'agendados', 'tema', 'personal',
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
    personal: objetoPlano(d.personal),
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

const registrosDeSnapshot = (snapshot) => snapshot.docs.map((item) => ({
  ...item.data(),
  id: item.id,
}));

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
        datosColecciones[campo] = registrosDeSnapshot(snapshot);
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
  return setDoc(referenciaUsuario(uid), { [campo]: valor }, { mergeFields: [campo] });
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

const aplicarCambiosColeccion = (uid, ruta, cambios) => {
  const referencia = (id) => doc(db, 'usuarios', uid, ruta, id);
  const escrituras = [
    ...cambios.creados.map((registro) => setDoc(referencia(registro.id), registro)),
    ...cambios.actualizados.map((registro) => setDoc(referencia(registro.id), registro)),
    ...cambios.eliminados.map((id) => deleteDoc(referencia(id))),
  ];
  return Promise.all(escrituras);
};

export function sincronizarColeccionUsuario(uid, campo, anteriores, siguientes) {
  const ruta = COLECCIONES_V2[campo];
  if (!ruta) throw new Error(`Colección de usuario no permitida: ${campo}`);
  if (!uid) throw new Error('Se necesita un uid para sincronizar datos del usuario.');
  const cambios = calcularCambiosColeccion(anteriores, siguientes);
  return aplicarCambiosColeccion(uid, ruta, cambios);
}

export async function cargarUsuariosSupervisor() {
  const snapshot = await getDocs(collection(db, 'usuarios'));
  return Promise.all(snapshot.docs.map(async (item) => {
    const raw = item.data();
    const datos = normalizarDatosUsuario(raw);
    if (datos.versionEsquema >= 2) {
      const entradas = await Promise.all(Object.entries(COLECCIONES_V2).map(async ([campo, ruta]) => {
        const snap = await getDocs(collection(db, 'usuarios', item.id, ruta));
        return [campo, registrosDeSnapshot(snap)];
      }));
      Object.assign(datos, Object.fromEntries(entradas));
    }
    return {
      ...datos,
      uid: item.id,
      email: raw.email || '(sin email)',
      nombre: raw.nombre || '',
      foto: raw.foto || '',
      ultimoAcceso: raw.ultimoAcceso || 0,
    };
  }));
}

export function reemplazarDatosUsuario(uid, versionEsquema, actuales, siguientes) {
  const configuracion = {
    tarifas: Array.isArray(siguientes.tarifas) ? siguientes.tarifas : [],
    precios: objetoPlano(siguientes.precios),
    objetivosLogros: objetoPlano(siguientes.objetivosLogros),
  };
  if (versionEsquema < 2) {
    return setDoc(referenciaUsuario(uid), {
      ...configuracion,
      ventas: Array.isArray(siguientes.ventas) ? siguientes.ventas : [],
      ventasLowi: Array.isArray(siguientes.ventasLowi) ? siguientes.ventasLowi : [],
      agendados: Array.isArray(siguientes.agendados) ? siguientes.agendados : [],
    }, { merge: true });
  }
  // Calculamos y validamos todas las diferencias antes de iniciar la primera
  // escritura, evitando una restauración parcial por IDs inválidos/duplicados.
  const cambios = Object.entries(COLECCIONES_V2).map(([campo, ruta]) => ({
    ruta,
    cambios: calcularCambiosColeccion(
      actuales[campo] || [],
      Array.isArray(siguientes[campo]) ? siguientes[campo] : [],
    ),
  }));
  const cantidad = cambios.reduce((n, { cambios: c }) => n + c.creados.length + c.actualizados.length + c.eliminados.length, 1);
  if (cantidad > 400) throw new Error('La restauración supera 400 cambios. No se ha modificado ningún dato.');
  const batch = writeBatch(db);
  batch.set(referenciaUsuario(uid), configuracion, { mergeFields: Object.keys(configuracion) });
  for (const { ruta, cambios: c } of cambios) {
    for (const registro of [...c.creados, ...c.actualizados]) batch.set(doc(db, 'usuarios', uid, ruta, registro.id), registro);
    for (const id of c.eliminados) batch.delete(doc(db, 'usuarios', uid, ruta, id));
  }
  return batch.commit();
}

const canonical = value => Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])])) : value;
const idsOrdenados = registros => registros.map(registro => JSON.stringify(canonical(registro))).sort();

export async function migrarUsuarioAV2(uid, datos, { ahora = Date.now(), onProgress = () => {} } = {}) {
  if (!uid) throw new Error('Se necesita un uid para migrar los datos del usuario.');
  const campos = Object.keys(COLECCIONES_V2);
  for (const campo of campos) calcularCambiosColeccion([], datos[campo] || []);
  onProgress('verificando');
  const actuales = await cargarDatosCoherentes(uid);
  if (actuales.versionEsquema >= 2) return { versionEsquema: 2, yaMigrado: true };
  for (const campo of campos) {
    if (JSON.stringify(idsOrdenados(datos[campo] || [])) !== JSON.stringify(idsOrdenados(actuales[campo]))) throw new Error(`La verificación de ${campo} no coincide. Sincroniza antes de migrar.`);
  }
  const existentes = await Promise.all(Object.entries(COLECCIONES_V2).map(async ([campo, ruta]) => {
    const snap = await getDocsFromServer(collection(db, 'usuarios', uid, ruta));
    return { campo, ruta, ids: snap.docs.map(d => d.id) };
  }));
  const conteos = Object.fromEntries(campos.map(campo => [campo, actuales[campo].length]));
  const cambios = existentes.map(({ campo, ruta, ids }) => ({ campo, ruta, borrar: ids.filter(id => !actuales[campo].some(v => v.id === id)) }));
  if (1 + cambios.reduce((n, c) => n + c.borrar.length + actuales[c.campo].length, 0) > 400) throw new Error('Migración de más de 399 registros: requiere un proceso por lotes específico. No se han modificado datos.');
  onProgress('copiando');
  await runTransaction(db, async transaction => {
    const ref = referenciaUsuario(uid);
    const root = await transaction.get(ref);
    const raw = root.exists() ? root.data() : {};
    if ((raw.revision || 0) !== actuales.revision || Number(raw.versionEsquema) >= 2) throw new Error('Otra sesión modificó los datos. Reintenta la migración.');
    for (const campo of campos) {
      if (JSON.stringify(idsOrdenados(raw[campo] || [])) !== JSON.stringify(idsOrdenados(actuales[campo]))) throw new Error('Los datos cambiaron antes de migrar.');
    }
    for (const { campo, ruta, borrar } of cambios) {
      for (const registro of actuales[campo]) transaction.set(doc(db, 'usuarios', uid, ruta, registro.id), registro);
      for (const id of borrar) transaction.delete(doc(db, 'usuarios', uid, ruta, id));
    }
    const next = { ...raw, revision: actuales.revision + 1, versionEsquema: 2, migracionV2: { completadaEn: ahora, conteos } };
    for (const campo of campos) delete next[campo];
    transaction.set(ref, next);
  });
  onProgress('completada');
  return { versionEsquema: 2, conteos };
}

// The root revision is advanced in the same transaction as every record change.
// Loading between two equal revisions avoids mixing collection snapshots.
export async function cargarDatosCoherentes(uid) {
  for (let intento = 0; intento < 5; intento += 1) {
    const inicio = await getDocFromServer(referenciaUsuario(uid));
    const raw = inicio.exists() ? inicio.data() : {};
    const datos = normalizarDatosUsuario(raw);
    if (datos.versionEsquema >= 2) {
      const entradas = await Promise.all(Object.entries(COLECCIONES_V2).map(async ([campo, ruta]) => {
        const snapshot = await getDocsFromServer(collection(db, 'usuarios', uid, ruta));
        return [campo, registrosDeSnapshot(snapshot)];
      }));
      Object.assign(datos, Object.fromEntries(entradas));
      const fin = await getDocFromServer(referenciaUsuario(uid));
      if ((fin.data()?.revision || 0) !== (raw.revision || 0)) continue;
    }
    return { ...datos, revision: raw.revision || 0 };
  }
  throw new Error('Los datos están cambiando en otra sesión. Vuelve a intentar la sincronización.');
}

export function observarDatosCoherentes(uid, { onData, onError }) {
  let generation = 0;
  const unsubscribe = onSnapshot(referenciaUsuario(uid), snapshot => {
    if (snapshot.metadata?.hasPendingWrites) return;
    const request = ++generation;
    cargarDatosCoherentes(uid).then(datos => { if (request === generation) onData(datos); })
      .catch(error => { if (request === generation) onError(error); });
  }, onError);
  return () => { generation += 1; unsubscribe(); };
}

export async function guardarOperacionUsuario(uid, operacion) {
  const campos = Object.keys(operacion.changes);
  for (const campo of campos) {
    if (!CAMPOS_PERSISTIBLES.has(campo)) throw new Error(`Campo no permitido: ${campo}`);
    if (COLECCIONES_V2[campo]) calcularCambiosColeccion(operacion.changes[campo].before, operacion.changes[campo].after);
  }
  return runTransaction(db, async transaction => {
    const root = referenciaUsuario(uid);
    const snapshot = await transaction.get(root);
    const raw = snapshot.exists() ? snapshot.data() : {};
    const version = Number(raw.versionEsquema) >= 2 ? 2 : 1;
    const configuracion = {};
    const registros = [];
    for (const [campo, { before, after }] of Object.entries(operacion.changes)) {
      if (version >= 2 && COLECCIONES_V2[campo]) {
        const cambios = calcularCambiosColeccion(before, after);
        const old = new Map(before.map(v => [v.id, v]));
        const next = new Map(after.map(v => [v.id, v]));
        for (const id of [...cambios.creados, ...cambios.actualizados].map(v => v.id).concat(cambios.eliminados)) {
          const ref = doc(db, 'usuarios', uid, COLECCIONES_V2[campo], id);
          const item = await transaction.get(ref);
          const value = fusionar(item.exists() ? item.data() : undefined, old.get(id), next.get(id), true, `${campo}/${id}`);
          registros.push({ ref, value });
        }
      } else {
        const current = normalizarDatosUsuario(raw)[campo];
        configuracion[campo] = COLECCIONES_V2[campo]
          ? fusionarRegistros(current, before, after)
          : fusionar(current, before, after, true, campo);
      }
    }
    if (registros.length > 400) throw new Error('Esta operación supera 400 cambios. Divide la importación antes de guardar. No se ha modificado la nube.');
    const nextRoot = { ...raw, ...configuracion, revision: (raw.revision || 0) + 1 };
    if (new Blob([JSON.stringify(nextRoot)]).size > 900000) throw new Error('El documento está cerca del límite. Exporta una copia y migra a almacenamiento ampliado.');
    for (const { ref, value } of registros) {
      if (value === undefined) transaction.delete(ref); else transaction.set(ref, value);
    }
    transaction.set(root, { ...configuracion, revision: nextRoot.revision }, { mergeFields: [...Object.keys(configuracion), 'revision'] });
    return nextRoot.revision;
  });
}

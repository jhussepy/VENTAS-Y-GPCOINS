// ============================================================================
//  Conexión opcional a API.Bible (scripture.api.bible) para mostrar versiones
//  con derechos de autor (p. ej. NTV) que no se pueden empaquetar.
//  La clave y la versión elegida se guardan SOLO en el dispositivo
//  (localStorage), nunca en el código ni en la nube.
//  Si no hay clave configurada, la app usa la Reina-Valera 1909 offline.
// ============================================================================
import { useEffect, useState } from 'react';
import { VERSION_BIBLICA } from '../data/biblia.js';

// Servidor oficial según el spec OpenAPI de API.Bible (v1.6.3)
const BASE = 'https://rest.api.bible/v1';
const KEY_LS = 'fe_api_key';
const BIBLE_LS = 'fe_api_bible'; // { id, nombre, abrev }

const lget = (k) => { try { return localStorage.getItem(k); } catch { return null; } };
const lset = (k, v) => { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch { /* ignora */ } };

export const getApiKey = () => lget(KEY_LS) || '';
export const setApiKey = (k) => lset(KEY_LS, k || null);
export const getBible = () => { try { return JSON.parse(lget(BIBLE_LS)); } catch { return null; } };
export const setBible = (b) => lset(BIBLE_LS, b ? JSON.stringify(b) : null);
export const apiActiva = () => !!getApiKey() && !!getBible();

// Lista las versiones bíblicas en español disponibles para esa clave
export async function listarBiblias(key) {
  const res = await fetch(`${BASE}/bibles?language=spa`, { headers: { 'api-key': key } });
  if (res.status === 401 || res.status === 403) throw new Error('Clave no válida o sin permisos.');
  if (!res.ok) throw new Error('No se pudo conectar con API.Bible.');
  const { data } = await res.json();
  return (data || []).map((b) => ({ id: b.id, nombre: b.name, abrev: b.abbreviationLocal || b.abbreviation }));
}

const limpiar = (bruto) => String(bruto || '')
  .replace(/<[^>]+>/g, ' ')   // etiquetas HTML
  .replace(/\[\d+\]/g, ' ')   // marcas de nota [3]
  .replace(/\s+/g, ' ')
  .trim();

// Devuelve el texto plano de un pasaje. Prioriza el pid (ID de pasaje, fiable e
// independiente del idioma); si no lo hay, busca por la cita. null si falla.
export async function textoDeReferencia(key, bibleId, cita, pid) {
  try {
    let url;
    if (pid) {
      url = `${BASE}/bibles/${bibleId}/passages/${encodeURIComponent(pid)}`
        + '?content-type=text&include-notes=false&include-titles=false'
        + '&include-chapter-numbers=false&include-verse-numbers=false&include-verse-spans=false';
    } else {
      url = `${BASE}/bibles/${bibleId}/search?query=${encodeURIComponent(cita)}&limit=1`;
    }
    const res = await fetch(url, { headers: { 'api-key': key } });
    if (!res.ok) return null;
    const { data } = await res.json();
    const bruto = pid
      ? data?.content
      : (data?.passages?.[0]?.content || (data?.verses || []).map((v) => v.text).join(' '));
    const txt = limpiar(bruto);
    return txt || null;
  } catch { return null; }
}

// Hook: muestra el texto de respaldo (RVR1909 offline) al instante y, si hay
// API configurada, lo sustituye por el de la versión elegida (p. ej. NTV).
export function useVersiculo(cita, textoFallback, pid) {
  const [estado, setEstado] = useState({ texto: textoFallback, version: VERSION_BIBLICA });
  useEffect(() => {
    setEstado({ texto: textoFallback, version: VERSION_BIBLICA });
    if (!apiActiva()) return undefined;
    const b = getBible();
    let vivo = true;
    textoDeReferencia(getApiKey(), b.id, cita, pid).then((t) => {
      if (vivo && t) setEstado({ texto: t, version: b.abrev || b.nombre });
    });
    return () => { vivo = false; };
  }, [cita, textoFallback, pid]);
  return estado;
}

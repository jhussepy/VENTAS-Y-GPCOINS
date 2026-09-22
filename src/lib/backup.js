import { objetoPlano as plain, validarRegistroBackup, validarPapelera } from './validacionBackup.js';
export function crearBackup(datos) {
  return { aplicacion: 'gpcoins', version: 2, generado: new Date().toISOString(),
    ventas: datos.ventas || [], ventasLowi: datos.ventasLowi || [], agendados: datos.agendados || [],
    tarifas: datos.tarifas || [], precios: datos.precios || {}, objetivosLogros: datos.objetivosLogros || {},
    personal: datos.personal || {}, tema: datos.tema || 'dark' };
}
export function validarBackup(d) {
  const inspect = (value, depth = 0) => {
    if (depth > 30) throw new Error('La copia contiene una estructura demasiado profunda.');
    if (value && typeof value === 'object') for (const [key, child] of Object.entries(value)) {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('La copia contiene claves no permitidas.');
      inspect(child, depth + 1);
    }
  };
  inspect(d);
  if (!plain(d) || ![1, 2].includes(d.version) || typeof d.generado !== 'string' || !Number.isFinite(Date.parse(d.generado))) throw new Error('No es una copia de GP COINS válida.');
  if (d.version === 2 && d.aplicacion !== 'gpcoins') throw new Error('La copia pertenece a otra aplicación.');
  for (const campo of ['ventas', 'ventasLowi', 'agendados', 'tarifas']) {
    if (!Array.isArray(d[campo])) throw new Error(`Falta la colección ${campo}.`);
    const ids = new Set();
    for (const item of d[campo]) {
      validarRegistroBackup(item, campo, campo);
      if (ids.has(item.id)) throw new Error(`ID duplicado en ${campo}.`);
      ids.add(item.id);
    }
  }
  for (const campo of ['precios', 'objetivosLogros']) if (!plain(d[campo])) throw new Error(`Falta la configuración ${campo}.`);
  if ((d.version === 2 || d.personal !== undefined) && !plain(d.personal)) throw new Error('Configuración personal inválida.');
  if (d.personal?.papelera !== undefined) validarPapelera(d.personal.papelera);
  return crearBackup(d);
}
export function descargarJSON(data, nombre) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a'); a.href = url; a.download = nombre; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportarBackup(datos) {
  descargarJSON(crearBackup(datos), `backup_gpcoins_${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
}
export function leerBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => { try { resolve(validarBackup(JSON.parse(e.target.result))); } catch (error) { reject(error); } };
    reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
    reader.readAsText(file);
  });
}

import { fechaExcel } from './parsing.js';
const plain = x => x && typeof x === 'object' && !Array.isArray(x);
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
      if (!plain(item) || typeof item.id !== 'string' || !item.id.trim() || item.id.includes('/') || ids.has(item.id)) throw new Error(`Registro o ID inválido/duplicado en ${campo}.`);
      ids.add(item.id);
      for (const [key, value] of Object.entries(item)) {
        if (/^fecha/.test(key) && value) fechaExcel(null, value);
        if (['cantidad', 'cuota', 'precio', 'lineasVoz', 'portasVoz', 'portasActivas'].includes(key) && (typeof value !== 'number' || !Number.isFinite(value) || value < 0)) throw new Error(`Número inválido en ${campo}.`);
      }
      if (item.lineasMoviles !== undefined && !Array.isArray(item.lineasMoviles)) throw new Error(`Líneas móviles inválidas en ${campo}.`);
    }
  }
  for (const campo of ['precios', 'objetivosLogros']) if (!plain(d[campo])) throw new Error(`Falta la configuración ${campo}.`);
  if (d.version === 2 && !plain(d.personal)) throw new Error('Configuración personal inválida.');
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

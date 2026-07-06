// ============================================================================
//  Copia de seguridad: exporta/importa todos los datos del usuario en JSON
// ============================================================================

const VERSION = 1;

// Descarga un .json con todos los datos
export function exportarBackup({ ventas, ventasLowi, tarifas, precios, objetivosLogros, agendados }) {
  const data = {
    version: VERSION,
    generado: new Date().toISOString(),
    ventas: ventas || [],
    ventasLowi: ventasLowi || [],
    tarifas: tarifas || [],
    precios: precios || {},
    objetivosLogros: objetivosLogros || {},
    agendados: agendados || [],
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `backup_ventas_${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Lee un .json de backup y devuelve los datos validados
export function leerBackup(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const d = JSON.parse(e.target.result);
        resolve({
          ventas: Array.isArray(d.ventas) ? d.ventas : [],
          ventasLowi: Array.isArray(d.ventasLowi) ? d.ventasLowi : [],
          tarifas: Array.isArray(d.tarifas) ? d.tarifas : [],
          precios: (d.precios && typeof d.precios === 'object') ? d.precios : {},
          objetivosLogros: (d.objetivosLogros && typeof d.objetivosLogros === 'object') ? d.objetivosLogros : {},
          agendados: Array.isArray(d.agendados) ? d.agendados : [],
        });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

const pad2 = (n) => String(n).padStart(2, '0');

// Día del calendario local en formato HTML date (YYYY-MM-DD).
// No usar toISOString().slice(0, 10): toISOString convierte primero a UTC y
// puede devolver el día anterior/siguiente cerca de medianoche.
export function fechaLocalISO(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

export function fechaHoraLocalISO(d = new Date()) {
  return `${fechaLocalISO(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

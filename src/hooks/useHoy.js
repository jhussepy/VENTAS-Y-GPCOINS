import { useState, useEffect } from 'react';

// Fecha local YYYY-MM-DD (sin desfase de zona horaria)
const diaLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Devuelve el día local actual (YYYY-MM-DD) y se actualiza solo cuando cambia
// el día, aunque la app siga abierta: al volver a la pestaña, al recuperar el
// foco o cada minuto. Sirve para que el "versículo del día" y la bendición se
// refresquen al pasar la medianoche sin tener que recargar.
export function useHoy() {
  const [hoy, setHoy] = useState(diaLocal);
  useEffect(() => {
    const revisar = () => setHoy((prev) => { const d = diaLocal(); return prev === d ? prev : d; });
    const id = setInterval(revisar, 60000);
    document.addEventListener('visibilitychange', revisar);
    window.addEventListener('focus', revisar);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', revisar);
      window.removeEventListener('focus', revisar);
    };
  }, []);
  return hoy;
}

// Convierte el YYYY-MM-DD de useHoy en un Date al mediodía local (para pasarlo
// a versiculoDelDia/bendicionDelDia sin líos de zona horaria).
export const fechaDeHoy = (hoy) => new Date(`${hoy}T12:00:00`);

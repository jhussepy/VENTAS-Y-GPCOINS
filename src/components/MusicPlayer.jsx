// ============================================================================
//  Mini reproductor flotante de música cristiana (playlist de YouTube del
//  usuario). El iframe se mantiene siempre montado mientras está activado
//  (solo se colapsa visualmente al minimizar) para que la música no se corte
//  al navegar entre secciones o minimizar el reproductor.
// ============================================================================
import { useState } from 'react';
import { Music, X, Minus } from 'lucide-react';

// La playlist original de YouTube falla al insertarse en webs externas
// (error 153: el parámetro `list=` de esta playlist da error de configuración
// del reproductor, incluso combinado con un vídeo que sí permite embed en
// solitario). Para no depender de ese mecanismo roto, reproducimos en bucle
// el vídeo que se confirmó que SÍ funciona embebido.
const VIDEO_ID = '8vbgAYYoy-I';
const EMBED_URL = `https://www.youtube.com/embed/${VIDEO_ID}?autoplay=1&modestbranding=1&rel=0&loop=1&playlist=${VIDEO_ID}`;

export default function MusicPlayer() {
  const [activado, setActivado] = useState(false); // el usuario aún no ha pulsado play
  const [minimizado, setMinimizado] = useState(false);

  if (!activado) {
    return (
      <button
        onClick={() => setActivado(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 text-white shadow-lg hover:scale-105 transition-transform cursor-pointer"
        aria-label="Reproducir música cristiana de fondo"
        title="Música cristiana de fondo"
      >
        <Music size={18} />
        <span className="text-sm font-semibold hidden sm:inline">Música cristiana</span>
      </button>
    );
  }

  return (
    <>
      <div
        className={`fixed z-50 bottom-4 right-4 rounded-2xl shadow-xl border border-bg-border bg-bg-surface overflow-hidden transition-all duration-200
                    ${minimizado ? 'w-0 h-0 opacity-0 pointer-events-none' : 'w-72 opacity-100'}`}
        aria-hidden={minimizado}
      >
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 text-white">
          <span className="text-xs font-semibold flex items-center gap-1.5"><Music size={13} /> Música cristiana</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setMinimizado(true)} className="p-1 hover:bg-white/20 rounded cursor-pointer" aria-label="Minimizar reproductor" title="Minimizar">
              <Minus size={14} />
            </button>
            <button onClick={() => setActivado(false)} className="p-1 hover:bg-white/20 rounded cursor-pointer" aria-label="Cerrar reproductor" title="Cerrar">
              <X size={14} />
            </button>
          </div>
        </div>
        <iframe
          src={EMBED_URL}
          title="Música cristiana de fondo"
          className="w-full h-40 border-0 block"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>

      {minimizado && (
        <button
          onClick={() => setMinimizado(false)}
          className="fixed z-50 bottom-4 right-4 w-14 h-14 rounded-full bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 text-white shadow-lg hover:scale-105 transition-transform cursor-pointer flex items-center justify-center animate-pulse"
          aria-label="Expandir reproductor de música"
          title="Música cristiana (sonando)"
        >
          <Music size={20} />
        </button>
      )}
    </>
  );
}

// ============================================================================
//  Mini reproductor flotante de música cristiana (playlist de Spotify del
//  usuario). A diferencia de YouTube, el widget de inserción de Spotify no
//  bloquea canciones sueltas: cualquier playlist pública se puede insertar
//  entera. El iframe se mantiene siempre montado mientras está activado (solo
//  se colapsa visualmente al minimizar) para que la música no se corte al
//  navegar entre secciones o minimizar el reproductor.
// ============================================================================
import { useState } from 'react';
import { Music, X, Minus } from 'lucide-react';

const PLAYLIST_ID = '0wLtqnI9JV1AyaM4c9ZS6b';
const EMBED_URL = `https://open.spotify.com/embed/playlist/${PLAYLIST_ID}?utm_source=generator`;

export default function MusicPlayer() {
  const [activado, setActivado] = useState(false); // el usuario aún no ha pulsado play
  const [minimizado, setMinimizado] = useState(false);

  if (!activado) {
    return (
      <button
        onClick={() => setActivado(true)}
        className="fixed bottom-4 right-4 z-50 w-12 h-12 flex items-center justify-center rounded-full bg-gradient-to-br from-indigo-700 via-violet-700 to-fuchsia-700 text-white shadow-lg hover:scale-105 transition-transform cursor-pointer"
        aria-label="Reproducir música cristiana de fondo"
        title="Música cristiana de fondo"
      >
        <Music size={18} />
      </button>
    );
  }

  return (
    <>
      <div
        className={`fixed z-50 bottom-4 right-4 rounded-2xl shadow-xl border border-bg-border bg-bg-surface overflow-hidden transition-all duration-200
                    ${minimizado ? 'w-0 h-0 opacity-0 pointer-events-none' : 'w-80 opacity-100'}`}
        aria-hidden={minimizado}
      >
        <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-indigo-700 via-violet-700 to-fuchsia-700 text-white">
          <Music size={15} aria-label="Música cristiana" />
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
          title="Música cristiana de fondo (Spotify)"
          className="w-full h-[352px] border-0 block"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
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

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

// El widget de Spotify solo carga las primeras 100 canciones de una
// playlist; para no perder el resto, la música se reparte en varias
// playlists (cada una <100 canciones) y se elige cuál sonar aquí.
const PLAYLISTS = [
  { id: '0wLtqnI9JV1AyaM4c9ZS6b', label: 'Cristiana 1' },
  { id: '3AFtzyQfCeAFRW4hagIvBq', label: 'Cristiana 2' },
  { id: '3XRUzKrwpOQ6kfm7lmEBzk', label: 'Cristiana 3' },
];
const embedUrl = (id) => `https://open.spotify.com/embed/playlist/${id}?utm_source=generator`;

export default function MusicPlayer() {
  const [activado, setActivado] = useState(false); // el usuario aún no ha pulsado play
  const [minimizado, setMinimizado] = useState(false);
  const [sel, setSel] = useState(0); // índice de la playlist activa

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
          <Music size={15} aria-label="Música cristiana" className="shrink-0" />
          {PLAYLISTS.length > 1 && (
            <select
              value={sel}
              onChange={(e) => setSel(Number(e.target.value))}
              className="bg-white/15 text-white text-xs rounded px-1.5 py-0.5 mx-2 flex-1 min-w-0 cursor-pointer focus:outline-none"
              aria-label="Elegir playlist"
            >
              {PLAYLISTS.map((p, i) => <option key={p.id} value={i} className="text-fg bg-bg-surface">{p.label}</option>)}
            </select>
          )}
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setMinimizado(true)} className="p-1 hover:bg-white/20 rounded cursor-pointer" aria-label="Minimizar reproductor" title="Minimizar">
              <Minus size={14} />
            </button>
            <button onClick={() => setActivado(false)} className="p-1 hover:bg-white/20 rounded cursor-pointer" aria-label="Cerrar reproductor" title="Cerrar">
              <X size={14} />
            </button>
          </div>
        </div>
        <iframe
          key={PLAYLISTS[sel].id}
          src={embedUrl(PLAYLISTS[sel].id)}
          title={`Música cristiana de fondo (Spotify) — ${PLAYLISTS[sel].label}`}
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

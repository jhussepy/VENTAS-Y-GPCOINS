import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Search, CornerDownLeft, User, PhoneCall } from 'lucide-react';

// Normaliza texto para buscar sin acentos ni mayúsculas
const norm = (s) => (s || '').toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * Barra de comandos (Cmd+K / Ctrl+K): salta a secciones y busca clientes
 * por nombre/DNI/teléfono en Ventas, Lowi y Agendados.
 */
export default function CommandPalette({ abierto, cerrar, secciones, irA, ventas, ventasLowi, agendados }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (abierto) { setQ(''); setSel(0); setTimeout(() => inputRef.current?.focus(), 30); }
  }, [abierto]);

  const resultados = useMemo(() => {
    const nq = norm(q);
    const items = [];
    // Secciones de la app
    for (const s of secciones) {
      if (!nq || norm(s.label).includes(nq)) {
        items.push({ tipo: 'seccion', id: `sec-${s.id}`, label: s.label, icon: s.icon, run: () => irA(s.id) });
      }
    }
    // Clientes (solo si hay texto: evita listar todo)
    if (nq.length >= 2) {
      const buscarEn = (lista, origen, pagina) => {
        for (const v of lista) {
          const nombre = `${v.nombre || ''} ${v.apellido || ''}`.trim();
          const hit = norm(nombre).includes(nq) || norm(v.dni).includes(nq) || norm(v.telefono).includes(nq);
          if (hit && nombre) {
            items.push({
              tipo: 'cliente', id: `${origen}-${v.id}`, label: nombre, sub: origen,
              icon: origen === 'Agendados' ? PhoneCall : User,
              run: () => irA(pagina),
            });
          }
          if (items.length > 24) return;
        }
      };
      buscarEn(ventas || [], 'Vodafone', 'ventas');
      buscarEn(ventasLowi || [], 'Lowi', 'lowi-ventas');
      buscarEn(agendados || [], 'Agendados', 'agendados');
    }
    return items.slice(0, 12);
  }, [q, secciones, ventas, ventasLowi, agendados, irA]);

  useEffect(() => { setSel(0); }, [q]);

  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(s + 1, resultados.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(s - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); const r = resultados[sel]; if (r) { r.run(); cerrar(); } }
    else if (e.key === 'Escape') cerrar();
  };

  useEffect(() => {
    listRef.current?.children[sel]?.scrollIntoView({ block: 'nearest' });
  }, [sel]);

  if (!abierto) return null;
  return createPortal(
    <div className="fixed inset-0 z-[70] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[12vh] fade-in" onClick={cerrar}>
      <div
        className="w-full max-w-lg rounded-2xl border border-bg-border bg-bg-surface shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Buscador rápido"
      >
        <div className="flex items-center gap-3 px-4 border-b border-bg-border">
          <Search size={17} className="text-fg-muted shrink-0" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onKey}
            placeholder="Buscar sección o cliente (nombre, DNI, teléfono)…"
            className="w-full bg-transparent py-3.5 text-sm text-fg placeholder:text-fg-muted focus:outline-none"
            aria-label="Buscar"
          />
          <kbd className="hidden sm:block text-[10px] font-semibold text-fg-muted border border-bg-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div ref={listRef} className="max-h-72 overflow-y-auto p-2" role="listbox">
          {resultados.length === 0 ? (
            <p className="py-8 text-center text-sm text-fg-muted">Sin resultados para “{q}”.</p>
          ) : resultados.map((r, i) => (
            <button
              key={r.id}
              onClick={() => { r.run(); cerrar(); }}
              onMouseEnter={() => setSel(i)}
              role="option" aria-selected={i === sel}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left transition-colors cursor-pointer
                          ${i === sel ? 'bg-vf-red/10 text-fg' : 'text-fg-soft'}`}
            >
              <span className={`p-1.5 rounded-lg shrink-0 ${i === sel ? 'bg-vf-red/15 text-vf-red' : 'bg-bg-surface2 text-fg-muted'}`}>
                <r.icon size={15} />
              </span>
              <span className="flex-1 min-w-0 truncate">{r.label}</span>
              {r.sub && <span className="text-[10px] text-fg-muted shrink-0">{r.sub}</span>}
              {i === sel && <CornerDownLeft size={13} className="text-fg-muted shrink-0" />}
            </button>
          ))}
        </div>
        <div className="px-4 py-2 border-t border-bg-border text-[10px] text-fg-muted flex items-center gap-3">
          <span>↑↓ navegar</span><span>↵ abrir</span><span>esc cerrar</span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

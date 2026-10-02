import { useLocalStorage } from '../hooks/useLocalStorage.js';
import DialogSurface from '../components/DialogSurface.jsx';
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useApp } from '../App.jsx';
import { ventaVacia, mesDesdeFecha, unidadesVendidas, mesesImplicados } from '../lib/engine.js';
import { importarVentas, exportarVentas, plantillaVentas } from '../lib/excel.js';
import { avisosContacto } from '../lib/validacion.js';
import { estadoDe } from '../lib/estados.js';
import { CATALOGO, PERIODO, udsDe } from '../data/incentivos.js';
import { estadoCampanaEnFecha, etiquetaMesCampana } from '../data/campanas.js';
import { useConfirm } from '../components/ui.jsx';
import FormVenta from '../components/ventas/FormVenta.jsx';
import VentasControls from '../components/ventas/VentasControls.jsx';
import VentasTable from '../components/ventas/VentasTable.jsx';

const etiquetaMes = (mes) => etiquetaMesCampana(mes);

export default function Ventas() {
  const { ventas, setVentas, mes, prefillVenta, setPrefillVenta, guardarVenta, registroSeleccionado, toast } = useApp();
  const [form, setForm] = useState(!!registroSeleccionado?.id);
  const [editId, setEditId] = useState(registroSeleccionado?.id || null);
  const [prefab, setPrefab] = useState(null); // marca/sap o datos de cliente precargados
  const [agendadoRef, setAgendadoRef] = useState(null); // id del agendado origen (si la venta viene de la agenda)
  const [filtroMes, setFiltroMes] = useState(registroSeleccionado ? 'todos' : mes);
  const [filtroEstado, setFiltroEstado] = useLocalStorage('gpcoins:ui:Ventas.jsx:filtroEstado', 'todos');
  const [busqueda, setBusqueda] = useState(registroSeleccionado?.dni || registroSeleccionado?.nombre || '');
  const [msg, setMsg] = useState(null);
  const { confirmar, dialogo } = useConfirm();

  // Si llegamos desde "Vender" del Catálogo o "Convertir" de Agendados, abrimos
  // el alta ya prerrellenada. `_agendadoId` (si viene de la agenda) se separa
  // para no guardarlo en la venta y usarlo al marcar el agendado convertido.
  useEffect(() => {
    if (prefillVenta) {
      const { _agendadoId, ...datos } = prefillVenta;
      setEditId(null);
      setPrefab(datos);
      setAgendadoRef(_agendadoId || null);
      setForm(true);
      setPrefillVenta(null);
    }
  }, [prefillVenta, setPrefillVenta]);

  // La tabla sigue al período de la cabecera para los meses con reglas, pero
  // también expone meses de seguimiento fuera de campaña (p. ej. 2026-10).
  useEffect(() => { setFiltroMes(mes); }, [mes]);

  const mesesSeguimiento = useMemo(() => Array.from(new Set(
    ventas.flatMap((v) => Array.from(mesesImplicados(v)))
      .filter((m) => m && !PERIODO.meses.includes(m))
  )).sort(), [ventas]);
  const campanaFinalizada = estadoCampanaEnFecha(new Date()) === 'finalizada';

  const q = busqueda.trim().toLowerCase();
  const lista = ventas.filter((v) => {
    // Una venta aparece en su mes propio y también en el mes de la ventana de
    // portabilidad de sus portas (una porta de julio se ve al filtrar julio).
    if (filtroMes !== 'todos' && !mesesImplicados(v).has(filtroMes)) return false;
    if (filtroEstado !== 'todos' && estadoDe(v) !== filtroEstado) return false;
    if (!q) return true;
    return [v.nombre, v.apellido, v.dni, v.telefono, v.email, v.pedido, v.idWeb]
      .some((c) => String(c || '').toLowerCase().includes(q));
  });

  const guardar = (venta) => {
    // 1) Validación: nombre y apellido obligatorios
    if (!venta.nombre.trim() || !venta.apellido.trim()) {
      setMsg({ tone: 'red', text: 'Indica al menos nombre y apellido para guardar la venta.' });
      setTimeout(() => setMsg(null), 4000);
      return;
    }

    // 2) Avisos no bloqueantes (fecha fuera de período y tope de stock)
    const avisos = [];

    if (venta.fechaVenta && (venta.fechaVenta < PERIODO.inicio || venta.fechaVenta > PERIODO.fin)) {
      avisos.push(`La fecha de venta está fuera del período del incentivo (${PERIODO.inicio} → ${PERIODO.fin}). Se guardará para seguimiento, sin aplicar reglas antiguas.`);
    }
    const mesSinReglas = !!venta.mes && !PERIODO.meses.includes(venta.mes);
    if (mesSinReglas) {
      avisos.push(`${etiquetaMes(venta.mes)} no tiene reglas de GP Coins/comisión configuradas. La venta seguirá visible en Ventas.`);
    }

    avisos.push(...avisosContacto(venta));

    // Aviso de stock: tope de unidades por modelo (y familia si aplica). Solo informativo.
    if (venta.marca && venta.sap) {
      const prod = CATALOGO[venta.marca]?.productos.find((p) => p.sap === venta.sap);
      if (prod) {
        const tope = udsDe(prod, venta.mes);
        if (tope > 0) {
          // Ventas del mes ya guardadas (excluyendo la que se edita) + esta venta
          const otras = ventas.filter((p) => p.id !== venta.id);
          const conEsta = [...otras, venta];
          const { porModelo, porFamilia } = unidadesVendidas(conEsta, venta.marca, venta.mes);
          const usadasModelo = porModelo[venta.sap] || 0;
          const usadasFamilia = prod.familia ? (porFamilia[prod.familia] || 0) : usadasModelo;
          const usadas = Math.max(usadasModelo, usadasFamilia);
          if (usadas >= tope) {
            avisos.push(`Aviso de stock: se alcanzaría el tope de ${tope} uds (${usadas}) para ${prod.modelo} en ${venta.mes}. El stock es global de plataforma; la venta se guarda igualmente.`);
          }
        }
      }
    }

    const existia = ventas.some(p => p.id === venta.id);
    try { guardarVenta('ventas', venta, agendadoRef); } catch(e) { toast?.(e.message, 'error'); return; }
    setForm(false); setEditId(null); setPrefab(null);
    // Una venta fuera de campaña debe quedar visible inmediatamente, no oculta
    // detrás del último mes configurado en la cabecera.
    if (mesSinReglas) setFiltroMes(venta.mes);
    // Si esta alta venía de un agendado, márcalo "Convertido" (solo ahora, al guardar)
    setAgendadoRef(null);

    if (avisos.length) {
      setMsg({ tone: 'red', text: `Venta guardada. ${avisos.join(' ')}` });
      setTimeout(() => setMsg(null), 7000);
    } else {
      toast?.(existia ? 'Venta actualizada' : 'Venta guardada');
    }
  };

  const eliminar = async (id) => {
    const ok = await confirmar('¿Eliminar esta venta? Podrás recuperarla desde Copias y papelera.', { titulo: 'Eliminar venta', accion: 'Eliminar', peligro: true });
    if (ok) { setVentas((prev) => prev.filter((p) => p.id !== id)); toast?.('Venta eliminada', 'info'); }
  };

  // Cambio rápido de estado desde la tabla (mantiene instalacionActiva en sync)
  const cambiarEstado = (id, estado) => {
    setVentas((prev) => prev.map((p) => (p.id === id
      ? { ...p, estado, instalacionActiva: estado === 'activa' }
      : p)));
  };

  const onImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const { ventas: nuevas, duplicadas, yaExistian, fueraPeriodo } = await importarVentas(file, ventas);
      if (nuevas.length > 400) throw new Error('Importa como máximo 400 filas por archivo.');
      const sinReglas = nuevas.filter((v) => v.mes && !PERIODO.meses.includes(v.mes)).length;
      if (!await confirmar(`${nuevas.length} ventas nuevas, ${duplicadas} duplicadas y ${yaExistian} ya existentes. ¿Importar las nuevas?`, { titulo: 'Revisar importación', accion: 'Importar' })) { e.target.value = ''; return; }
      setVentas((prev) => [...nuevas, ...prev]);
      if (sinReglas > 0) setFiltroMes('todos');
      let text = `${nuevas.length} ventas importadas`;
      const omitidas = [];
      if (yaExistian > 0) omitidas.push(`${yaExistian} ya existentes`);
      if (duplicadas > 0) omitidas.push(`${duplicadas} duplicadas`);
      if (omitidas.length) text += ` (${omitidas.join(', ')} omitidas)`;
      if (fueraPeriodo > 0) text += ` · ${fueraPeriodo} fuera de período`;
      if (sinReglas > 0) text += ` · ${sinReglas} en meses sin reglas (solo seguimiento)`;
      text += '.';
      setMsg({ tone: fueraPeriodo > 0 || sinReglas > 0 ? 'red' : 'green', text });
    } catch (error) {
      setMsg({ tone: 'red', text: error.message || 'Error al leer el Excel.' });
    }
    e.target.value = '';
    setTimeout(() => setMsg(null), 4000);
  };


  return (
    <div className="space-y-6">
      {campanaFinalizada && (
        <div className="text-sm px-4 py-3 rounded-lg bg-amber-500/15 text-amber-300 border border-amber-500/30">
          La campaña de incentivos terminó el <span className="font-semibold">{PERIODO.fin}</span>. Las ventas posteriores se guardan y se muestran aquí como seguimiento; no generan GP Coins ni comisión hasta configurar una nueva campaña.
        </div>
      )}
      <VentasControls
        ventasCount={ventas.length}
        filtroMes={filtroMes}
        setFiltroMes={setFiltroMes}
        filtroEstado={filtroEstado}
        setFiltroEstado={setFiltroEstado}
        mesesSeguimiento={mesesSeguimiento}
        onNueva={() => { setEditId(null); setPrefab(null); setAgendadoRef(null); setForm(true); }}
        onImport={onImport}
        onPlantilla={plantillaVentas}
        onExportar={() => exportarVentas(ventas)}
      />

      {msg && <div className={`text-sm px-4 py-2 rounded-lg ${msg.tone === 'green' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-vf-red/15 text-vf-redLight'}`} role="alert">{msg.text}</div>}

      {form && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/60 p-4 overflow-y-auto fade-in"
          onClick={() => { setForm(false); setEditId(null); setPrefab(null); setAgendadoRef(null); }}
        >
          <DialogSurface
            className="card w-full max-w-5xl p-5 my-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onClose={() => setForm(false)} label="Editar registro"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-fg tracking-tight">{editId ? 'Editar venta' : 'Registrar nueva venta'}</h2>
              <button onClick={() => { setForm(false); setEditId(null); setPrefab(null); setAgendadoRef(null); }} className="p-1.5 rounded-lg hover:bg-bg-surface2 text-fg-muted hover:text-fg cursor-pointer" aria-label="Cerrar"><X size={18} /></button>
            </div>
            {msg && <p role="alert" className="text-vf-redLight mb-3">{msg.text}</p>}
            <FormVenta
              inicial={editId
                ? (() => { const f = ventas.find((v) => v.id === editId); return { ...ventaVacia(), ...f, estado: estadoDe(f) }; })()
                : (() => {
                    // Alta nueva: fecha de venta de HOY prellenada (editable), para
                    // que la venta cuente en "Ventas por día" desde el primer momento.
                    const hoy = new Date();
                    const f = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
                    return { ...ventaVacia(), fechaVenta: f, mes: mesDesdeFecha(f) || mes, ...(prefab || {}) };
                  })()}
              onGuardar={guardar}
              onCancelar={() => { setForm(false); setEditId(null); setPrefab(null); setAgendadoRef(null); }}
            />
          </DialogSurface>
        </div>,
        document.body,
      )}

      <VentasTable
        lista={lista}
        filtroMes={filtroMes}
        busqueda={busqueda}
        setBusqueda={setBusqueda}
        onCambiarEstado={cambiarEstado}
        onEditar={(id) => { setEditId(id); setPrefab(null); setAgendadoRef(null); setForm(true); }}
        onEliminar={eliminar}
      />
      {dialogo}
    </div>
  );
}

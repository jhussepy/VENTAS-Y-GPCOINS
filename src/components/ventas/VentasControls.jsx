import { useRef } from 'react';
import { Plus, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { ESTADOS, ORDEN_ESTADOS } from '../../lib/estados.js';
import { PERIODO } from '../../data/incentivos.js';
import { etiquetaMesCampana } from '../../data/campanas.js';

const etiquetaMes = (mes) => etiquetaMesCampana(mes);

export default function VentasControls({
  ventasCount,
  filtroMes,
  setFiltroMes,
  filtroEstado,
  setFiltroEstado,
  mesesSeguimiento,
  onNueva,
  onImport,
  onPlantilla,
  onExportar,
}) {
  const fileRef = useRef(null);

  return (
    <div className="flex flex-wrap items-center gap-2 justify-between">
      <div className="flex flex-wrap gap-2">
        <button className="btn-primary" onClick={onNueva}>
          <Plus size={16} /> Nueva venta
        </button>
        <button className="btn-ghost" onClick={() => fileRef.current?.click()}>
          <Upload size={16} /> Importar Excel
        </button>
        <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onImport} />
        <button className="btn-ghost" onClick={onPlantilla}>
          <FileSpreadsheet size={16} /> Plantilla
        </button>
        <button className="btn-ghost" onClick={onExportar} disabled={!ventasCount}>
          <Download size={16} /> Exportar
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          className="input w-auto"
          value={filtroMes}
          onChange={(e) => setFiltroMes(e.target.value)}
          title="Se sincroniza con el período activo de arriba; elige 'Todos los meses' para ver el período completo"
        >
          <option value="todos">Todos los meses</option>
          {PERIODO.meses.map((m) => <option key={m} value={m}>{etiquetaMes(m)}</option>)}
          {mesesSeguimiento.map((m) => <option key={m} value={m}>{etiquetaMes(m)} · seguimiento</option>)}
        </select>
        <select className="input w-auto" value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
          <option value="todos">Todos los estados</option>
          {ORDEN_ESTADOS.map((k) => <option key={k} value={k}>{ESTADOS[k].label}</option>)}
        </select>
      </div>
    </div>
  );
}

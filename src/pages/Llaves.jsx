import { useMemo } from 'react';
import { KeyRound, Check, X } from 'lucide-react';
import { useApp } from '../App.jsx';
import { estadoIncentivo } from '../lib/engine.js';
import { ORDEN_INCENTIVOS, PERIODO } from '../data/incentivos.js';
import { Card, Badge, Progress } from '../components/ui.jsx';

function LlaveRow({ ll }) {
  const sufijo = ll.tipo === 'porcentaje' ? '%' : '';
  return (
    <div className="py-3 border-b border-bg-border/60 last:border-0">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 w-9 h-9 rounded-full flex items-center justify-center shrink-0 border-2
                        ${ll.cumple ? 'border-emerald-500 text-emerald-400' : 'border-vf-red text-vf-redLight'}`}>
          {ll.cumple ? <Check size={16} /> : <X size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-white text-sm">{ll.label}</p>
            <span className="text-xs tabnum text-slate-400 shrink-0">
              {ll.valor}{sufijo} / {ll.objetivo}{sufijo}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">{ll.detalle}</p>
          <div className="mt-2"><Progress value={ll.pct} cumple={ll.cumple} /></div>
        </div>
      </div>
    </div>
  );
}

export default function Llaves() {
  const { ventas, mes } = useApp();
  const estados = useMemo(
    () => ORDEN_INCENTIVOS.map((id) => estadoIncentivo(ventas, id, mes)),
    [ventas, mes]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">
          Para clasificar en un incentivo debes cumplir <span className="text-white font-medium">todas</span> sus llaves.
        </p>
        <Badge tone="neutral">{PERIODO.etiquetas[mes]}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {estados.map((e) => (
          <Card key={e.incentivoId}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <KeyRound size={18} className="text-vf-red" />
                <h2 className="text-lg font-semibold text-white">{e.nombre}</h2>
              </div>
              {e.clasifica
                ? <Badge tone="green">Clasificas</Badge>
                : <Badge tone="red">{e.llaves.filter((l) => l.cumple).length}/{e.llaves.length} llaves</Badge>}
            </div>
            <div>
              {e.llaves.map((ll) => <LlaveRow key={ll.id} ll={ll} />)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

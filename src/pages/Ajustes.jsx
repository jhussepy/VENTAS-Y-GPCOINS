import { useMemo } from 'react';
import { Database, ShoppingCart, Wifi, Tag, Smartphone, HardDrive } from 'lucide-react';
import { useApp } from '../App.jsx';
import { Card, SectionTitle } from '../components/ui.jsx';
import { fmtNum } from '../lib/format.js';

const LIMITE = 1024 * 1024; // 1 MB por documento de usuario en Firestore
const tam = (obj) => { try { return new Blob([JSON.stringify(obj ?? null)]).size; } catch { return 0; } };
const kb = (b) => `${(b / 1024).toFixed(1)} KB`;

export default function Ajustes() {
  const { ventas, ventasLowi, tarifas, precios } = useApp();

  const d = useMemo(() => {
    const bVentas = tam(ventas);
    const bLowi = tam(ventasLowi);
    const bTarifas = tam(tarifas);
    const bPrecios = tam(precios);
    const total = bVentas + bLowi + bTarifas + bPrecios;
    const pct = Math.min(100, (total / LIMITE) * 100);
    return { bVentas, bLowi, bTarifas, bPrecios, total, pct };
  }, [ventas, ventasLowi, tarifas, precios]);

  const color = d.pct >= 90 ? '#E60000' : d.pct >= 75 ? '#FFB81C' : '#10B981';
  const estado = d.pct >= 90 ? 'Crítico' : d.pct >= 75 ? 'Atención' : 'Saludable';

  const filas = [
    { id: 'v', icon: ShoppingCart, label: 'Ventas Vodafone', bytes: d.bVentas, n: ventas.length, color: '#E60000' },
    { id: 'l', icon: Wifi, label: 'Ventas Lowi', bytes: d.bLowi, n: ventasLowi.length, color: '#0284C7' },
    { id: 't', icon: Tag, label: 'Tarifas', bytes: d.bTarifas, n: tarifas.length, color: '#FFB81C' },
    { id: 'p', icon: Smartphone, label: 'Precios de terminales', bytes: d.bPrecios, n: Object.keys(precios || {}).length, color: '#10B981' },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <SectionTitle right={<span className="text-xs font-semibold" style={{ color }}>{estado}</span>}>
          <span className="flex items-center gap-2"><HardDrive size={18} className="text-vf-red" /> Almacenamiento en la nube</span>
        </SectionTitle>

        {/* Barra 0% → 100% */}
        <div className="flex items-end justify-between mb-2">
          <span className="text-3xl font-bold tabnum" style={{ color }}>{d.pct.toFixed(1)}%</span>
          <span className="text-sm text-fg-muted tabnum">{kb(d.total)} / 1 MB</span>
        </div>
        <div className="w-full h-4 bg-bg-surface2 rounded-full overflow-hidden border border-bg-border">
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${d.pct}%`, background: color }} />
        </div>
        <div className="flex justify-between text-[10px] text-fg-muted mt-1">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>

        <p className="text-xs text-fg-muted mt-4">
          Cada usuario guarda sus datos en un documento de hasta <span className="text-fg-soft font-medium">1 MB</span>.
          {d.pct >= 75
            ? ' Estás cerca del límite: haz una Copia de seguridad y avísame para ampliar el almacenamiento.'
            : ' Tienes espacio de sobra; aquí podrás vigilar el uso a medida que registres ventas.'}
        </p>
      </Card>

      {/* Desglose por tipo de dato */}
      <Card>
        <SectionTitle right={<span className="text-xs text-fg-muted">{kb(d.total)} en total</span>}>
          <span className="flex items-center gap-2"><Database size={18} className="text-vf-red" /> Desglose</span>
        </SectionTitle>
        <div className="space-y-3">
          {filas.map((f) => {
            const pct = d.total ? (f.bytes / d.total) * 100 : 0;
            return (
              <div key={f.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="flex items-center gap-2 text-fg-soft">
                    <f.icon size={15} style={{ color: f.color }} /> {f.label}
                    <span className="text-fg-muted text-xs">· {fmtNum(f.n)} registros</span>
                  </span>
                  <span className="text-fg-muted tabnum text-xs">{kb(f.bytes)}</span>
                </div>
                <div className="w-full h-2 bg-bg-surface2 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: f.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <SectionTitle>Consejos</SectionTitle>
        <ul className="text-sm text-fg-soft space-y-2 list-disc pl-5">
          <li>Usa <span className="font-medium">Copia</span> (menú lateral) para descargar un respaldo en JSON periódicamente.</li>
          <li>Si llegas al <span className="font-medium">75%</span>, aparece un aviso y conviene migrar a almacenamiento ampliado.</li>
          <li>Las ventas <span className="font-medium">canceladas</span> que ya no necesites puedes eliminarlas para liberar espacio.</li>
        </ul>
      </Card>
    </div>
  );
}

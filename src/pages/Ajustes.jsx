import { useMemo, useState } from 'react';
import { Database, ShoppingCart, Wifi, Tag, Smartphone, HardDrive, CalendarClock } from 'lucide-react';
import { useApp } from '../App.jsx';
import { Card, SectionTitle, Badge } from '../components/ui.jsx';
import { fmtNum } from '../lib/format.js';
import { mesEfectivo } from '../lib/engine.js';

const LIMITE = 1024 * 1024; // 1 MB por documento de usuario en Firestore
const tam = (obj) => { try { return new Blob([JSON.stringify(obj ?? null)]).size; } catch { return 0; } };
const kb = (b) => `${(b / 1024).toFixed(1)} KB`;

export default function Ajustes() {
  const { ventas, setVentas, ventasLowi, tarifas, precios } = useApp();
  const [msg, setMsg] = useState(null);

  // Ventas de Vodafone cuyo "mes" guardado no coincide con la regla actual
  // (mes de instalación/activación, con la venta como respaldo)
  const desactualizadas = useMemo(() => ventas.filter((v) => mesEfectivo(v) !== v.mes).length, [ventas]);

  const recalcularMeses = () => {
    if (desactualizadas === 0) {
      setMsg({ tone: 'green', text: 'Todas las ventas ya tienen el mes correcto. Nada que recalcular.' });
      setTimeout(() => setMsg(null), 5000);
      return;
    }
    const ok = confirm(
      `Se recalculará el mes de ${desactualizadas} venta(s) usando la fecha de instalación ` +
      `(o la de venta si aún no la hay). Esto puede cambiar los números históricos de puntos/GP Coins ` +
      `por mes. Te recomendamos hacer antes una Copia de seguridad. ¿Continuar?`
    );
    if (!ok) return;
    setVentas((prev) => prev.map((v) => {
      const mes = mesEfectivo(v);
      return mes === v.mes ? v : { ...v, mes };
    }));
    setMsg({ tone: 'green', text: `Mes recalculado en ${desactualizadas} venta(s).` });
    setTimeout(() => setMsg(null), 5000);
  };

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

      {msg && <div className={`text-sm px-4 py-2 rounded-lg ${msg.tone === 'green' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-vf-red/15 text-vf-redLight'}`} role="alert">{msg.text}</div>}

      <Card>
        <SectionTitle right={desactualizadas > 0 ? <Badge tone="gold">{fmtNum(desactualizadas)} por actualizar</Badge> : <Badge tone="green">Al día</Badge>}>
          <span className="flex items-center gap-2"><CalendarClock size={18} className="text-vf-red" /> Mes por activación</span>
        </SectionTitle>
        <p className="text-sm text-fg-soft mb-4">
          El mes de una venta ahora se calcula desde la <span className="font-medium">fecha de instalación</span> (activación),
          no desde la fecha de venta. Las ventas guardadas antes de este cambio conservan el mes calculado con la regla
          anterior hasta que se recalculen aquí o se editen manualmente.
        </p>
        <button className="btn-primary" onClick={recalcularMeses} disabled={desactualizadas === 0}>
          Recalcular mes de {fmtNum(desactualizadas)} venta{desactualizadas === 1 ? '' : 's'}
        </button>
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

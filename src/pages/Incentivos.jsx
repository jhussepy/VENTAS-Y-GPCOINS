import { useMemo } from 'react';
import { Trophy, Coins, Gift, Ticket, Info } from 'lucide-react';
import { useApp } from '../App.jsx';
import { estadoIncentivo } from '../lib/engine.js';
import { INCENTIVOS, ORDEN_INCENTIVOS, PERIODO } from '../data/incentivos.js';
import { Card, Badge, Progress } from '../components/ui.jsx';
import { fmtNum } from '../lib/format.js';

const ICONO_MEC = { ranking: Trophy, directo: Coins, mixta: Gift };

export default function Incentivos() {
  const { ventas, mes } = useApp();
  const estados = useMemo(
    () => ORDEN_INCENTIVOS.map((id) => estadoIncentivo(ventas, id, mes)),
    [ventas, mes]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-fg-muted">Los 6 incentivos activos del período. Cambia el mes arriba para ver puntos y premios de cada periodo.</p>
        <Badge tone="neutral">{PERIODO.etiquetas[mes]}</Badge>
      </div>

      {/* Aclaración del criterio de portas: solo cuentan las activadas */}
      <div className="flex items-start gap-2 text-xs text-fg-soft bg-bg-surface2 border border-bg-border rounded-lg p-3">
        <Info size={15} className="text-vf-red shrink-0 mt-0.5" />
        <span>
          La mayoría de llaves (clientes, fibra, dispositivos, TIL65, Secure Net) cuentan solo ventas en estado
          <span className="font-medium"> Activa</span>; las pendientes, bajas o canceladas no suman.
          La llave de <span className="font-medium">Portas voz</span> es la excepción: cuenta las portabilidades
          <span className="font-medium"> activadas</span> (campo <span className="font-medium">Portas activas</span>)
          aunque la venta siga pendiente, porque la portabilidad móvil se completa por su cuenta.
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {estados.map((e) => {
          const inc = INCENTIVOS[e.incentivoId];
          const Icono = ICONO_MEC[e.mecanica] || Trophy;
          const cumplidas = e.llaves.filter((l) => l.cumple).length;
          return (
            <Card key={e.incentivoId}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-bg-surface2 text-vf-red"><Icono size={20} /></div>
                  <div>
                    <h2 className="text-lg font-semibold text-fg">{inc.nombre}</h2>
                    <Badge tone={e.mecanica === 'directo' ? 'gold' : e.mecanica === 'mixta' ? 'red' : 'neutral'}>
                      {e.mecanica === 'mixta' ? 'ranking + directo + sorteo' : e.mecanica}
                    </Badge>
                  </div>
                </div>
                {e.clasifica ? <Badge tone="green">Clasificas</Badge> : <Badge tone="red">No clasificas</Badge>}
              </div>

              <p className="text-xs text-fg-muted mb-4">{inc.descripcion}</p>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="tile p-3">
                  <p className="text-xs text-fg-muted">{e.mecanica === 'directo' ? 'GP Coins directos' : 'Puntos acumulados'}</p>
                  <p className="text-xl font-semibold tabnum text-fg">
                    {e.mecanica === 'directo' ? fmtNum(e.gp) : fmtNum(e.puntos)}
                    {e.mecanica === 'mixta' && <span className="text-sm text-gp-gold"> · {fmtNum(e.gp)} GP</span>}
                  </p>
                </div>
                <div className="tile p-3">
                  <p className="text-xs text-fg-muted">Llaves cumplidas</p>
                  <p className="text-xl font-semibold tabnum text-fg">{cumplidas}/{e.llaves.length}</p>
                </div>
              </div>

              <Progress value={(cumplidas / e.llaves.length) * 100} cumple={e.clasifica} />

              {inc.premios.length > 0 && (
                <div className="mt-4">
                  <p className="text-xs text-fg-muted mb-2 flex items-center gap-1">
                    <Trophy size={12} /> Premios ranking · Top {inc.premiados}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {inc.premios.map((p, i) => (
                      <span key={i} className="text-xs px-2 py-1 rounded bg-bg-base border border-bg-border text-fg-soft">
                        {p.rango}: <span className="text-gp-gold font-semibold">{p.gpcoins} GP</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {inc.mecanica === 'directo' && inc.notaStock && (
                <p className="mt-4 text-xs text-fg-muted flex items-center gap-1">
                  <Coins size={12} className="text-gp-gold" /> {inc.notaStock}
                </p>
              )}

              {e.incentivoId === 'motorola' && (
                <p className="mt-3 text-xs text-fg-muted flex items-center gap-1">
                  <Ticket size={12} className="text-vf-red" /> Incluye sorteo adicional (bases sorteo aparte).
                </p>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

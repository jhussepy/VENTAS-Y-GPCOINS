import { useState, useMemo } from 'react';
import {
  Smartphone, Search, Star, ShoppingCart, ArrowDownUp, X, CreditCard, LayoutGrid, List, Package,
  Tv, Watch, Headphones, Volume2, Bike, Fan, Flame, Layers,
} from 'lucide-react';
import { useApp } from '../App.jsx';
import { CATALOGO, ptsDe, gpDe, udsDe, estDe, PERIODO } from '../data/incentivos.js';
import { SEGUROS, PLAZOS, CATALOGOS_FIN, OFERTAS_FIN, calcFinanciacion } from '../data/financiacion.js';
import { unidadesVendidas } from '../lib/engine.js';
import { Card, Badge, EstrellaTag, EmptyState } from '../components/ui.jsx';
import { fmtNum, fmtEur } from '../lib/format.js';

// Sin fuente fiable de fotos reales por modelo exacto: usamos un azulejo de
// categoría (icono + degradado) detectado por palabras clave en el nombre.
// Si en el futuro se añaden fotos reales (campo `imagen` en el producto), la
// tarjeta las usaría en su lugar (ver <FotoProducto>).
function categoriaProducto(modelo = '') {
  const m = modelo.toLowerCase();
  if (m.includes(' tv') || m.includes('smart tv')) return { Icon: Tv, grad: 'from-indigo-600 to-violet-700' };
  if (m.includes('watch')) return { Icon: Watch, grad: 'from-slate-600 to-slate-800' };
  if (m.includes('buds') || m.includes('headphone')) return { Icon: Headphones, grad: 'from-sky-600 to-blue-700' };
  if (m.includes('soundbar') || m.includes('speaker') || m.includes('sound flow')) return { Icon: Volume2, grad: 'from-orange-600 to-amber-700' };
  if (m.includes('scooter')) return { Icon: Bike, grad: 'from-emerald-600 to-teal-700' };
  if (m.includes('vacuum')) return { Icon: Fan, grad: 'from-cyan-600 to-teal-700' };
  if (m.includes('fryer')) return { Icon: Flame, grad: 'from-rose-600 to-red-700' };
  return { Icon: Smartphone, grad: 'from-vf-red to-vf-redDark' };
}

// Azulejo visual del producto: foto real si existe `producto.imagen`, si no,
// icono de categoría con degradado y marca de agua a mayor tamaño.
function FotoProducto({ producto, className = 'w-full h-24', iconSize = 38 }) {
  if (producto.imagen) {
    return <img src={producto.imagen} alt={producto.modelo} className={`${className} object-cover rounded-lg`} />;
  }
  const { Icon, grad } = categoriaProducto(producto.modelo);
  return (
    <div className={`relative ${className} rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center overflow-hidden`}>
      <Icon size={iconSize} className="text-white/95 drop-shadow-sm" aria-hidden="true" />
      <Icon size={iconSize * 2.3} className="absolute -right-4 -bottom-5 text-white/10 rotate-6" aria-hidden="true" />
    </div>
  );
}

// --- Ficha/configurador de financiación de un terminal ----------------------
function DetalleTerminal({ producto, marca, mes, precioGuardado, onGuardarPrecio, onVender, onClose }) {
  const [precio, setPrecio] = useState(precioGuardado ?? producto.precio ?? '');
  const [guardado, setGuardado] = useState(false);
  const [seguro, setSeguro] = useState('desprotegido');
  const [meses, setMeses] = useState(24);
  const [catalogo, setCatalogo] = useState(CATALOGOS_FIN[0]);
  const [oferta, setOferta] = useState(OFERTAS_FIN[0]);
  const [contado, setContado] = useState(false);

  const guardar = () => {
    onGuardarPrecio(Number(precio) || 0);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 2000);
  };

  const seguroExtra = SEGUROS.find((s) => s.id === seguro)?.extra || 0;
  const r = calcFinanciacion({ precio, meses, contado, seguroExtra });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6 space-y-4 max-h-[90dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-fg leading-tight">{producto.modelo}</h2>
            <p className="text-xs text-fg-muted mt-1">SAP: {producto.sap}</p>
            <p className="text-xs text-fg-muted">Stock central: <span className="text-fg-soft font-medium">{producto.stock != null ? fmtNum(producto.stock) : '—'}</span></p>
          </div>
          <button className="btn-ghost p-2" onClick={onClose} aria-label="Cerrar"><X size={16} /></button>
        </div>

        {/* Precio del terminal: editable y guardable por mes */}
        <div>
          <label className="label">Precio del terminal · {mes.toUpperCase()} (€)</label>
          <div className="flex gap-2">
            <input type="number" min="0" step="0.01" className="input" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Introduce el precio" />
            <button className="btn-primary shrink-0" onClick={guardar} title="Guardar este precio para el mes activo">
              {guardado ? '✓ Guardado' : 'Guardar'}
            </button>
          </div>
          <p className="text-[11px] text-fg-muted mt-1">
            {precioGuardado != null
              ? `Guardado para ${mes}: ${fmtEur(precioGuardado)}. Cámbialo cada mes si varía.`
              : 'Introduce el precio y pulsa Guardar (se guarda por mes y en la nube).'}
          </p>
        </div>

        <div>
          <label className="label">Seguro Móvil</label>
          <select className="input" value={seguro} onChange={(e) => setSeguro(e.target.value)}>
            {SEGUROS.map((s) => {
              const cuota = calcFinanciacion({ precio, meses, contado, seguroExtra: s.extra }).cuota;
              return <option key={s.id} value={s.id}>{s.label} ({fmtEur(cuota)}/mes)</option>;
            })}
          </select>
        </div>

        <div>
          <label className="label mb-2">Tipos de Financiación</label>
          <div className="flex gap-4">
            {PLAZOS.map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm text-fg-soft cursor-pointer">
                <input type="radio" name="plazo" checked={meses === m} onChange={() => setMeses(m)} disabled={contado} className="accent-vf-red" />
                Financiación {m} meses
              </label>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Catálogo</label>
            <select className="input" value={catalogo} onChange={(e) => setCatalogo(e.target.value)}>
              {CATALOGOS_FIN.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Tipo de Oferta</label>
            <select className="input" value={oferta} onChange={(e) => setOferta(e.target.value)}>
              {OFERTAS_FIN.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>

        {/* Resultado del cálculo */}
        <div className="grid grid-cols-3 gap-2 tile text-center">
          <div>
            <p className="text-lg font-bold text-fg tabnum">{fmtEur(r.pagoInicial)}</p>
            <p className="text-[10px] text-fg-muted">Pago inicial</p>
          </div>
          <div>
            <p className="text-lg font-bold text-vf-red tabnum">{contado ? '—' : `${fmtEur(r.cuota)}`}</p>
            <p className="text-[10px] text-fg-muted">Cuota mensual</p>
          </div>
          <div>
            <p className="text-lg font-bold text-fg tabnum">{fmtEur(r.total)}</p>
            <p className="text-[10px] text-fg-muted">Pago total terminal</p>
          </div>
        </div>

        <label className="flex items-center gap-2 text-sm text-fg-soft cursor-pointer">
          <input type="checkbox" checked={contado} onChange={(e) => setContado(e.target.checked)} className="accent-vf-red w-4 h-4" />
          Pago al contado
        </label>

        <div className="flex gap-2 justify-end pt-1">
          <button className="btn-ghost" onClick={onClose}>Cerrar</button>
          <button className="btn-primary" onClick={() => onVender(marca, producto.sap)}>
            <ShoppingCart size={15} /> Seleccionar terminal
          </button>
        </div>
      </div>
    </div>
  );
}

const MARCAS = Object.keys(CATALOGO);
const ETIQ_MEC = {
  ranking: { tone: 'neutral', txt: 'Ranking (puntos)' },
  directo: { tone: 'gold', txt: 'Directo al monedero' },
  mixta: { tone: 'red', txt: 'Ranking + directo + sorteo' },
};

export default function Catalogo() {
  const { ventas, mes, venderModelo, precios, guardarPrecio } = useApp();
  const [marca, setMarca] = useState('xiaomi');
  const [q, setQ] = useState('');
  const [orden, setOrden] = useState('desc');       // desc | asc por valor
  const [soloEstrella, setSoloEstrella] = useState(false);
  const [soloStock, setSoloStock] = useState(false);
  const [detalle, setDetalle] = useState(null); // producto en ficha de financiación
  const [plazoFin, setPlazoFin] = useState(24); // plazo de financiación mostrado en la tabla
  const [vista, setVista] = useState('tarjetas'); // tarjetas | tabla

  const cat = CATALOGO[marca];
  const vendidas = useMemo(() => unidadesVendidas(ventas, marca, mes), [ventas, marca, mes]);

  const tieneRanking = cat.mecanica === 'ranking' || cat.mecanica === 'mixta';
  const tieneDirecto = cat.mecanica === 'directo' || cat.mecanica === 'mixta';
  const otroMes = mes === 'junio' ? 'julio' : 'junio';

  // Valor principal de un producto (puntos si es ranking, GP si es directo)
  const valorDe = (p, m) => (tieneRanking ? ptsDe(p, m) : gpDe(p, m));
  // Unidades vendidas de un producto (por familia o por modelo)
  const vendDe = (p) => (cat.stockPor === 'familia' ? (vendidas.porFamilia[p.familia] || 0) : (vendidas.porModelo[p.sap] || 0));

  const productos = useMemo(() => {
    let lista = cat.productos.filter(
      (p) => p.modelo.toLowerCase().includes(q.toLowerCase()) || p.sap.includes(q)
    );
    if (soloEstrella) lista = lista.filter((p) => estDe(p, mes));
    if (soloStock && tieneDirecto) lista = lista.filter((p) => udsDe(p, mes) - vendDe(p) > 0);
    return [...lista].sort((a, b) => (orden === 'desc' ? valorDe(b, mes) - valorDe(a, mes) : valorDe(a, mes) - valorDe(b, mes)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, q, soloEstrella, soloStock, orden, mes, vendidas]);

  // Resumen de la marca
  const resumen = useMemo(() => {
    const maxVal = cat.productos.reduce((m, p) => Math.max(m, valorDe(p, mes)), 0);
    const estrellas = cat.productos.filter((p) => estDe(p, mes)).length;
    return { total: cat.productos.length, maxVal, estrellas };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cat, mes]);

  const unidad = tieneRanking ? 'pts' : 'GP';

  return (
    <div className="space-y-6">
      {/* Selector de marca + buscador */}
      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex gap-2 flex-wrap">
          {MARCAS.map((m) => (
            <button key={m} onClick={() => setMarca(m)}
              className={`btn ${marca === m ? 'bg-vf-red text-white' : 'bg-bg-surface2 text-fg-soft border border-bg-border hover:bg-bg-border'}`}>
              {CATALOGO[m].marca}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted" />
          <input className="input pl-9 w-56" placeholder="Buscar modelo o SAP…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      {/* Resumen de la marca */}
      <div className="stagger grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="tile">
          <p className="text-[11px] font-semibold text-fg-muted uppercase tracking-[0.08em] flex items-center gap-1.5"><Layers size={12} /> Modelos</p>
          <p className="text-3xl font-extrabold text-fg tabnum mt-1.5 leading-none tracking-tight">{fmtNum(resumen.total)}</p>
        </div>
        <div className="tile">
          <p className="text-[11px] font-semibold text-fg-muted uppercase tracking-[0.08em]">Máximo ({PERIODO.etiquetas[mes]})</p>
          <p className={`text-3xl font-extrabold tabnum mt-1.5 leading-none tracking-tight ${tieneRanking ? 'text-vf-redLight' : 'text-gp-gold'}`}>{fmtNum(resumen.maxVal)} <span className="text-sm font-semibold">{unidad}</span></p>
        </div>
        <div className="tile">
          <p className="text-[11px] font-semibold text-fg-muted uppercase tracking-[0.08em] flex items-center gap-1.5"><Star size={12} className="text-gp-gold" /> Destacados</p>
          <p className="text-3xl font-extrabold text-fg tabnum mt-1.5 leading-none tracking-tight">{fmtNum(resumen.estrellas)}</p>
        </div>
        <div className="tile">
          <p className="text-[11px] font-semibold text-fg-muted uppercase tracking-[0.08em]">Stock</p>
          <p className="text-lg font-bold text-fg-soft mt-1.5 leading-tight">{cat.stockPor === 'sin-limite' ? 'Sin límite' : `Por ${cat.stockPor}`}</p>
        </div>
      </div>

      <Card className="!p-0 overflow-hidden">
        <div className="p-5 border-b border-bg-border flex flex-wrap items-center gap-3 justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-bg-surface2 text-vf-red"><Smartphone size={20} /></div>
            <div>
              <h2 className="text-lg font-semibold text-fg">{cat.marca}</h2>
              <Badge tone={ETIQ_MEC[cat.mecanica].tone}>{ETIQ_MEC[cat.mecanica].txt}</Badge>
            </div>
          </div>
          {/* Controles: orden y filtros */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Conmutador de vista: tarjetas / tabla */}
            <div className="flex bg-bg-surface2 rounded-lg p-1 border border-bg-border">
              <button onClick={() => setVista('tarjetas')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${vista === 'tarjetas' ? 'bg-vf-red text-white' : 'text-fg-muted hover:text-fg'}`} title="Vista de tarjetas" aria-pressed={vista === 'tarjetas'}><LayoutGrid size={15} /></button>
              <button onClick={() => setVista('tabla')} className={`p-1.5 rounded-md transition-colors cursor-pointer ${vista === 'tabla' ? 'bg-vf-red text-white' : 'text-fg-muted hover:text-fg'}`} title="Vista de tabla" aria-pressed={vista === 'tabla'}><List size={15} /></button>
            </div>
            {/* Plazo de financiación para la cuota mostrada en la tabla */}
            <div className="flex bg-bg-surface2 rounded-lg p-1 border border-bg-border">
              {PLAZOS.map((m) => (
                <button
                  key={m}
                  onClick={() => setPlazoFin(m)}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${plazoFin === m ? 'bg-vf-red text-white' : 'text-fg-muted hover:text-fg'}`}
                >
                  {m}m
                </button>
              ))}
            </div>
            <button
              onClick={() => setOrden((o) => (o === 'desc' ? 'asc' : 'desc'))}
              className="btn bg-bg-surface2 text-fg-soft border border-bg-border hover:bg-bg-border text-xs"
              title="Ordenar por valor"
            >
              <ArrowDownUp size={14} /> {orden === 'desc' ? 'Mayor primero' : 'Menor primero'}
            </button>
            <button
              onClick={() => setSoloEstrella((s) => !s)}
              className={`btn text-xs ${soloEstrella ? 'bg-gp-gold text-black' : 'bg-bg-surface2 text-fg-soft border border-bg-border hover:bg-bg-border'}`}
            >
              <Star size={14} /> Destacados
            </button>
            {tieneDirecto && (
              <button
                onClick={() => setSoloStock((s) => !s)}
                className={`btn text-xs ${soloStock ? 'bg-emerald-600 text-white' : 'bg-bg-surface2 text-fg-soft border border-bg-border hover:bg-bg-border'}`}
              >
                Con stock
              </button>
            )}
          </div>
        </div>

        {productos.length === 0 ? (
          <EmptyState icon={Smartphone} title="Sin resultados" hint="Prueba otra búsqueda o quita los filtros." />
        ) : vista === 'tarjetas' ? (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {productos.map((p) => {
              const uds = udsDe(p, mes);
              const vend = vendDe(p);
              const restante = Math.max(0, uds - vend);
              const pctStock = uds > 0 ? Math.min(100, (vend / uds) * 100) : 0;
              const colorStock = pctStock >= 100 ? '#E60000' : pctStock >= 70 ? '#FFB81C' : '#10B981';
              const pts = ptsDe(p, mes); const gp = gpDe(p, mes);
              const precio = precios?.[p.sap]?.[mes] ?? p.precio;
              const destacado = estDe(p, mes);
              return (
                <div key={p.sap} className={`relative rounded-xl border p-4 flex flex-col transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 ${destacado ? 'border-gp-gold/50 bg-gp-gold/[0.03] shadow-md shadow-gp-gold/10' : 'border-bg-border bg-bg-surface2/40'}`}>
                  <FotoProducto producto={p} className="w-full h-24 mb-3" />
                  {destacado && <span className="absolute top-3 right-3"><EstrellaTag tipo={cat.mecanica === 'mixta' ? 'DESTACADO' : 'ESTRELLA'} /></span>}
                  <div className="mb-3">
                    <p className="font-semibold text-fg leading-tight">{p.modelo}</p>
                    <p className="text-[11px] text-fg-muted mt-0.5 tabnum">SAP {p.sap}{cat.stockPor === 'familia' && p.familia ? ` · ${p.familia}` : ''}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tieneRanking && <Badge tone="red">{pts ? `${fmtNum(pts)} pts` : '— pts'}</Badge>}
                    {tieneDirecto && <Badge tone="gold">{gp ? `${gp} GP` : '— GP'}</Badge>}
                  </div>
                  {tieneDirecto && uds > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-fg-muted flex items-center gap-1"><Package size={11} /> Quedan {fmtNum(restante)}</span>
                        <span className="text-fg-muted tabnum">{fmtNum(vend)}/{fmtNum(uds)}</span>
                      </div>
                      <div className="w-full h-1.5 bg-bg-surface rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pctStock}%`, background: colorStock }} />
                      </div>
                    </div>
                  )}
                  <div className="mt-auto flex items-end justify-between gap-2 pt-2">
                    <div>
                      {precio != null ? (
                        <>
                          <p className="text-lg font-bold text-fg tabnum leading-none">{fmtEur(precio / plazoFin)}<span className="text-[11px] text-fg-muted font-normal">/mes</span></p>
                          <p className="text-[11px] text-fg-muted mt-0.5">{plazoFin}m · {fmtEur(precio)}</p>
                        </>
                      ) : <p className="text-xs text-fg-muted">Sin precio</p>}
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setDetalle(p)} className="btn bg-bg-surface text-fg-soft border border-bg-border hover:bg-bg-border text-xs py-1.5" title="Ver ficha y financiación"><CreditCard size={13} /></button>
                      <button onClick={() => venderModelo(marca, p.sap)} className="btn bg-vf-red hover:bg-vf-redDark text-white text-xs py-1.5"><ShoppingCart size={13} /> Vender</button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-wide text-fg-muted border-b border-bg-border bg-bg-surface2/60">
                  <th className="px-4 py-3 font-semibold">SAP</th>
                  <th className="px-4 py-3 font-semibold">Modelo</th>
                  {tieneRanking && <th className="px-4 py-3 font-semibold text-right">Puntos</th>}
                  {tieneDirecto && <th className="px-4 py-3 font-semibold text-right">GP directo</th>}
                  {tieneDirecto && <th className="px-4 py-3 font-semibold">Stock</th>}
                  <th className="px-4 py-3 font-semibold text-right">Financiación {plazoFin}m</th>
                  <th className="px-4 py-3 font-semibold text-center">Destacado</th>
                  <th className="px-4 py-3 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody>
                {productos.map((p) => {
                  const uds = udsDe(p, mes);
                  const vend = vendDe(p);
                  const restante = Math.max(0, uds - vend);
                  const pctStock = uds > 0 ? Math.min(100, (vend / uds) * 100) : 0;
                  const colorStock = pctStock >= 100 ? '#E60000' : pctStock >= 70 ? '#FFB81C' : '#10B981';
                  const pts = ptsDe(p, mes); const ptsOtro = ptsDe(p, otroMes);
                  const gp = gpDe(p, mes);
                  return (
                    <tr key={p.sap} className="border-b border-bg-border/60 odd:bg-bg-surface2/25 hover:bg-bg-surface2/60 transition-colors">
                      <td className="px-4 py-3 tabnum text-fg-muted">{p.sap}</td>
                      <td className="px-4 py-3 text-fg">
                        <div className="flex items-center gap-3">
                          <FotoProducto producto={p} className="h-10 w-10 shrink-0" iconSize={16} />
                          <div className="min-w-0">
                            {p.modelo}
                            {cat.stockPor === 'familia' && <span className="block text-[11px] text-fg-muted">Familia: {p.familia}</span>}
                          </div>
                        </div>
                      </td>
                      {tieneRanking && (
                        <td className="px-4 py-3 text-right tabnum">
                          <span className="text-vf-redLight font-medium">{pts ? fmtNum(pts) : '—'}</span>
                          {pts !== ptsOtro && (
                            <span className="block text-[11px] text-fg-muted">
                              {PERIODO.etiquetas[otroMes].slice(0, 3)}: {fmtNum(ptsOtro)} {ptsOtro > pts ? '↑' : '↓'}
                            </span>
                          )}
                        </td>
                      )}
                      {tieneDirecto && <td className="px-4 py-3 text-right tabnum text-gp-gold font-medium">{gp ? `${gp} GP` : '—'}</td>}
                      {tieneDirecto && (
                        <td className="px-4 py-3 min-w-[140px]">
                          {uds ? (
                            <div>
                              <div className="flex items-center justify-between text-[11px] mb-1">
                                <span className="text-fg-muted">Quedan {fmtNum(restante)}</span>
                                <span className="text-fg-muted tabnum">{fmtNum(vend)}/{fmtNum(uds)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-bg-surface2 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pctStock}%`, background: colorStock }} />
                              </div>
                            </div>
                          ) : <span className="text-fg-muted">—</span>}
                        </td>
                      )}
                      <td className="px-4 py-3 text-right tabnum">
                        {(() => {
                          const precio = precios?.[p.sap]?.[mes] ?? p.precio;
                          if (precio == null) return <span className="text-fg-muted">—</span>;
                          return (
                            <div>
                              <div className="font-semibold text-fg">{fmtEur(precio / plazoFin)}<span className="text-[11px] text-fg-muted">/mes</span></div>
                              <div className="text-[11px] text-fg-muted">{plazoFin}m · {fmtEur(precio)}</div>
                            </div>
                          );
                        })()}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {estDe(p, mes) ? <EstrellaTag tipo={cat.mecanica === 'mixta' ? 'DESTACADO' : 'ESTRELLA'} /> : <span className="text-fg-muted">—</span>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex gap-1 justify-end">
                          <button
                            onClick={() => setDetalle(p)}
                            className="btn bg-bg-surface2 text-fg-soft border border-bg-border hover:bg-bg-border text-xs py-1.5"
                            title="Ver ficha y financiación"
                          >
                            <CreditCard size={13} /> Ficha
                          </button>
                          <button
                            onClick={() => venderModelo(marca, p.sap)}
                            className="btn bg-vf-red hover:bg-vf-redDark text-white text-xs py-1.5"
                            title="Registrar una venta con este modelo"
                          >
                            <ShoppingCart size={13} /> Vender
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {detalle && (
        <DetalleTerminal
          producto={detalle}
          marca={marca}
          mes={mes}
          precioGuardado={precios?.[detalle.sap]?.[mes]}
          onGuardarPrecio={(valor) => guardarPrecio(detalle.sap, mes, valor)}
          onVender={(m, s) => { venderModelo(m, s); setDetalle(null); }}
          onClose={() => setDetalle(null)}
        />
      )}
    </div>
  );
}

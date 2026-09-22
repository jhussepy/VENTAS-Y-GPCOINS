// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
const context = vi.hoisted(()=>({}));
vi.mock('../App.jsx',()=>({useApp:()=>context}));
import { MiDia, Clientes, Ingresos, Recuperacion } from './Personal.jsx';
import DialogSurface from '../components/DialogSurface.jsx';
import Ventas from './Ventas.jsx';
import LowiVentas from './LowiVentas.jsx';
import Agendados from './Agendados.jsx';
import { ventaVacia } from '../lib/engine.js';
import { ventaLowiVacia } from '../lib/lowi.js';
import { agendadoVacio } from '../lib/agendados.js';
let host,root;
beforeEach(()=>{
  globalThis.IS_REACT_ACT_ENVIRONMENT=true;
  Object.assign(context,{ventas:[],ventasLowi:[],agendados:[],personal:{},mes:'junio',user:{uid:'u'},navegar:vi.fn(),toast:vi.fn(),setPersonal:vi.fn(),cerrarMes:vi.fn(),registroSeleccionado:null,prefillVenta:null,setPrefillVenta:vi.fn()});
  host=document.createElement('div');document.body.append(host);root=createRoot(host);
});
afterEach(async()=>{await act(async()=>root.unmount());host.remove();vi.unstubAllGlobals();});
const render = async element=>act(async()=>root.render(element));
const click = async text=>{const button=[...document.querySelectorAll('button')].find(b=>b.textContent.includes(text));expect(button).toBeTruthy();await act(async()=>button.click());};
it('las cuatro secciones nuevas muestran estados vacíos sin excepciones',async()=>{
  for(const Page of [MiDia,Clientes,Ingresos,Recuperacion]){await render(<Page/>);expect(host.textContent.length).toBeGreaterThan(40);}
});
it('Mi día abre el registro exacto desde su tarea',async()=>{
  const a={id:'a',nombre:'Ana',estado:'pendiente',fechaLlamada:'2026-01-01'};context.agendados=[a];
  await render(<MiDia/>);await click('Abrir registro');expect(context.navegar).toHaveBeenCalledWith('agendados',a);
});
it('ficha de cliente reúne pedidos de Vodafone y Lowi',async()=>{
  context.ventas=[{id:'a',dni:'123A',nombre:'Ana',fechaVenta:'2026-06-01'}];context.ventasLowi=[{id:'b',dni:'123a',nombre:'Ana',fechaVenta:'2026-06-02'}];
  await render(<Clientes/>);await click('Ana');expect(host.textContent).toContain('2 registros');expect(host.querySelector('textarea')).toBeTruthy();expect(host.textContent).toContain('vodafone');expect(host.textContent).toContain('lowi');
});
it('cambiar mes cambia los campos del cobro, sin arrastrar importes',async()=>{
  context.personal={cobros:{'2026-06':{importe:150,fecha:'2026-06-30'}}};
  await render(<Ingresos/>);expect(host.querySelector('[name=importe]').value).toBe('150');context.mes='julio';await render(<Ingresos/>);expect(host.querySelector('[name=importe]').value).toBe('');
});
it('el diálogo mantiene el foco y admite Escape',async()=>{
  const close=vi.fn();await render(<DialogSurface onClose={close}><button>Primero</button><button>Último</button></DialogSurface>);
  const buttons=host.querySelectorAll('button');expect(document.activeElement).toBe(buttons[0]);buttons[1].focus();
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Tab',bubbles:true,cancelable:true}));expect(document.activeElement).toBe(buttons[0]);
  document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true,cancelable:true}));expect(close).toHaveBeenCalledOnce();
});
it.each([[Ventas,'ventas',ventaVacia],[LowiVentas,'ventasLowi',ventaLowiVacia],[Agendados,'agendados',agendadoVacio]])('el registro seleccionado abre su formulario con etiquetas accesibles',async(Page,campo,crear)=>{
  const record={...crear(),nombre:'Ana',apellido:'Prueba'};context[campo]=[record];context.registroSeleccionado=record;
  await render(<Page/>);const dialog=document.querySelector('[role=dialog]');expect(dialog).toBeTruthy();
  const name=[...dialog.querySelectorAll('input')].find(i=>i.value==='Ana');expect(name).toBeTruthy();expect(name.labels.length).toBeGreaterThan(0);
});
it('una entrada dañada ya guardada no bloquea la recuperación ni el borrado',async()=>{
  context.personal={papelera:{ x:{}, valida:{campo:'ventas',registro:{id:'a',nombre:'Ana'},eliminadoEn:'2026-09-21T10:00:00.000Z'} }};
  await render(<Recuperacion/>);
  expect(host.textContent).toContain('Registro dañado');
  const rows=host.querySelectorAll('li');
  const damaged=[...rows].find(row=>row.textContent.includes('Registro dañado'));
  expect(damaged.querySelector('button').disabled).toBe(true);
  await act(async()=>[...damaged.querySelectorAll('button')].find(b=>b.textContent.includes('Borrar definitivamente')).click());
  await act(async()=>document.querySelector('[role=alertdialog] .btn-primary').click());
  const mutate=context.setPersonal.mock.calls[0][0];
  const next=mutate(context.personal);
  expect(next.papelera.x).toBeUndefined();expect(next.papelera.valida).toEqual(context.personal.papelera.valida);
});
it.each([null, [], 'incorrecta'])('permite descartar un contenedor de papelera dañado: %j',async papelera=>{
  context.personal={papelera,notasClientes:{cliente:'Conservar'}};
  await render(<Recuperacion/>);
  expect(host.querySelector('[role=alert]').textContent).toContain('formato inválido');
  await click('Descartar papelera dañada');
  await act(async()=>document.querySelector('[role=alertdialog] .btn-primary').click());
  expect(context.setPersonal.mock.calls[0][0](context.personal)).toEqual({notasClientes:{cliente:'Conservar'}});
});

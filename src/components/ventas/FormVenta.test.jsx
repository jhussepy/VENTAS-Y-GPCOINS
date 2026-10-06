import { act, create } from 'react-test-renderer';
import { afterEach, expect, it } from 'vitest';
import FormVenta from './FormVenta.jsx';
import { ventaVacia } from '../../lib/engine.js';

let root;
afterEach(() => { if (root) act(() => root.unmount()); root = null; });

it('muestra las cinco ofertas y guarda la seleccionada', () => {
  let guardada = null;
  act(() => {
    root = create(
      <FormVenta
        inicial={ventaVacia()}
        onGuardar={(venta) => { guardada = venta; }}
        onCancelar={() => {}}
      />,
    );
  });

  const selects = root.root.findAllByType('select');
  const oferta = selects.find((select) => {
    const labels = select.findAllByType('option').map((option) => option.children.join(''));
    return ['40%', '30%', 'LOWI', 'DIGI', 'REAL'].every((label) => labels.includes(label));
  });

  expect(oferta).toBeTruthy();
  expect(oferta.props.value).toBe('real');

  act(() => oferta.props.onChange({ target: { value: 'digi' } }));
  expect(oferta.props.value).toBe('digi');

  const guardar = root.root.findAllByType('button').find((button) =>
    button.children.some((child) => child === ' Guardar' || child === 'Guardar')
  );
  expect(guardar).toBeTruthy();
  act(() => guardar.props.onClick());

  expect(guardada.oferta).toBe('digi');
});

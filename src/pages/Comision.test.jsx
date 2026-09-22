import { act, create } from 'react-test-renderer';
import { afterEach, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ ventas: [], mes: 'julio' }));
vi.mock('../App.jsx', () => ({ useApp: () => state }));
import Comision from './Comision.jsx';
let root;
afterEach(() => { if (root) act(() => root.unmount()); });
it('el cambio de julio a septiembre ajusta los días trabajados al nuevo máximo', () => {
  act(() => { root = create(<Comision />); });
  state.mes = 'septiembre';
  act(() => root.update(<Comision />));
  const days = root.root.findAllByType('input').find(x => x.props.max === 30);
  expect(days.props.value).toBeLessThanOrEqual(days.props.max);
});

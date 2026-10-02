import { describe, expect, it } from 'vitest';
import {
  estadoCampanaEnFecha,
  etiquetaMesCampana,
  mesActivoCampanaDesdeFecha,
  mesCampanaDesdeFecha,
  mesConfiguradoCampana,
} from './campanas.js';

describe('campañas Vodafone', () => {
  it('mantiene los identificadores legacy dentro de la campaña', () => {
    expect(mesCampanaDesdeFecha('2026-09-30')).toBe('septiembre');
    expect(mesConfiguradoCampana('septiembre')).toBe(true);
  });

  it('no atribuye octubre a septiembre', () => {
    expect(mesCampanaDesdeFecha('2026-10-02')).toBe('2026-10');
    expect(mesConfiguradoCampana('2026-10')).toBe(false);
    expect(etiquetaMesCampana('2026-10')).toBe('OCTUBRE 2026');
  });

  it('mantiene septiembre como último mes seleccionable tras cerrar la campaña', () => {
    expect(mesActivoCampanaDesdeFecha('2026-10-02')).toBe('septiembre');
  });

  it('distingue campaña activa y finalizada', () => {
    expect(estadoCampanaEnFecha('2026-09-30')).toBe('activa');
    expect(estadoCampanaEnFecha('2026-10-01')).toBe('finalizada');
  });
});

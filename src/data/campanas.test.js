import { describe, expect, it } from 'vitest';
import {
  estadoCampanaEnFecha,
  etiquetaMesCampana,
  mesActivoCampanaDesdeFecha,
  mesBaseCampana,
  mesCampanaDesdeFecha,
  mesConfiguradoCampana,
  periodoDesdeCampana,
} from './campanas.js';

describe('campañas Vodafone', () => {
  it('mantiene los identificadores legacy dentro de la campaña', () => {
    expect(mesCampanaDesdeFecha('2026-09-30')).toBe('septiembre');
    expect(mesConfiguradoCampana('septiembre')).toBe(true);
  });

  it('octubre es un mes oficial y acepta también su identificador ISO legacy', () => {
    expect(mesCampanaDesdeFecha('2026-10-02')).toBe('octubre');
    expect(mesConfiguradoCampana('octubre')).toBe(true);
    expect(mesConfiguradoCampana('2026-10')).toBe(true);
    expect(etiquetaMesCampana('octubre')).toBe('OCTUBRE');
    expect(etiquetaMesCampana('2026-10')).toBe('OCTUBRE');
  });

  it('octubre hereda transitivamente las mismas tablas efectivas que septiembre', () => {
    expect(mesBaseCampana('septiembre')).toBe('julio');
    expect(mesBaseCampana('octubre')).toBe('julio');
    expect(mesBaseCampana('2026-10')).toBe('julio');
  });

  it('octubre aparece como último mes seleccionable', () => {
    expect(mesActivoCampanaDesdeFecha('2026-10-02')).toBe('octubre');
    expect(periodoDesdeCampana().meses).toEqual(['junio', 'julio', 'agosto', 'septiembre', 'octubre']);
  });

  it('la campaña sigue activa todo octubre y finaliza en noviembre', () => {
    expect(estadoCampanaEnFecha('2026-09-30')).toBe('activa');
    expect(estadoCampanaEnFecha('2026-10-31')).toBe('activa');
    expect(estadoCampanaEnFecha('2026-11-01')).toBe('finalizada');
  });
});

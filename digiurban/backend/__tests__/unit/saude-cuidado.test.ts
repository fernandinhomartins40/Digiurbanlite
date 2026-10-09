import { describe, expect, it } from '@jest/globals';
import { calcularCPOD, dataProvavelParto, idadeGestacional, trimestre } from '../../src/services/saude/cuidado.service';

describe('pré-natal — contas da gestação', () => {
  const dum = new Date('2026-01-01T12:00:00Z');

  it('data provável do parto = DUM + 280 dias', () => {
    expect(dataProvavelParto(dum).toISOString().slice(0, 10)).toBe('2026-10-08');
  });

  it('idade gestacional em semanas e dias', () => {
    expect(idadeGestacional(dum, new Date('2026-01-01T12:00:00Z')).texto).toBe('0s 0d');
    expect(idadeGestacional(dum, new Date('2026-03-29T12:00:00Z')).texto).toBe('12s 3d');
    expect(idadeGestacional(dum, new Date('2026-10-08T12:00:00Z')).semanas).toBe(40);
  });

  it('data antes da DUM não dá idade negativa', () => {
    expect(idadeGestacional(dum, new Date('2025-12-01T12:00:00Z')).texto).toBe('0s 0d');
  });

  it('trimestres: até 13 semanas, 14 a 27, 28 em diante', () => {
    expect([trimestre(0), trimestre(13), trimestre(14), trimestre(27), trimestre(28), trimestre(41)]).toEqual([1, 1, 2, 2, 3, 3]);
  });
});

describe('odontologia — índice CPO-D', () => {
  it('soma cariados, perdidos (com extração indicada) e obturados', () => {
    const indice = calcularCPOD({
      '11': { condicao: 'HIGIDO' },
      '16': { condicao: 'CARIADO' },
      '26': { condicao: 'CARIADO' },
      '36': { condicao: 'OBTURADO' },
      '46': { condicao: 'PERDIDO' },
      '48': { condicao: 'EXTRACAO_INDICADA' },
      '21': { condicao: 'SELANTE' },
    });
    expect(indice).toEqual({ cariados: 2, perdidos: 2, obturados: 1, cpod: 5, dentes: 7 });
  });

  it('odontograma vazio dá zero', () => {
    expect(calcularCPOD(null).cpod).toBe(0);
    expect(calcularCPOD({}).cpod).toBe(0);
  });
});

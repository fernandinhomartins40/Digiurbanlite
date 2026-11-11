/**
 * Prefeitura em números e resumo da semana do Gabinete: regras puras.
 */

jest.mock('../../src/lib/prisma', () => ({ prisma: {} }));
jest.mock('../../src/services/notification.service', () => ({ __esModule: true, default: {} }));
jest.mock('../../src/services/gabinete/mayor-panel.service', () => ({ mayorTvSnapshot: jest.fn() }));

import {
  averageResponseDays,
  brasiliaMonthStart,
  brasiliaWeekStartKey,
  isCityNumbersEnabled,
} from '../../src/services/city-numbers/city-numbers.service';
import { weeklySummaryText } from '../../src/services/city-numbers/weekly-summary.service';

describe('Prefeitura em números', () => {
  it('fica desligada por padrão; só liga com true', () => {
    expect(isCityNumbersEnabled(null)).toBe(false);
    expect(isCityNumbersEnabled({ logoUrl: 'x' })).toBe(false);
    expect(isCityNumbersEnabled({ cityNumbersPublic: 'true' })).toBe(false);
    expect(isCityNumbersEnabled({ cityNumbersPublic: true })).toBe(true);
  });

  it('mês começa à meia-noite de Brasília (dia 1 às 02h UTC ainda é o mês anterior)', () => {
    expect(brasiliaMonthStart(new Date('2026-11-15T12:00:00Z')).toISOString()).toBe('2026-11-01T03:00:00.000Z');
    expect(brasiliaMonthStart(new Date('2026-11-01T02:00:00Z')).toISOString()).toBe('2026-10-01T03:00:00.000Z');
  });

  it('tempo médio em dias, ignorando datas inválidas', () => {
    const d = (s: string) => new Date(s);
    expect(averageResponseDays([])).toBeNull();
    expect(
      averageResponseDays([
        { createdAt: d('2026-11-01T00:00:00Z'), concludedAt: d('2026-11-03T00:00:00Z') },
        { createdAt: d('2026-11-01T00:00:00Z'), concludedAt: d('2026-11-02T00:00:00Z') },
        { createdAt: d('2026-11-05T00:00:00Z'), concludedAt: d('2026-11-01T00:00:00Z') },
        { createdAt: d('2026-11-05T00:00:00Z'), concludedAt: null },
      ])
    ).toBe(1.5);
  });
});

describe('resumo da semana', () => {
  it('semana começa na segunda (Brasília)', () => {
    expect(brasiliaWeekStartKey(new Date('2026-11-16T11:00:00Z'))).toBe('2026-11-16'); // segunda 8h
    expect(brasiliaWeekStartKey(new Date('2026-11-22T20:00:00Z'))).toBe('2026-11-16'); // domingo
    expect(brasiliaWeekStartKey(new Date('2026-11-16T02:00:00Z'))).toBe('2026-11-09'); // ainda domingo em Brasília
  });

  it('soma a semana e mostra a nota com vírgula', () => {
    const text = weeklySummaryText({
      kpis: { abertos: 10, atrasados: 2, satisfacao: 4.5 } as any,
      graficos: { semana: [{ dia: '1', chegaram: 3, concluidos: 1 }, { dia: '2', chegaram: 2, concluidos: 4 }] } as any,
    });
    expect(text.message).toContain('chegaram 5 pedido(s) e 5 foram concluídos');
    expect(text.message).toContain('2 atrasado(s)');
    expect(text.message).toContain('4,5 de 5');
  });
});

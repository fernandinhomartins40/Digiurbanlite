import { describe, expect, it } from '@jest/globals';
import { sortWorkbenchItems, urgencyOf } from '../../src/services/workbench/ordering';

// 2026-11-11 10:00 em Brasília (13:00 UTC)
const now = new Date('2026-11-11T13:00:00Z');

describe('minha mesa — ordem dos itens', () => {
  it('vence hoje usa o dia de Brasília, não o UTC', () => {
    // 23:30 de Brasília ainda é hoje (02:30 UTC do dia seguinte)
    expect(urgencyOf({ prazo: '2026-11-12T02:30:00Z', atrasado: false }, now)).toBe('hoje');
    // 00:30 de Brasília do dia 12 já é amanhã
    expect(urgencyOf({ prazo: '2026-11-12T03:30:00Z', atrasado: false }, now)).toBe('com_prazo');
    expect(urgencyOf({ prazo: null, atrasado: false }, now)).toBe('sem_prazo');
    expect(urgencyOf({ prazo: null, atrasado: true }, now)).toBe('atrasado');
  });

  it('atrasado → hoje → com prazo → sem prazo, prazo mais próximo primeiro', () => {
    const items = [
      { id: 'sem', prazo: null, atrasado: false },
      { id: 'semana', prazo: new Date('2026-11-18T13:00:00Z'), atrasado: false },
      { id: 'hoje-tarde', prazo: new Date('2026-11-11T20:00:00Z'), atrasado: false },
      { id: 'atrasado-novo', prazo: new Date('2026-11-10T13:00:00Z'), atrasado: true },
      { id: 'amanha', prazo: new Date('2026-11-12T13:00:00Z'), atrasado: false },
      { id: 'hoje-cedo', prazo: new Date('2026-11-11T12:00:00Z'), atrasado: false },
      { id: 'atrasado-velho', prazo: new Date('2026-11-01T13:00:00Z'), atrasado: true },
      { id: 'sem2', prazo: null, atrasado: false },
    ];
    const sorted = sortWorkbenchItems(items, now);
    expect(sorted.map((item) => item.id)).toEqual([
      'atrasado-velho',
      'atrasado-novo',
      'hoje-cedo',
      'hoje-tarde',
      'amanha',
      'semana',
      'sem',
      'sem2',
    ]);
    expect(sorted[0].urgencia).toBe('atrasado');
    expect(sorted[7].urgencia).toBe('sem_prazo');
  });
});

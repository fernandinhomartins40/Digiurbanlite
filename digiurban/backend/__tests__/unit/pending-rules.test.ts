/**
 * Regras de pendência e análise documental (revisão de 2026-10-04).
 */
import { describe, expect, it } from '@jest/globals';
import {
  isDocumentAnalysisStage,
  parsePendingDueDate,
  pickPendingReminder,
  STALE_PENDING_DAYS,
} from '../../src/services/pending-rules';

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

describe('prazo da pendência', () => {
  it('data escolhida vale até o fim do dia no horário de Brasília', () => {
    const due = parsePendingDueDate('2026-10-10')!;
    expect(due.toISOString()).toBe('2026-10-11T02:59:59.000Z');
    // em Brasília continua sendo dia 10 (antes virava 21h do dia 9)
    const brasilia = new Date(due.getTime() - 3 * HOUR);
    expect(brasilia.getUTCDate()).toBe(10);
  });

  it('aceita data e hora completas e recusa texto inválido', () => {
    expect(parsePendingDueDate('2026-10-10T12:00:00.000Z')!.toISOString()).toBe('2026-10-10T12:00:00.000Z');
    expect(parsePendingDueDate('')).toBeUndefined();
    expect(() => parsePendingDueDate('amanhã')).toThrow('Prazo inválido');
  });
});

describe('lembretes da pendência', () => {
  const due = new Date('2026-10-10T12:00:00Z');

  it('avisa uma vez perto do prazo', () => {
    expect(pickPendingReminder(due, {}, new Date(due.getTime() - 10 * HOUR))).toBe('upcoming');
    expect(pickPendingReminder(due, { lastUpcomingReminderAt: 'x' }, new Date(due.getTime() - 2 * HOUR))).toBeNull();
    expect(pickPendingReminder(due, {}, new Date(due.getTime() - 5 * DAY))).toBeNull();
  });

  it('avisa uma vez quando vence (antes repetia 2x por dia por 30 dias)', () => {
    expect(pickPendingReminder(due, {}, new Date(due.getTime() + HOUR))).toBe('overdue');
    for (let day = 1; day < STALE_PENDING_DAYS - 3; day++) {
      expect(pickPendingReminder(due, { lastOverdueReminderAt: 'x' }, new Date(due.getTime() + day * DAY))).toBeNull();
    }
  });

  it('manda um último aviso antes do encerramento automático, só uma vez', () => {
    const nearExpiry = new Date(due.getTime() + (STALE_PENDING_DAYS - 2) * DAY);
    expect(pickPendingReminder(due, { lastOverdueReminderAt: 'x' }, nearExpiry)).toBe('final');
    expect(pickPendingReminder(due, { lastOverdueReminderAt: 'x', lastFinalReminderAt: 'y' }, nearExpiry)).toBeNull();
  });
});

describe('etapa de análise documental', () => {
  it('reconhece etapas de documentos', () => {
    expect(isDocumentAnalysisStage({ stageName: 'Análise Documental' })).toBe(true);
    expect(isDocumentAnalysisStage({ stageName: 'Conferência de documentação' })).toBe(true);
    expect(isDocumentAnalysisStage({ stageName: 'Vistoria', metadata: { requiredDocumentTypes: ['RG'] } })).toBe(true);
  });

  it('não conclui sozinha outras análises', () => {
    expect(isDocumentAnalysisStage({ stageName: 'Análise técnica' })).toBe(false);
    expect(isDocumentAnalysisStage({ stageName: 'Análise final', metadata: { requiredDocumentTypes: [] } })).toBe(false);
  });
});

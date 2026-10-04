/**
 * Regras puras de pendência e análise documental (sem banco nem fila), para
 * poderem ser testadas e reaproveitadas sem abrir conexões.
 */

/** Erro de regra (situação errada, protocolo encerrado...): vira 4xx com a mensagem */
export class PendingActionError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 409) {
    super(message);
    this.name = 'PendingActionError';
    this.statusCode = statusCode;
  }
}

/** Dias depois do prazo até a pendência sem resposta ser encerrada sozinha */
export const STALE_PENDING_DAYS = 30;
/** Último aviso ao cidadão, alguns dias antes do encerramento automático */
export const FINAL_REMINDER_DAYS_BEFORE_EXPIRY = 3;

/**
 * Prazo escolhido como data (AAAA-MM-DD) vale até o FIM daquele dia no
 * horário de Brasília. Antes virava meia-noite UTC (21h do dia anterior):
 * a tela mostrava um dia a menos e a pendência vencia antes da hora.
 */
export function parsePendingDueDate(input: unknown): Date | undefined {
  if (input === undefined || input === null || input === '') return undefined;
  if (input instanceof Date) return Number.isNaN(input.getTime()) ? undefined : input;

  const raw = String(input).trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(raw)
    ? new Date(`${raw}T23:59:59-03:00`)
    : new Date(raw);

  if (Number.isNaN(date.getTime())) {
    throw new PendingActionError('Prazo inválido', 400);
  }
  return date;
}

export type PendingReminderType = 'upcoming' | 'overdue' | 'final';

/**
 * Qual lembrete (se algum) mandar agora. Cada tipo sai UMA vez só:
 * - "upcoming": até 48h antes do prazo;
 * - "overdue": quando vence;
 * - "final": poucos dias antes do encerramento automático.
 * Antes o aviso de vencida repetia 2x por dia durante 30 dias.
 */
export function pickPendingReminder(
  dueDate: Date,
  metadata: Record<string, any>,
  now: Date = new Date(),
  upcomingWindowHours = 48
): PendingReminderType | null {
  const due = dueDate.getTime();
  const nowMs = now.getTime();
  const dayMs = 24 * 60 * 60 * 1000;

  if (nowMs >= due) {
    const finalAt = due + (STALE_PENDING_DAYS - FINAL_REMINDER_DAYS_BEFORE_EXPIRY) * dayMs;
    if (nowMs >= finalAt) {
      return metadata.lastFinalReminderAt ? null : 'final';
    }
    return metadata.lastOverdueReminderAt ? null : 'overdue';
  }

  if (due - nowMs <= upcomingWindowHours * 60 * 60 * 1000) {
    return metadata.lastUpcomingReminderAt ? null : 'upcoming';
  }

  return null;
}

/**
 * Etapa de análise de documentos = a que pede documentos ou que tem
 * "document" no nome (documental, documentos, documentação).
 * Antes bastava ter "análise" no nome: uma "Análise técnica" era concluída
 * sozinha quando os documentos eram aprovados.
 */
export function isDocumentAnalysisStage(stage: { stageName: string; metadata?: unknown }): boolean {
  const metadata = stage.metadata && typeof stage.metadata === 'object'
    ? stage.metadata as Record<string, unknown>
    : {};
  if (Array.isArray(metadata.requiredDocumentTypes) && metadata.requiredDocumentTypes.length > 0) {
    return true;
  }
  const name = stage.stageName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return name.includes('document');
}


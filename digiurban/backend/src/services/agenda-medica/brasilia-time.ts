/**
 * Horário da agenda de saúde = horário de Brasília, seja qual for o relógio do
 * servidor (em produção ele roda em UTC). Antes as contas usavam a hora local
 * do servidor: consulta das 08:00 aparecia às 05:00 na tela e o horário
 * ocupado continuava aparecendo como livre.
 */

const OFFSET = '-03:00';
const OFFSET_MS = 3 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

/** Dia (YYYY-MM-DD) em Brasília de um instante. */
export function brasiliaDayKey(date: Date): string {
  return new Date(date.getTime() - OFFSET_MS).toISOString().slice(0, 10);
}

/** Começo e fim (exclusivo) do dia em Brasília. */
export function brasiliaDayBounds(dayKey: string): { start: Date; end: Date } {
  const start = new Date(`${dayKey}T00:00:00${OFFSET}`);
  return { start, end: new Date(start.getTime() + DAY_MS) };
}

/** Dia da semana (0 = domingo) de um dia do calendário. */
export function weekDayOf(dayKey: string): number {
  return new Date(`${dayKey}T12:00:00Z`).getUTCDay();
}

/** Instante de "HH:mm" num dia, em Brasília. */
export function brasiliaAt(dayKey: string, hhmm: string): Date {
  return new Date(`${dayKey}T${hhmm}:00${OFFSET}`);
}

/** Texto de data/hora vindo da tela: sem fuso = horário de Brasília. */
export function parseBrasiliaDateTime(value: string | Date): Date {
  if (value instanceof Date) return value;
  const text = String(value).trim();
  if (/(Z|[+-]\d{2}:?\d{2})$/i.test(text)) return new Date(text);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return new Date(`${text}T12:00:00${OFFSET}`);
  return new Date(`${text.length === 16 ? `${text}:00` : text}${OFFSET}`);
}

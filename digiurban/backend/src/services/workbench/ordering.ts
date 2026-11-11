/**
 * Minha mesa — regra pura de urgência e ordenação dos itens.
 * Ordem: atrasado → vence hoje (dia de Brasília) → com prazo → sem prazo;
 * dentro de cada grupo, o prazo mais próximo primeiro (estável para empates).
 */

import { brasiliaDayKey } from '../agenda-medica/brasilia-time';

export type WorkbenchUrgency = 'atrasado' | 'hoje' | 'com_prazo' | 'sem_prazo';

const RANK: Record<WorkbenchUrgency, number> = { atrasado: 0, hoje: 1, com_prazo: 2, sem_prazo: 3 };

export function urgencyOf(item: { prazo: Date | string | null; atrasado: boolean }, now = new Date()): WorkbenchUrgency {
  if (item.atrasado) return 'atrasado';
  if (!item.prazo) return 'sem_prazo';
  return brasiliaDayKey(new Date(item.prazo)) === brasiliaDayKey(now) ? 'hoje' : 'com_prazo';
}

export function sortWorkbenchItems<T extends { prazo: Date | string | null; atrasado: boolean }>(
  items: T[],
  now = new Date()
): Array<T & { urgencia: WorkbenchUrgency }> {
  const time = (value: Date | string | null) => (value ? new Date(value).getTime() : Number.POSITIVE_INFINITY);
  return items
    .map((item, index) => ({ item: { ...item, urgencia: urgencyOf(item, now) }, index }))
    .sort(
      (a, b) =>
        RANK[a.item.urgencia] - RANK[b.item.urgencia] ||
        time(a.item.prazo) - time(b.item.prazo) ||
        a.index - b.index
    )
    .map(({ item }) => item);
}

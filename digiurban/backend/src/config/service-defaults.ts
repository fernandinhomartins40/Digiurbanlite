/**
 * Prazo padrão (dias úteis) para serviço sem prazo definido.
 * Um valor só — antes cada caminho usava o seu (3, 7, 10 ou 30 dias) e o
 * mesmo serviço tinha prazos diferentes no fluxo e no SLA.
 */
export const DEFAULT_SERVICE_DAYS = 10;

export function serviceDays(estimatedDays: number | null | undefined): number {
  const days = Number(estimatedDays);
  return Number.isFinite(days) && days > 0 ? Math.round(days) : DEFAULT_SERVICE_DAYS;
}

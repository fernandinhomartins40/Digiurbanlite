// Score de confiabilidade do resultado de pesquisa (0.0 – 1.0)
// Leva em conta: quantidade de registros, fonte e recência

const SOURCE_WEIGHTS: Record<string, number> = {
  pncp: 1.0,
  comprasnet: 0.95,
  bps: 0.90,
  transparencia: 0.85,
  fnde: 0.80,
};

export interface ConfidenceInput {
  source: string;
  contractDate?: Date | null;
  count?: number;
}

export function calculateConfidenceScore(input: ConfidenceInput): number {
  const { source, contractDate, count = 1 } = input;

  // Peso por fonte
  const sourceWeight = SOURCE_WEIGHTS[source] ?? 0.75;

  // Peso por recência
  let recenciaWeight = 1.0;
  if (contractDate) {
    const daysOld = Math.floor((Date.now() - contractDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysOld > 730) recenciaWeight = 0.7;
    else if (daysOld > 365) recenciaWeight = 0.9;
    else recenciaWeight = 1.0;
  }

  // Peso por quantidade (diminui incerteza estatística)
  const countWeight = Math.min(1.0, Math.log10(count + 1) / 2);

  const score = Math.min(1.0, sourceWeight * recenciaWeight * (0.5 + 0.5 * countWeight));
  return Math.round(score * 100) / 100;
}

// Calcula confiabilidade agregada de um conjunto de resultados
export function calculateAggregateConfidence(
  count: number,
  sources: string[],
  avgDaysOld?: number,
): number {
  if (count === 0) return 0;

  // Melhor fonte disponível
  const bestSourceWeight = sources.reduce((best, s) => {
    return Math.max(best, SOURCE_WEIGHTS[s] ?? 0.75);
  }, 0);

  // Peso de recência
  let recenciaWeight = 1.0;
  if (avgDaysOld !== undefined) {
    if (avgDaysOld > 730) recenciaWeight = 0.7;
    else if (avgDaysOld > 365) recenciaWeight = 0.9;
  }

  // Peso de volume (log10 cresce lento — 10 registros = 50%, 100 = 100%)
  const volumeWeight = Math.min(1.0, Math.log10(count + 1) / 2);

  return Math.round(Math.min(1.0, bestSourceWeight * recenciaWeight * volumeWeight) * 100) / 100;
}

export function describeConfidence(score: number): string {
  if (score >= 0.85) return 'Alta';
  if (score >= 0.65) return 'Média';
  if (score >= 0.40) return 'Baixa';
  return 'Muito baixa';
}

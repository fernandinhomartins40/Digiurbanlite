import { config } from '../config/config';

export interface StatisticsInput {
  values: number[];
  outlierMethod?: 'IQR' | 'ZSCORE';
  iqrK?: number;
  zscoreThreshold?: number;
}

export interface StatisticsResult {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  q1: number;
  q3: number;
  iqr: number;
  lowerFence: number;
  upperFence: number;
  validValues: number[];
  outliers: number[];
  excludedCount: number;
  methodology: string;
}

export function calculateStatistics(input: StatisticsInput): StatisticsResult | null {
  const { values, outlierMethod = config.outlier.method, iqrK = config.outlier.iqrK } = input;

  const positiveValues = values.filter((v) => v > 0 && isFinite(v));
  if (positiveValues.length === 0) return null;

  const sorted = [...positiveValues].sort((a, b) => a - b);
  const n = sorted.length;

  const q1 = percentile(sorted, 25);
  const q3 = percentile(sorted, 75);
  const iqr = q3 - q1;

  let validValues: number[];
  let outliers: number[];
  let lowerFence: number;
  let upperFence: number;

  if (outlierMethod === 'IQR') {
    lowerFence = q1 - iqrK * iqr;
    upperFence = q3 + iqrK * iqr;
    validValues = sorted.filter((v) => v >= lowerFence && v <= upperFence);
    outliers = sorted.filter((v) => v < lowerFence || v > upperFence);
  } else {
    // Z-score
    const meanAll = sorted.reduce((a, b) => a + b, 0) / n;
    const stdAll = Math.sqrt(sorted.reduce((a, b) => a + (b - meanAll) ** 2, 0) / n);
    const threshold = input.zscoreThreshold ?? config.outlier.zscoreThreshold;
    validValues = sorted.filter((v) => Math.abs((v - meanAll) / stdAll) <= threshold);
    outliers = sorted.filter((v) => Math.abs((v - meanAll) / stdAll) > threshold);
    lowerFence = meanAll - threshold * stdAll;
    upperFence = meanAll + threshold * stdAll;
  }

  if (validValues.length === 0) {
    // Se filtrou tudo, usa valores originais
    validValues = sorted;
    outliers = [];
  }

  const mean = validValues.reduce((a, b) => a + b, 0) / validValues.length;
  const median = percentile(validValues, 50);
  const stdDev = Math.sqrt(
    validValues.reduce((a, b) => a + (b - mean) ** 2, 0) / validValues.length,
  );

  const methodology =
    outlierMethod === 'IQR'
      ? `Método IQR (k=${iqrK}): removidos valores fora de [Q1 - ${iqrK}×IQR, Q3 + ${iqrK}×IQR]. ` +
        `Faixa válida: R$ ${lowerFence.toFixed(2)} — R$ ${upperFence.toFixed(2)}.`
      : `Método Z-score (threshold=${input.zscoreThreshold ?? config.outlier.zscoreThreshold}): removidos valores com |z| > threshold.`;

  return {
    count: validValues.length,
    mean: round2(mean),
    median: round2(median),
    min: round2(Math.min(...validValues)),
    max: round2(Math.max(...validValues)),
    stdDev: round2(stdDev),
    q1: round2(q1),
    q3: round2(q3),
    iqr: round2(iqr),
    lowerFence: round2(lowerFence),
    upperFence: round2(upperFence),
    validValues,
    outliers,
    excludedCount: outliers.length,
    methodology,
  };
}

function percentile(sortedArr: number[], p: number): number {
  if (sortedArr.length === 0) return 0;
  const index = (p / 100) * (sortedArr.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return sortedArr[lower];
  return sortedArr[lower] + (sortedArr[upper] - sortedArr[lower]) * (index - lower);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

// Formatar resultado em texto legível
export function formatStatisticsExplanation(stats: StatisticsResult, query: string): string {
  return (
    `Pesquisa de preços para: "${query}"\n` +
    `Registros analisados: ${stats.count + stats.excludedCount}\n` +
    `Registros válidos (após remoção de outliers): ${stats.count}\n` +
    `Registros excluídos (outliers): ${stats.excludedCount}\n` +
    `\nEstatísticas (valores válidos):\n` +
    `  Preço médio:    R$ ${stats.mean.toFixed(2)}\n` +
    `  Preço mediano:  R$ ${stats.median.toFixed(2)}\n` +
    `  Menor preço:    R$ ${stats.min.toFixed(2)}\n` +
    `  Maior preço:    R$ ${stats.max.toFixed(2)}\n` +
    `  Desvio padrão:  R$ ${stats.stdDev.toFixed(2)}\n` +
    `  Q1 (25%):       R$ ${stats.q1.toFixed(2)}\n` +
    `  Q3 (75%):       R$ ${stats.q3.toFixed(2)}\n` +
    `\nMetodologia: ${stats.methodology}`
  );
}

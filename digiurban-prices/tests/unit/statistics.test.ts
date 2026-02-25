import { calculateStatistics, formatStatisticsExplanation } from '../../src/services/statistics.service';

describe('calculateStatistics', () => {
  const sampleValues = [100, 110, 105, 108, 102, 98, 500, 2, 107, 103];

  it('deve calcular média corretamente', () => {
    const values = [100, 200, 300];
    const result = calculateStatistics({ values });
    expect(result).not.toBeNull();
    expect(result!.mean).toBe(200);
  });

  it('deve calcular mediana corretamente', () => {
    const values = [10, 20, 30, 40, 50];
    const result = calculateStatistics({ values });
    expect(result!.median).toBe(30);
  });

  it('deve remover outliers com IQR', () => {
    const result = calculateStatistics({
      values: sampleValues,
      outlierMethod: 'IQR',
      iqrK: 1.5,
    });
    expect(result).not.toBeNull();
    // 500 deve ser outlier
    expect(result!.outliers).toContain(500);
    // 2 pode ser outlier
    expect(result!.validValues).not.toContain(500);
  });

  it('deve retornar null para array vazio', () => {
    expect(calculateStatistics({ values: [] })).toBeNull();
  });

  it('deve retornar null para array com todos zeros', () => {
    expect(calculateStatistics({ values: [0, 0, 0] })).toBeNull();
  });

  it('deve calcular Q1 e Q3', () => {
    const values = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const result = calculateStatistics({ values });
    expect(result!.q1).toBeDefined();
    expect(result!.q3).toBeDefined();
    expect(result!.q3).toBeGreaterThan(result!.q1);
  });

  it('deve incluir contagem de excluídos', () => {
    const result = calculateStatistics({
      values: sampleValues,
      outlierMethod: 'IQR',
      iqrK: 1.5,
    });
    expect(result!.excludedCount).toBeGreaterThanOrEqual(1);
    expect(result!.count + result!.excludedCount).toBe(sampleValues.filter(v => v > 0).length);
  });

  it('deve remover outliers com Z-Score', () => {
    const result = calculateStatistics({
      values: sampleValues,
      outlierMethod: 'ZSCORE',
      zscoreThreshold: 2.0,
    });
    expect(result).not.toBeNull();
    expect(result!.outliers).toContain(500);
  });

  it('deve calcular desvio padrão', () => {
    const values = [10, 20, 30];
    const result = calculateStatistics({ values });
    expect(result!.stdDev).toBeGreaterThan(0);
  });
});

describe('formatStatisticsExplanation', () => {
  it('deve gerar texto com informações de metodologia', () => {
    const stats = calculateStatistics({ values: [100, 200, 300] });
    const text = formatStatisticsExplanation(stats!, 'computador');
    expect(text).toContain('computador');
    expect(text).toContain('R$');
    expect(text).toContain('Metodologia');
  });
});

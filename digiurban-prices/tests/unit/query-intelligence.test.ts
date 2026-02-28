import {
  buildQueryIntelligence,
  lexicalIntentScore,
  shouldKeepSearchHit,
} from '../../src/services/query-intelligence.service';

describe('query-intelligence lexical ranking', () => {
  it('prioriza descricao direta e descarta match incidental para item simples', () => {
    const query = buildQueryIntelligence('vassoura');

    const directDescription = 'VASSOURA TIPO CAIPIRA AMARELA COM CABO';
    const incidentalDescription = 'KIT LIMPEZA INFANTIL COMPOSTO POR RODO PA E VASSOURA EM MATERIAL PLASTICO';

    const directScore = lexicalIntentScore(query, directDescription);
    const incidentalScore = lexicalIntentScore(query, incidentalDescription);

    expect(directScore).toBeGreaterThan(incidentalScore);
    expect(shouldKeepSearchHit(query, directDescription, directScore)).toBe(true);
    expect(shouldKeepSearchHit(query, incidentalDescription, incidentalScore)).toBe(false);
  });

  it('remove item sem qualquer sinal lexical do termo buscado', () => {
    const query = buildQueryIntelligence('vassoura');
    const unrelatedDescription = 'RODO DE BORRACHA 40CM COM CABO DE MADEIRA';

    expect(lexicalIntentScore(query, unrelatedDescription)).toBe(0);
    expect(shouldKeepSearchHit(query, unrelatedDescription)).toBe(false);
  });
});

/**
 * Fluxos de contratação (Lei 14.133/2021) no processo interno.
 */

jest.mock('../../src/lib/prisma', () => ({ prisma: {} }));

import { DISPENSA_LIMITS, dispensaLimitWarning, FLOWS, missingForStage } from '../../src/services/internal-process/flows/flows';
import { DOCUMENT_TEMPLATES, fillTemplate } from '../../src/services/internal-process/flows/templates';

const ctx = {
  municipio: 'Prefeitura de Teste',
  cidade: 'Teste',
  unidade: 'Setor de Compras',
  numero: 'LIC-2026-00001',
  objeto: 'Aquisição de material de escritório',
  responsavel: 'Maria',
  cargo: 'Agente de contratação',
  flowKey: 'LICITACAO',
  fields: { valorEstimado: 50000, modalidade: 'Pregão', criterio: 'Menor preço' },
};

describe('fluxos da Lei 14.133', () => {
  it('todo documento citado nas etapas tem modelo', () => {
    for (const flow of Object.values(FLOWS)) {
      for (const stage of flow.stages) {
        for (const key of [...stage.requiredDocs, ...(stage.signedDocs || []), ...(stage.optionalDocs || [])]) {
          expect({ flow: flow.key, stage: stage.key, key, exists: Boolean(DOCUMENT_TEMPLATES[key]) }).toEqual({ flow: flow.key, stage: stage.key, key, exists: true });
        }
        expect(stage.legal).toMatch(/Art/);
        expect(stage.days).toBeGreaterThan(0);
      }
      const keys = flow.stages.map((stage) => stage.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
  });

  it('licitação segue as fases do art. 17 na ordem', () => {
    const keys = FLOWS.LICITACAO.stages.map((stage) => stage.key);
    const order = ['ESTUDO_TECNICO', 'PARECER_JURIDICO', 'DIVULGACAO', 'SESSAO', 'HABILITACAO', 'RECURSOS', 'HOMOLOGACAO', 'CONTRATO'];
    const positions = order.map((key) => keys.indexOf(key));
    expect(positions.every((position) => position >= 0)).toBe(true);
    expect([...positions].sort((a, b) => a - b)).toEqual(positions);
  });

  it('modelos saem preenchidos, sem {{campo}} sobrando', () => {
    for (const template of Object.values(DOCUMENT_TEMPLATES)) {
      for (const flowKey of ['LICITACAO', 'DISPENSA', 'INEXIGIBILIDADE']) {
        const text = fillTemplate(template, { ...ctx, flowKey });
        expect({ key: template.key, leftover: text.match(/\{\{\w+\}\}/g) }).toEqual({ key: template.key, leftover: null });
      }
    }
    expect(fillTemplate(DOCUMENT_TEMPLATES.DFD, ctx)).toContain('R$ 50.000,00');
  });

  it('só avança a etapa com os documentos feitos e assinados', () => {
    const stage = FLOWS.LICITACAO.stages[0];
    expect(missingForStage(stage, [])).toEqual(['documento: DFD']);
    expect(missingForStage(stage, [{ templateKey: 'DFD', signedAt: null }])).toEqual(['assinatura: DFD']);
    expect(missingForStage(stage, [{ templateKey: 'DFD', signedAt: new Date() }])).toEqual([]);
  });

  it('avisa quando a dispensa por valor passa do limite do Decreto 12.807/2025', () => {
    expect(DISPENSA_LIMITS.outros).toBe(65492.11);
    expect(DISPENSA_LIMITS.obrasEngenharia).toBe(130984.2);
    expect(dispensaLimitWarning({ hipotese: 'Art. 75, II — outras compras', valorEstimado: 70000 })).toMatch(/limite/);
    expect(dispensaLimitWarning({ hipotese: 'Art. 75, II — outras compras', valorEstimado: 60000 })).toBeNull();
    expect(dispensaLimitWarning({ hipotese: 'Art. 75, I — obras', valorEstimado: 120000 })).toBeNull();
    expect(dispensaLimitWarning({ hipotese: 'Art. 75, VIII — emergência', valorEstimado: 900000 })).toBeNull();
  });
});

/**
 * Fluxos de contratação (Lei 14.133/2021) no processo interno.
 */

jest.mock('../../src/lib/prisma', () => ({ prisma: {} }));

import { DISPENSA_LIMITS, dispensaLimitWarning, FLOWS, missingForStage, previousStage, resolveFlow, stageRoute, stageUnitId, flowBaseKey } from '../../src/services/internal-process/flows/flows';
import { FLOW_ROLES, suggestRoleUnits } from '../../src/services/internal-process/flows/roles';
import { buildCustomFlow, CustomFlowError, flowTotalDays } from '../../src/services/internal-process/flows/custom-flow';
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
        expect(FLOW_ROLES[stage.role]).toBeDefined();
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
      for (const flowKey of ['LICITACAO', 'REGISTRO_PRECOS', 'DISPENSA', 'INEXIGIBILIDADE', 'ADESAO_ATA']) {
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

  it('registro de preços tem IRP no começo e ata no fim; adesão pede aceite do gerenciador', () => {
    const srp = FLOWS.REGISTRO_PRECOS.stages.map((stage) => stage.key);
    expect(srp[1]).toBe('INTENCAO_REGISTRO');
    expect(srp[srp.length - 1]).toBe('ATA');
    expect(srp).not.toContain('ORCAMENTO');
    const adesao = FLOWS.ADESAO_ATA.stages.map((stage) => stage.key);
    expect(adesao.indexOf('JUSTIFICATIVA_ADESAO')).toBeLessThan(adesao.indexOf('ACEITE_ADESAO'));
    expect(fillTemplate(DOCUMENT_TEMPLATES.AUTORIZACAO, { ...ctx, flowKey: 'ADESAO_ATA', fields: { ata: 'Ata nº 5/2026 do Consórcio X' } })).toContain('adesão à Ata nº 5/2026');
    expect(fillTemplate(DOCUMENT_TEMPLATES.AVISO_IRP, { ...ctx, flowKey: 'REGISTRO_PRECOS', fields: { participantes: [{ id: 'u1', nome: 'Secretaria de Saúde' }] } })).toContain('Secretaria de Saúde');
  });
});

describe('quem faz cada etapa', () => {
  it('a unidade que pediu é a de origem; os outros papéis usam a unidade ligada', () => {
    expect(stageUnitId({ role: 'DEMANDANTE' }, 'origem', { JURIDICO: 'jur' })).toBe('origem');
    expect(stageUnitId({ role: 'JURIDICO' }, 'origem', { JURIDICO: 'jur' })).toBe('jur');
    expect(stageUnitId({ role: 'COMPRAS' }, 'origem', { JURIDICO: 'jur' })).toBeNull();
  });

  it('destino com pessoa: etapa fixa > unidade que pediu > papel (com o servidor)', () => {
    const roles = { JURIDICO: { unitId: 'jur', unitName: 'Procuradoria', userId: 'ana', userName: 'Ana' } };
    const origin = { id: 'origem', name: 'Saúde' };
    expect(stageRoute({ role: 'JURIDICO' }, origin, roles)).toEqual({ unitId: 'jur', unitName: 'Procuradoria', userId: 'ana', userName: 'Ana' });
    expect(stageRoute({ role: 'DEMANDANTE' }, origin, roles)).toEqual({ unitId: 'origem', unitName: 'Saúde', userId: null, userName: null });
    expect(stageRoute({ role: 'JURIDICO', unitId: 'gab', unitName: 'Gabinete', userId: 'pref', userName: 'Prefeito' }, origin, roles)?.userId).toBe('pref');
    expect(stageRoute({ role: 'COMPRAS' }, origin, roles)).toBeNull();
  });

  it('sugere a unidade pelo nome, preferindo a mais específica', () => {
    const suggestion = suggestRoleUnits([
      { id: 'adm', nome: 'Secretaria de Administração', nivel: 1, competencias: ['compras e licitações'] },
      { id: 'cmp', nome: 'Departamento de Compras', nivel: 2 },
      { id: 'lic', nome: 'Divisão de Licitações e Contratos', nivel: 2 },
      { id: 'jur', nome: 'Procuradoria Geral do Município', nivel: 1 },
      { id: 'fin', nome: 'Secretaria Municipal de Finanças', nivel: 1 },
      { id: 'gab', nome: 'Gabinete do Prefeito', nivel: 1 },
      { id: 'esc', nome: 'Escola Municipal Ola Mundo', nivel: 3 },
    ]);
    expect(suggestion).toMatchObject({ COMPRAS: 'cmp', LICITACAO: 'lic', CONTRATOS: 'lic', JURIDICO: 'jur', FINANCAS: 'fin', AUTORIDADE: 'gab' });
    expect(suggestion.CONTROLE_INTERNO).toBeUndefined();
  });

  it('devolver volta uma etapa (não antes da primeira)', () => {
    const flow = FLOWS.DISPENSA;
    expect(previousStage(flow, flow.stages[0].key)).toBeNull();
    expect(previousStage(flow, flow.stages[2].key)?.key).toBe(flow.stages[1].key);
  });
});

describe('fluxo próprio do município', () => {
  const base = {
    name: 'Compra pequena da Saúde',
    baseKey: 'DISPENSA',
    stages: [
      { name: 'Pedido', role: 'DEMANDANTE', days: 2, requiredDocs: ['DFD', 'NAO_EXISTE'], signedDocs: ['DFD', 'ETP'], checklist: ['Descrever', '', 'Quantidade'] },
      { name: 'Jurídico', role: 'JURIDICO', days: 999, requiredDocs: ['PARECER_JURIDICO'], optionalDocs: ['PARECER_JURIDICO', 'DOCUMENTO_LIVRE'] },
    ],
  };

  it('limpa o que vem da tela', () => {
    const flow = buildCustomFlow(base);
    expect(flow.key).toBe('CUSTOM');
    expect(flowBaseKey(flow)).toBe('DISPENSA');
    expect(flow.stages[0].requiredDocs).toEqual(['DFD']);
    expect(flow.stages[0].signedDocs).toEqual(['DFD']);
    expect(flow.stages[0].checklist).toEqual(['Descrever', 'Quantidade']);
    expect(flow.stages[1].days).toBe(90);
    expect(flow.stages[1].optionalDocs).toEqual(['DOCUMENTO_LIVRE']);
    expect(flow.stages[1].owner).toBe(FLOW_ROLES.JURIDICO.name);
    expect(new Set(flow.stages.map((stage) => stage.key)).size).toBe(2);
    expect(flowTotalDays(flow)).toBe(92);
    expect(resolveFlow({ flowKey: 'CUSTOM', flowSnapshot: flow })?.name).toBe('Compra pequena da Saúde');
    expect(resolveFlow({ flowKey: 'LICITACAO', flowSnapshot: null })?.key).toBe('LICITACAO');
  });

  it('recusa fluxo sem nome, sem etapas ou com papel inválido', () => {
    expect(() => buildCustomFlow({ ...base, name: '' })).toThrow(CustomFlowError);
    expect(() => buildCustomFlow({ ...base, stages: [] })).toThrow(/pelo menos uma etapa/);
    expect(() => buildCustomFlow({ ...base, stages: [{ name: 'Etapa', role: 'QUALQUER' }] })).toThrow(/quem faz/);
  });
});

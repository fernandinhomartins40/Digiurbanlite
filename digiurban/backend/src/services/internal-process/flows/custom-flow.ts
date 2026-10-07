/**
 * Fluxo próprio do município: copiado de um fluxo pronto (ou do zero) e
 * ajustado numa tela simples — etapas, quem faz (papel), prazo e documentos.
 * Aqui só a validação (regra pura, testável): o que vem da tela vira um
 * FlowDefinition seguro, ou um erro em português.
 */

import { FlowDefinition, FlowKey, FlowStage, FLOWS } from './flows';
import { FLOW_ROLES, isFlowRole } from './roles';
import { DOCUMENT_TEMPLATES } from './templates';

export class CustomFlowError extends Error {}

const text = (value: unknown, max: number) => String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);

const docList = (value: unknown): string[] =>
  Array.isArray(value) ? [...new Set(value.map(String).filter((key) => key in DOCUMENT_TEMPLATES))] : [];

export function buildCustomFlow(input: { name?: unknown; baseKey?: unknown; stages?: unknown }): FlowDefinition {
  const name = text(input.name, 80);
  if (name.length < 3) throw new CustomFlowError('Dê um nome ao fluxo.');
  const baseKey = typeof input.baseKey === 'string' && input.baseKey in FLOWS ? (input.baseKey as FlowKey) : null;
  const rawStages = Array.isArray(input.stages) ? input.stages : [];
  if (rawStages.length === 0) throw new CustomFlowError('O fluxo precisa de pelo menos uma etapa.');
  if (rawStages.length > 30) throw new CustomFlowError('No máximo 30 etapas.');

  const usedKeys = new Set<string>();
  const stages: FlowStage[] = rawStages.map((raw: any, index: number) => {
    const stageName = text(raw?.name, 80);
    if (stageName.length < 3) throw new CustomFlowError(`Dê um nome à etapa ${index + 1}.`);
    if (!isFlowRole(raw?.role)) throw new CustomFlowError(`Escolha quem faz a etapa "${stageName}".`);
    let key = typeof raw?.key === 'string' && /^[A-Z0-9_]{2,40}$/.test(raw.key) ? raw.key : `ETAPA_${index + 1}`;
    while (usedKeys.has(key)) key = `${key}_${index + 1}`;
    usedKeys.add(key);
    const requiredDocs = docList(raw?.requiredDocs);
    const signedDocs = docList(raw?.signedDocs).filter((doc) => requiredDocs.includes(doc));
    const optionalDocs = docList(raw?.optionalDocs).filter((doc) => !requiredDocs.includes(doc));
    const checklist = (Array.isArray(raw?.checklist) ? raw.checklist : String(raw?.checklist || '').split('\n'))
      .map((item: unknown) => text(item, 200))
      .filter(Boolean)
      .slice(0, 15);
    const days = Math.round(Number(raw?.days));
    return {
      key,
      name: stageName,
      legal: text(raw?.legal, 120),
      description: text(raw?.description, 500),
      checklist,
      requiredDocs,
      signedDocs,
      optionalDocs,
      days: Number.isFinite(days) ? Math.min(90, Math.max(1, days)) : 5,
      owner: FLOW_ROLES[raw.role as keyof typeof FLOW_ROLES].name,
      role: raw.role,
    };
  });

  return {
    key: 'CUSTOM',
    baseKey,
    name,
    prefix: '',
    description: text((input as any).description, 300),
    stages,
  };
}

/** Prazo total sugerido (soma das etapas) para o prazo do processo */
export function flowTotalDays(flow: Pick<FlowDefinition, 'stages'>): number {
  return Math.min(365, Math.max(1, flow.stages.reduce((sum, stage) => sum + (stage.days || 0), 0)));
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_WORKFLOW_TAB_MAP: Record<string, string> = {
  generated: 'documentos-gerados',
  'document-generation': 'documentos-gerados',
  send: 'enviar',
  documents: 'documentos',
  communication: 'comunicacao',
  involved: 'envolvidos',
  location: 'dados',
  photos: 'documentos'
};

const VALID_WORKFLOW_TABS = new Set([
  'resumo',
  'documentos',
  'dados',
  'pendencias',
  'comunicacao',
  'payment',
  'resumo-final',
  'documentos-gerados',
  'enviar',
  'timeline',
  'envolvidos',
  'atribuicoes'
]);

const VALID_WORKFLOW_STAGE_ACTIONS = new Set([
  'APPROVE',
  'REJECT',
  'CREATE_PENDING',
  'REQUEST_INFO',
  'SKIP'
]);

function normalizeWorkflowTab(tab: unknown): string | null {
  if (typeof tab !== 'string') return null;
  const trimmed = tab.trim();
  if (!trimmed) return null;
  return LEGACY_WORKFLOW_TAB_MAP[trimmed] || trimmed;
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const result: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (typeof item !== 'string') continue;
    const normalized = item.trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(normalized);
  }

  return result;
}

function parseJsonObject(value: unknown): Record<string, any> | null {
  if (!value) return null;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }
  return typeof value === 'object' ? (value as Record<string, any>) : null;
}

function extractServiceFieldIds(service: { formSchema?: unknown; formFieldsConfig?: unknown }): Set<string> {
  const fieldIds = new Set<string>();
  const formSchema = parseJsonObject(service.formSchema);
  const properties =
    formSchema &&
    typeof formSchema.properties === 'object' &&
    formSchema.properties !== null
      ? (formSchema.properties as Record<string, unknown>)
      : {};

  for (const fieldId of Object.keys(properties)) {
    if (fieldId.trim()) fieldIds.add(fieldId.trim());
  }

  const formFieldsConfig = Array.isArray(service.formFieldsConfig) ? service.formFieldsConfig : [];
  for (const field of formFieldsConfig) {
    if (!field || typeof field !== 'object') continue;
    const record = field as Record<string, any>;
    const rawId = record.id ?? record.key ?? record.name;
    const fieldId = typeof rawId === 'string' ? rawId.trim() : '';
    if (fieldId) fieldIds.add(fieldId);
  }

  return fieldIds;
}

function getStageRequiredInputs(stage: Record<string, any>): string[] {
  return normalizeStringArray(stage.requiredInputFieldIds ?? []);
}

function getStageRequiredOutputs(stage: Record<string, any>): string[] {
  return normalizeStringArray(stage.requiredStageOutputs ?? []);
}

async function main() {
  const services = await prisma.serviceSimplified.findMany({
    select: {
      id: true,
      name: true,
      moduleType: true,
      formSchema: true,
      formFieldsConfig: true
    }
  });

  const workflows = await prisma.serviceWorkflow.findMany({
    select: {
      id: true,
      name: true,
      serviceId: true,
      stages: true
    }
  });

  const servicesById = new Map(services.map(service => [service.id, service]));
  const errors: string[] = [];
  let checkedStages = 0;

  for (const workflow of workflows) {
    const service = servicesById.get(workflow.serviceId);
    if (!service) {
      errors.push(`Workflow ${workflow.id} (${workflow.name}) referencia serviço inexistente ${workflow.serviceId}`);
      continue;
    }

    const stages = Array.isArray(workflow.stages) ? (workflow.stages as Record<string, any>[]) : [];
    const serviceFieldIds = extractServiceFieldIds(service);

    for (const stage of stages) {
      checkedStages += 1;
      const stageName = typeof stage.name === 'string' && stage.name ? stage.name : 'Sem nome';
      const requiredInputs = getStageRequiredInputs(stage || {});
      const invalidInputs = requiredInputs.filter(fieldId => !serviceFieldIds.has(fieldId));
      if (invalidInputs.length > 0) {
        errors.push(
          `Workflow "${workflow.name}" / etapa "${stageName}" possui campos inválidos: ${invalidInputs.join(', ')}`
        );
      }

      const rawTabs = Array.isArray(stage.availableTabs) ? stage.availableTabs : [];
      const normalizedTabs = rawTabs
        .map(normalizeWorkflowTab)
        .filter((tab): tab is string => Boolean(tab));

      const invalidTabs = normalizedTabs.filter(tab => !VALID_WORKFLOW_TABS.has(tab));
      if (invalidTabs.length > 0) {
        errors.push(
          `Workflow "${workflow.name}" / etapa "${stageName}" possui abas inválidas: ${invalidTabs.join(', ')}`
        );
      }

      const legacyTabs = rawTabs.filter(
        (tab): tab is string =>
          typeof tab === 'string' && Boolean(LEGACY_WORKFLOW_TAB_MAP[tab.trim()])
      );
      if (legacyTabs.length > 0) {
        errors.push(
          `Workflow "${workflow.name}" / etapa "${stageName}" ainda usa abas legadas: ${legacyTabs.join(', ')}`
        );
      }

      const primaryTab = normalizeWorkflowTab(stage.primaryTab);
      if (primaryTab && normalizedTabs.length > 0 && !normalizedTabs.includes(primaryTab)) {
        errors.push(
          `Workflow "${workflow.name}" / etapa "${stageName}" possui primaryTab fora das abas disponíveis: ${primaryTab}`
        );
      }

      const allowedActions = normalizeStringArray(stage.allowedActions ?? []);
      const invalidActions = allowedActions.filter(action => !VALID_WORKFLOW_STAGE_ACTIONS.has(action));
      if (invalidActions.length > 0) {
        errors.push(
          `Workflow "${workflow.name}" / etapa "${stageName}" possui ações inválidas: ${invalidActions.join(', ')}`
        );
      }

      const requiredOutputs = getStageRequiredOutputs(stage || {});
      const stageType = typeof stage.stageType === 'string' ? stage.stageType.trim() : '';
      const isConclusionStage = stageType === 'CONCLUSION';
      const isGenerationStage = stageType === 'DOCUMENT_GENERATION';

      if (requiredOutputs.length > 0 && !normalizedTabs.includes('resumo')) {
        errors.push(
          `Workflow "${workflow.name}" / etapa "${stageName}" exige saídas obrigatórias sem incluir a aba resumo`
        );
      }

      if (isGenerationStage && !normalizedTabs.includes('documentos-gerados')) {
        errors.push(
          `Workflow "${workflow.name}" / etapa "${stageName}" é DOCUMENT_GENERATION mas não expõe a aba documentos-gerados`
        );
      }

      if (
        isConclusionStage &&
        rawTabs.some((tab): tab is string => typeof tab === 'string' && tab.trim() === 'document-generation')
      ) {
        errors.push(
          `Workflow "${workflow.name}" / etapa "${stageName}" de conclusão ainda referencia document-generation`
        );
      }
    }
  }

  console.log(`Workflows verificados: ${workflows.length}`);
  console.log(`Etapas verificadas: ${checkedStages}`);
  console.log(`Erros de alinhamento: ${errors.length}`);

  if (errors.length > 0) {
    for (const error of errors.slice(0, 100)) {
      console.error(`- ${error}`);
    }
    if (errors.length > 100) {
      console.error(`... e mais ${errors.length - 100} erro(s)`);
    }
    process.exitCode = 1;
  }
}

main()
  .catch(error => {
    console.error('Falha na validação de alinhamento de workflows:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

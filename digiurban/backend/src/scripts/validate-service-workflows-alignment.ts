import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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
      const requiredInputs = getStageRequiredInputs(stage || {});
      const invalidInputs = requiredInputs.filter(fieldId => !serviceFieldIds.has(fieldId));
      if (invalidInputs.length > 0) {
        const stageName = typeof stage.name === 'string' && stage.name ? stage.name : 'Sem nome';
        errors.push(
          `Workflow "${workflow.name}" / etapa "${stageName}" possui campos inválidos: ${invalidInputs.join(', ')}`
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

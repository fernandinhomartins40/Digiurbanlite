import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { prisma } from '../lib/prisma';
import { getWorkflowByServiceId } from './service-workflow.service';
import type { WorkflowStage } from '../types/workflow.types';

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});

addFormats(ajv);

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }

    const trimmed = item.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }

    seen.add(trimmed);
    normalized.push(trimmed);
  }

  return normalized;
}

function asRecord(value: unknown): Record<string, any> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }

  return value as Record<string, any>;
}

function findWorkflowStage(
  workflowStages: WorkflowStage[],
  currentStage:
    | {
        id: string;
        stageName: string;
        stageOrder: number;
        metadata: unknown;
      }
    | null
) {
  if (!currentStage) {
    return null;
  }

  const metadata = asRecord(currentStage.metadata) || {};
  const workflowStageId =
    typeof metadata.stageId === 'string' && metadata.stageId ? metadata.stageId : null;

  if (workflowStageId) {
    const byId = workflowStages.find(stage => stage.id === workflowStageId);
    if (byId) {
      return byId;
    }
  }

  const byOrder = workflowStages.find(stage => stage.order === currentStage.stageOrder);
  if (byOrder) {
    return byOrder;
  }

  return workflowStages.find(stage => stage.name === currentStage.stageName) || null;
}

export async function resolveProtocolDocumentContext(protocolId: string) {
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: {
      service: {
        select: {
          id: true,
          name: true,
        },
      },
      currentStage: {
        select: {
          id: true,
          stageName: true,
          stageOrder: true,
          metadata: true,
        },
      },
    },
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  const workflow = await getWorkflowByServiceId(protocol.serviceId);
  const workflowStages = Array.isArray(workflow?.stages)
    ? (workflow.stages as unknown as WorkflowStage[])
    : [];
  const workflowStage = findWorkflowStage(workflowStages, protocol.currentStage);
  const stageMetadata = asRecord(protocol.currentStage?.metadata) || {};
  const documentTemplateIds =
    workflowStage?.documentTemplateIds || normalizeStringArray(stageMetadata.documentTemplateIds);
  const stageType =
    workflowStage?.stageType ||
    (typeof stageMetadata.stageType === 'string' ? stageMetadata.stageType : undefined);

  return {
    protocol,
    workflow,
    workflowStage,
    currentStage: protocol.currentStage,
    stageType,
    documentTemplateIds,
  };
}

export async function getAvailableTemplatesForProtocol(protocolId: string) {
  const context = await resolveProtocolDocumentContext(protocolId);
  const { protocol, documentTemplateIds, stageType } = context;

  const templates = await prisma.documentTemplate.findMany({
    where: {
      isActive: true,
      OR: [
        { isGlobal: true },
        { serviceIds: { array_contains: [protocol.serviceId] } },
      ],
    },
    orderBy: { name: 'asc' },
  });

  return templates.filter(template => {
    const allowedStageTypes = normalizeStringArray(template.allowedStageTypes);

    if (documentTemplateIds.length > 0 && !documentTemplateIds.includes(template.id)) {
      return false;
    }

    if (allowedStageTypes.length > 0 && (!stageType || !allowedStageTypes.includes(stageType))) {
      return false;
    }

    return true;
  });
}

export async function ensureTemplateAllowedForProtocol(protocolId: string, templateId: string) {
  const context = await resolveProtocolDocumentContext(protocolId);
  const templates = await getAvailableTemplatesForProtocol(protocolId);
  const template = templates.find(item => item.id === templateId);

  if (!template) {
    throw new Error('Template não está disponível para a etapa atual deste protocolo');
  }

  return {
    context,
    template,
  };
}

export function validateTemplateInputData(
  inputSchema: unknown,
  payload: Record<string, any> | undefined | null
) {
  const schema = asRecord(inputSchema);
  if (!schema) {
    return {
      valid: true,
      data: payload || {},
      errors: [] as string[],
    };
  }

  const data = payload && typeof payload === 'object' ? payload : {};
  const validate = ajv.compile(schema);
  const isValid = validate(data);

  if (isValid) {
    return {
      valid: true,
      data,
      errors: [] as string[],
    };
  }

  const errors = (validate.errors || []).map(error => {
    const path = error.instancePath || error.schemaPath || 'campo';
    return `${path}: ${error.message || 'inválido'}`;
  });

  return {
    valid: false,
    data,
    errors,
  };
}

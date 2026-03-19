/**
 * ============================================================================
 * SERVICE WORKFLOW SERVICE - NOVO MODELO
 * ============================================================================
 *
 * Gerenciamento de Workflows por Serviço (não por ModuleType)
 * Permite que TODOS os serviços tenham workflow customizado
 */

import { prisma } from '../lib/prisma';
import type {
  WorkflowStage,
  WorkflowStageInput,
  StageValidationResult,
  WorkflowStageSupportAssignment
} from '../types/workflow.types';
import {
  DocumentStatus,
  Prisma,
  WorkflowStageSupportMode as DbWorkflowStageSupportMode,
  WorkflowStageSupportTargetType as DbWorkflowStageSupportTargetType
} from '@prisma/client';
import { randomUUID } from 'crypto';
import { centralCalendarService } from './central-calendar.service';
import { matchDocumentType } from '../utils/document-mapping';

// ============================================================================
// TYPES
// ============================================================================

export interface CreateServiceWorkflowData {
  serviceId: string;
  name: string;
  description?: string;
  stages: WorkflowStageInput[];
  defaultSLA?: number;
  rules?: any;
}

export interface UpdateServiceWorkflowData {
  name?: string;
  description?: string;
  stages?: WorkflowStageInput[];
  defaultSLA?: number;
  rules?: any;
  isActive?: boolean;
}

const workflowInclude = {
  service: {
    include: {
      department: true
    }
  }
} as const satisfies Prisma.ServiceWorkflowInclude;

const workflowStageSupportInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  },
  department: {
    select: {
      id: true,
      name: true,
      code: true
    }
  },
  organizationalUnit: {
    select: {
      id: true,
      nome: true,
      sigla: true,
      tipo: true,
      departmentId: true,
      department: {
        select: {
          id: true,
          name: true
        }
      }
    }
  }
} as const satisfies Prisma.WorkflowStageSupportAssignmentInclude;

type ServiceWorkflowWithRelations = Prisma.ServiceWorkflowGetPayload<{
  include: typeof workflowInclude;
}>;

type WorkflowStageSupportRecord = Prisma.WorkflowStageSupportAssignmentGetPayload<{
  include: typeof workflowStageSupportInclude;
}>;

interface ServiceFormFieldDescriptor {
  id: string;
  label: string;
  type: string;
  required: boolean;
}

interface ServiceFormFieldCatalog {
  fields: ServiceFormFieldDescriptor[];
  byId: Map<string, ServiceFormFieldDescriptor>;
}

export class WorkflowValidationError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'WorkflowValidationError';
    this.statusCode = statusCode;
  }
}

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

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const normalized: string[] = [];
  const seen = new Set<string>();

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

function isReceptionStage(stage: WorkflowStage | Record<string, any> | null | undefined): boolean {
  if (!stage || typeof stage !== 'object') {
    return false;
  }

  const stageType = typeof (stage as any).stageType === 'string' ? (stage as any).stageType.trim() : '';
  if (stageType === 'RECEPTION') {
    return true;
  }

  const stageName = typeof (stage as any).name === 'string' ? (stage as any).name.toLowerCase() : '';
  return stageName.includes('recep') || stageName.includes('receb');
}

function normalizeWorkflowTab(tab: unknown): string | null {
  if (typeof tab !== 'string') {
    return null;
  }

  const trimmed = tab.trim();
  if (!trimmed) {
    return null;
  }

  return LEGACY_WORKFLOW_TAB_MAP[trimmed] || trimmed;
}

function normalizeWorkflowTabs(
  value: unknown,
  fallback: string[] = ['resumo', 'comunicacao']
): string[] {
  const seen = new Set<string>();
  const normalized = Array.isArray(value)
    ? value
        .map(normalizeWorkflowTab)
        .filter((tab): tab is string => Boolean(tab))
        .filter(tab => VALID_WORKFLOW_TABS.has(tab))
        .filter(tab => {
          if (seen.has(tab)) {
            return false;
          }
          seen.add(tab);
          return true;
        })
    : [];

  if (normalized.length > 0) {
    return normalized;
  }

  return [...fallback];
}

function normalizeWorkflowPrimaryTab(primaryTab: unknown, availableTabs: string[]): string {
  const normalizedPrimaryTab = normalizeWorkflowTab(primaryTab);

  if (normalizedPrimaryTab && availableTabs.includes(normalizedPrimaryTab)) {
    return normalizedPrimaryTab;
  }

  return availableTabs[0] || 'resumo';
}

function normalizeWorkflowStageActions(value: unknown): WorkflowStage['allowedActions'] {
  return normalizeStringArray(value).filter(
    (action): action is WorkflowStage['allowedActions'][number] => VALID_WORKFLOW_STAGE_ACTIONS.has(action)
  );
}

function parseJsonObject(input: unknown): Record<string, any> | null {
  if (!input) {
    return null;
  }

  if (typeof input === 'string') {
    try {
      const parsed = JSON.parse(input);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
      return null;
    }
  }

  return typeof input === 'object' ? (input as Record<string, any>) : null;
}

function normalizeLookupToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function snakeToCamel(value: string): string {
  return value.replace(/_([a-zA-Z0-9])/g, (_, char) => String(char).toUpperCase());
}

function extractServiceFormFields(service: {
  formSchema?: unknown;
  formFieldsConfig?: unknown;
}): ServiceFormFieldCatalog {
  const byId = new Map<string, ServiceFormFieldDescriptor>();
  const formSchema = parseJsonObject(service.formSchema);
  const requiredFromSchema = new Set(
    Array.isArray(formSchema?.required)
      ? formSchema.required.filter((value: unknown): value is string => typeof value === 'string')
      : []
  );

  const properties =
    formSchema &&
    typeof formSchema.properties === 'object' &&
    formSchema.properties !== null
      ? (formSchema.properties as Record<string, any>)
      : {};

  for (const [fieldId, fieldDefinition] of Object.entries(properties)) {
    const fieldObject =
      fieldDefinition && typeof fieldDefinition === 'object'
        ? (fieldDefinition as Record<string, any>)
        : {};

    if (!fieldId.trim()) {
      continue;
    }

    byId.set(fieldId, {
      id: fieldId,
      label:
        (typeof fieldObject.title === 'string' && fieldObject.title) ||
        (typeof fieldObject.label === 'string' && fieldObject.label) ||
        fieldId,
      type:
        (typeof fieldObject.type === 'string' && fieldObject.type) ||
        (typeof fieldObject.widget === 'string' && fieldObject.widget) ||
        'text',
      required: requiredFromSchema.has(fieldId)
    });
  }

  if (byId.size === 0) {
    const formFieldsConfig = Array.isArray(service.formFieldsConfig) ? service.formFieldsConfig : [];
    for (const field of formFieldsConfig) {
      if (!field || typeof field !== 'object') {
        continue;
      }

      const fieldRecord = field as Record<string, any>;
      const rawId = fieldRecord.id ?? fieldRecord.key ?? fieldRecord.name;
      const fieldId = typeof rawId === 'string' ? rawId.trim() : '';
      if (!fieldId) {
        continue;
      }

      byId.set(fieldId, {
        id: fieldId,
        label:
          (typeof fieldRecord.label === 'string' && fieldRecord.label) ||
          (typeof fieldRecord.title === 'string' && fieldRecord.title) ||
          fieldId,
        type: typeof fieldRecord.type === 'string' && fieldRecord.type ? fieldRecord.type : 'text',
        required: Boolean(fieldRecord.required)
      });
    }
  }

  return {
    fields: Array.from(byId.values()),
    byId
  };
}

function resolveServiceFormFieldId(rawFieldId: string, catalog: ServiceFormFieldCatalog): string | null {
  const trimmed = rawFieldId.trim();
  if (!trimmed) {
    return null;
  }

  if (catalog.byId.has(trimmed)) {
    return trimmed;
  }

  const snakeCandidate = snakeToCamel(trimmed);
  if (catalog.byId.has(snakeCandidate)) {
    return snakeCandidate;
  }

  const normalizedTarget = normalizeLookupToken(trimmed);
  if (!normalizedTarget) {
    return null;
  }

  let matchedId: string | null = null;
  for (const field of catalog.fields) {
    if (normalizeLookupToken(field.id) === normalizedTarget) {
      if (matchedId && matchedId !== field.id) {
        return null;
      }
      matchedId = field.id;
    }
  }

  return matchedId;
}

function getRequiredInputFieldIds(stage: WorkflowStage | Record<string, any>): string[] {
  return normalizeStringArray((stage as any).requiredInputFieldIds ?? []);
}

function getRequiredStageOutputs(stage: WorkflowStage | Record<string, any>): string[] {
  return normalizeStringArray((stage as any).requiredStageOutputs ?? []);
}

function hasFilledValue(value: unknown): boolean {
  if (value === null || value === undefined) {
    return false;
  }

  if (typeof value === 'string') {
    return value.trim().length > 0;
  }

  if (Array.isArray(value)) {
    return value.length > 0;
  }

  if (typeof value === 'object') {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }

  return true;
}

function mapFieldIdsToLabels(fieldIds: string[], catalog: ServiceFormFieldCatalog): string[] {
  return fieldIds.map(fieldId => catalog.byId.get(fieldId)?.label || fieldId);
}

function assertStagesAlignedWithService(
  service: {
    name: string;
    formSchema?: unknown;
    formFieldsConfig?: unknown;
  },
  stages: WorkflowStage[]
) {
  const catalog = extractServiceFormFields(service);

  if (catalog.fields.length === 0) {
    const hasInputRequirements = stages.some(stage => (stage.requiredInputFieldIds || []).length > 0);
    if (hasInputRequirements) {
      throw new WorkflowValidationError(
        `Workflow inválido para "${service.name}": o serviço não possui campos em formSchema/formFieldsConfig, mas há campos de entrada obrigatórios nas etapas.`
      );
    }
    return;
  }

  const invalidByStage = stages
    .map(stage => {
      const invalidFieldIds = (stage.requiredInputFieldIds || []).filter(
        fieldId => !catalog.byId.has(fieldId)
      );
      if (invalidFieldIds.length === 0) {
        return null;
      }

      return {
        stageName: stage.name || `Etapa ${stage.order}`,
        invalidFieldIds
      };
    })
    .filter((item): item is { stageName: string; invalidFieldIds: string[] } => Boolean(item));

  if (invalidByStage.length === 0) {
    return;
  }

  const availableFieldIds = catalog.fields.map(field => field.id).sort();
  const details = invalidByStage
    .map(item => `${item.stageName}: ${item.invalidFieldIds.join(', ')}`)
    .join(' | ');

  throw new WorkflowValidationError(
    `Workflow inválido para "${service.name}". Campos de entrada não encontrados no serviço: ${details}. Campos válidos: ${availableFieldIds.join(', ')}`
  );
}

function normalizeStageSupportAssignment(
  assignment: WorkflowStageSupportAssignment | Record<string, any> | null | undefined
): WorkflowStageSupportAssignment | null {
  if (!assignment || typeof assignment !== 'object') {
    return null;
  }

  const targetType =
    assignment.targetType === 'USER' ||
    assignment.targetType === 'DEPARTMENT' ||
    assignment.targetType === 'ORGANIZATIONAL_UNIT'
      ? assignment.targetType
      : null;

  if (!targetType) {
    return null;
  }

  const mode =
    assignment.mode === 'SUGGEST_ASSIGNMENT'
      ? 'SUGGEST_ASSIGNMENT'
      : assignment.mode === 'REQUIRED_EXECUTION'
        ? 'REQUIRED_EXECUTION'
        : 'REFERENCE_ONLY';
  const userId = typeof assignment.userId === 'string' && assignment.userId ? assignment.userId : undefined;
  const departmentId =
    typeof assignment.departmentId === 'string' && assignment.departmentId ? assignment.departmentId : undefined;
  const organizationalUnitId =
    typeof assignment.organizationalUnitId === 'string' && assignment.organizationalUnitId
      ? assignment.organizationalUnitId
      : undefined;

  if (targetType === 'USER' && !userId) {
    return null;
  }

  if (targetType === 'DEPARTMENT' && !departmentId) {
    return null;
  }

  if (targetType === 'ORGANIZATIONAL_UNIT' && !organizationalUnitId) {
    return null;
  }

  return {
    id: typeof assignment.id === 'string' && assignment.id ? assignment.id : randomUUID(),
    targetType,
    mode,
    userId,
    departmentId,
    organizationalUnitId,
    user: assignment.user,
    department: assignment.department,
    organizationalUnit: assignment.organizationalUnit
  };
}

function normalizeWorkflowStage(stage: WorkflowStage | Record<string, any>, index: number): WorkflowStage {
  const availableTabs = normalizeWorkflowTabs(stage.availableTabs);
  const primaryTab = normalizeWorkflowPrimaryTab(stage.primaryTab, availableTabs);
  const isReception = isReceptionStage(stage);
  const requiredInputFieldIds = isReception ? [] : getRequiredInputFieldIds(stage);
  const requiredStageOutputs = isReception ? [] : getRequiredStageOutputs(stage);

  const supportAssignments = Array.isArray(stage.supportAssignments)
    ? stage.supportAssignments
        .map(normalizeStageSupportAssignment)
        .filter((assignment): assignment is WorkflowStageSupportAssignment => Boolean(assignment))
    : [];
  const {
    requiredInputFieldIds: _rawRequiredInputFieldIds,
    requiredStageOutputs: _rawRequiredStageOutputs,
    ...stageWithoutRequirements
  } = stage as Record<string, any>;

  return {
    ...(stageWithoutRequirements as WorkflowStage),
    id: typeof stage.id === 'string' && stage.id ? stage.id : randomUUID(),
    name: typeof stage.name === 'string' ? stage.name : '',
    description: typeof stage.description === 'string' && stage.description ? stage.description : undefined,
    order: typeof stage.order === 'number' && stage.order > 0 ? stage.order : index + 1,
    slaDays: typeof stage.slaDays === 'number' && stage.slaDays > 0 ? stage.slaDays : undefined,
    availableTabs,
    primaryTab,
    requiredDocumentTypes: isReception ? [] : normalizeStringArray((stage as any).requiredDocumentTypes),
    requiredInputFieldIds,
    requiredStageOutputs,
    allowedActions: normalizeWorkflowStageActions(stage.allowedActions),
    canSkip: Boolean(stage.canSkip),
    skipCondition:
      typeof stage.skipCondition === 'string' && stage.skipCondition ? stage.skipCondition : undefined,
    stageType: typeof stage.stageType === 'string' && stage.stageType ? stage.stageType : undefined,
    actionLabels: stage.actionLabels && typeof stage.actionLabels === 'object' ? stage.actionLabels : undefined,
    role: typeof stage.role === 'string' && stage.role ? stage.role : undefined,
    department: typeof stage.department === 'string' && stage.department ? stage.department : undefined,
    requiresApproval: Boolean(stage.requiresApproval),
    supportAssignments
  };
}

function sortWorkflowStages(stages: WorkflowStage[]) {
  return [...stages].sort((a, b) => a.order - b.order);
}

function getWorkflowStagesFromJson(stages: unknown): WorkflowStage[] {
  if (!Array.isArray(stages)) {
    return [];
  }

  return sortWorkflowStages(stages.map((stage, index) => normalizeWorkflowStage(stage, index)));
}

function buildSupportAssignmentCreateManyInput(
  workflowId: string,
  stages: WorkflowStage[]
): Prisma.WorkflowStageSupportAssignmentCreateManyInput[] {
  const seen = new Set<string>();
  const records: Prisma.WorkflowStageSupportAssignmentCreateManyInput[] = [];

  for (const stage of stages) {
    for (const assignment of stage.supportAssignments || []) {
      const normalizedAssignment = normalizeStageSupportAssignment(assignment);

      if (!normalizedAssignment) {
        continue;
      }

      const targetId =
        normalizedAssignment.targetType === 'USER'
          ? normalizedAssignment.userId
          : normalizedAssignment.targetType === 'DEPARTMENT'
            ? normalizedAssignment.departmentId
            : normalizedAssignment.organizationalUnitId;

      if (!targetId) {
        continue;
      }

      const key = [
        stage.id,
        normalizedAssignment.targetType,
        normalizedAssignment.mode,
        targetId
      ].join(':');

      if (seen.has(key)) {
        continue;
      }

      seen.add(key);
      records.push({
        serviceWorkflowId: workflowId,
        workflowStageId: stage.id,
        targetType: normalizedAssignment.targetType as DbWorkflowStageSupportTargetType,
        mode: normalizedAssignment.mode as DbWorkflowStageSupportMode,
        userId: normalizedAssignment.targetType === 'USER' ? normalizedAssignment.userId : null,
        departmentId:
          normalizedAssignment.targetType === 'DEPARTMENT'
            ? normalizedAssignment.departmentId
            : null,
        organizationalUnitId:
          normalizedAssignment.targetType === 'ORGANIZATIONAL_UNIT'
            ? normalizedAssignment.organizationalUnitId
            : null
      });
    }
  }

  return records;
}

function serializeSupportAssignmentRecord(
  assignment: WorkflowStageSupportRecord
): WorkflowStageSupportAssignment {
  return {
    id: assignment.id,
    targetType: assignment.targetType,
    mode: assignment.mode,
    userId: assignment.userId || undefined,
    departmentId: assignment.departmentId || undefined,
    organizationalUnitId: assignment.organizationalUnitId || undefined,
    user: assignment.user
      ? {
          id: assignment.user.id,
          name: assignment.user.name,
          email: assignment.user.email,
          departmentId: assignment.user.departmentId || undefined,
          departmentName: assignment.user.department?.name || undefined
        }
      : undefined,
    department: assignment.department
      ? {
          id: assignment.department.id,
          name: assignment.department.name,
          code: assignment.department.code || undefined
        }
      : undefined,
    organizationalUnit: assignment.organizationalUnit
      ? {
          id: assignment.organizationalUnit.id,
          nome: assignment.organizationalUnit.nome,
          sigla: assignment.organizationalUnit.sigla || undefined,
          tipo: assignment.organizationalUnit.tipo,
          departmentId: assignment.organizationalUnit.departmentId,
          departmentName: assignment.organizationalUnit.department?.name || undefined
        }
      : undefined
  };
}

async function enrichWorkflowsWithSupportAssignments<T extends ServiceWorkflowWithRelations | ServiceWorkflowWithRelations[] | null>(
  workflowOrWorkflows: T
): Promise<T> {
  if (!workflowOrWorkflows) {
    return workflowOrWorkflows;
  }

  const workflows = Array.isArray(workflowOrWorkflows) ? workflowOrWorkflows : [workflowOrWorkflows];
  const workflowIds = workflows.map(workflow => workflow.id);

  const supportAssignments = workflowIds.length > 0
    ? await prisma.workflowStageSupportAssignment.findMany({
        where: {
          serviceWorkflowId: {
            in: workflowIds
          }
        },
        include: workflowStageSupportInclude,
        orderBy: [
          { workflowStageId: 'asc' },
          { createdAt: 'asc' }
        ]
      })
    : [];

  const assignmentsByStage = new Map<string, WorkflowStageSupportAssignment[]>();

  for (const assignment of supportAssignments) {
    const key = `${assignment.serviceWorkflowId}:${assignment.workflowStageId}`;
    const currentAssignments = assignmentsByStage.get(key) || [];
    currentAssignments.push(serializeSupportAssignmentRecord(assignment));
    assignmentsByStage.set(key, currentAssignments);
  }

  const enrichedWorkflows = workflows.map(workflow => {
    const stages = getWorkflowStagesFromJson(workflow.stages).map(stage => ({
      ...stage,
      supportAssignments: assignmentsByStage.get(`${workflow.id}:${stage.id}`) || []
    }));

    return {
      ...workflow,
      stages,
      supportAssignmentsCount: stages.reduce(
        (total, stage) => total + (stage.supportAssignments?.length || 0),
        0
      )
    };
  });

  return (Array.isArray(workflowOrWorkflows) ? enrichedWorkflows : enrichedWorkflows[0]) as T;
}

export function buildStageSupportAssignmentsSnapshot(stage: WorkflowStage) {
  return (stage.supportAssignments || []).map(assignment => ({
    id: assignment.id,
    targetType: assignment.targetType,
    mode: assignment.mode || 'REFERENCE_ONLY',
    userId: assignment.userId,
    userName: assignment.user?.name,
    userEmail: assignment.user?.email,
    userDepartmentId: assignment.user?.departmentId,
    userDepartmentName: assignment.user?.departmentName,
    departmentId: assignment.departmentId,
    departmentName: assignment.department?.name,
    departmentCode: assignment.department?.code,
    organizationalUnitId: assignment.organizationalUnitId,
    organizationalUnitName: assignment.organizationalUnit?.nome,
    organizationalUnitSigla: assignment.organizationalUnit?.sigla,
    organizationalUnitType: assignment.organizationalUnit?.tipo,
    organizationalUnitDepartmentId: assignment.organizationalUnit?.departmentId,
    organizationalUnitDepartmentName: assignment.organizationalUnit?.departmentName
  }));
}

export function buildProtocolStageMetadataFromWorkflowStage(stage: WorkflowStage) {
  const isReception = isReceptionStage(stage);
  return {
    stageId: stage.id,
    description: stage.description,
    stageType: isReception ? 'RECEPTION' : (stage as any).stageType,
    actionLabels: (stage as any).actionLabels,
    availableTabs: stage.availableTabs || ['resumo', 'comunicacao'],
    primaryTab: stage.primaryTab || 'resumo',
    requiredDocumentTypes: isReception ? [] : stage.requiredDocumentTypes || [],
    requiredInputFieldIds: isReception ? [] : stage.requiredInputFieldIds || [],
    requiredStageOutputs: isReception ? [] : stage.requiredStageOutputs || [],
    allowedActions: stage.allowedActions || [],
    canSkip: stage.canSkip || false,
    skipCondition: stage.skipCondition,
    role: stage.role,
    department: stage.department,
    requiresApproval: stage.requiresApproval,
    stageSupportAssignments: buildStageSupportAssignmentsSnapshot(stage)
  };
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Cria um novo workflow de serviço
 */
export async function createServiceWorkflow(data: CreateServiceWorkflowData) {
  // Validar que serviço existe
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: data.serviceId }
  });

  if (!service) {
    throw new Error(`Serviço não encontrado: ${data.serviceId}`);
  }

  // Verificar se já existe workflow para este serviço
  const existing = await prisma.serviceWorkflow.findUnique({
    where: { serviceId: data.serviceId }
  });

  if (existing) {
    throw new Error(`Serviço já possui workflow: ${service.name}`);
  }

  const stages = getWorkflowStagesFromJson(data.stages);
  assertStagesAlignedWithService(service, stages);
  const stagesForStorage = stages.map(({ supportAssignments, ...stage }) => stage);

  const workflow = await prisma.$transaction(async (tx) => {
    const createdWorkflow = await tx.serviceWorkflow.create({
      data: {
        serviceId: data.serviceId,
        name: data.name,
        description: data.description,
        stages: stagesForStorage as any,
        defaultSLA: data.defaultSLA,
        rules: data.rules
      },
      include: workflowInclude
    });

    const supportAssignments = buildSupportAssignmentCreateManyInput(createdWorkflow.id, stages);

    if (supportAssignments.length > 0) {
      await tx.workflowStageSupportAssignment.createMany({
        data: supportAssignments
      });
    }

    return createdWorkflow;
  });

  return await enrichWorkflowsWithSupportAssignments(workflow);
}

/**
 * Obtém workflow por ID do serviço
 */
export async function getWorkflowByServiceId(serviceId: string) {
  const workflow = await prisma.serviceWorkflow.findUnique({
    where: { serviceId },
    include: workflowInclude
  });

  return await enrichWorkflowsWithSupportAssignments(workflow);
}

/**
 * Obtém workflow por ID
 */
export async function getWorkflowById(id: string) {
  const workflow = await prisma.serviceWorkflow.findUnique({
    where: { id },
    include: workflowInclude
  });

  return await enrichWorkflowsWithSupportAssignments(workflow);
}

/**
 * Lista todos os workflows
 */
export async function getAllServiceWorkflows(filters?: {
  isActive?: boolean;
  departmentId?: string;
}) {
  const where: any = {};

  if (filters?.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters?.departmentId) {
    where.service = {
      departmentId: filters.departmentId
    };
  }

  const workflows = await prisma.serviceWorkflow.findMany({
    where,
    include: workflowInclude,
    orderBy: { name: 'asc' }
  });

  return await enrichWorkflowsWithSupportAssignments(workflows);
}

/**
 * Atualiza um workflow
 */
export async function updateServiceWorkflow(
  serviceId: string,
  data: UpdateServiceWorkflowData
) {
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: serviceId }
  });

  if (!service) {
    throw new Error(`Serviço não encontrado: ${serviceId}`);
  }

  const updateData: any = {};
  let normalizedStages: WorkflowStage[] | undefined;

  if (data.name) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.defaultSLA !== undefined) updateData.defaultSLA = data.defaultSLA;
  if (data.rules !== undefined) updateData.rules = data.rules;
  if (data.isActive !== undefined) updateData.isActive = data.isActive;

  if (data.stages) {
    normalizedStages = getWorkflowStagesFromJson(data.stages);
    assertStagesAlignedWithService(service, normalizedStages);
    updateData.stages = normalizedStages.map(({ supportAssignments, ...stage }) => stage);
  }

  const workflow = await prisma.$transaction(async (tx) => {
    const updatedWorkflow = await tx.serviceWorkflow.update({
      where: { serviceId },
      data: updateData,
      include: workflowInclude
    });

    if (normalizedStages) {
      await tx.workflowStageSupportAssignment.deleteMany({
        where: {
          serviceWorkflowId: updatedWorkflow.id
        }
      });

      const supportAssignments = buildSupportAssignmentCreateManyInput(updatedWorkflow.id, normalizedStages);

      if (supportAssignments.length > 0) {
        await tx.workflowStageSupportAssignment.createMany({
          data: supportAssignments
        });
      }
    }

    return updatedWorkflow;
  });

  return await enrichWorkflowsWithSupportAssignments(workflow);
}

/**
 * Deleta um workflow
 */
export async function deleteServiceWorkflow(serviceId: string) {
  return await prisma.serviceWorkflow.delete({
    where: { serviceId }
  });
}

/**
 * Deleta todos os workflows
 */
export async function deleteAllServiceWorkflows() {
  const result = await prisma.serviceWorkflow.deleteMany({});
  return result.count;
}

// ============================================================================
// APLICAÇÃO DE WORKFLOW A PROTOCOLOS
// ============================================================================

/**
 * Aplica workflow a um protocolo
 * Busca workflow pelo serviceId do protocolo
 */
export async function applyWorkflowToProtocol(protocolId: string) {
  // Buscar protocolo com serviço
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    include: { service: true }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  // Buscar workflow do serviço
  const workflow = await getWorkflowByServiceId(protocol.serviceId);

  if (!workflow) {
    console.warn(`⚠️  Serviço "${protocol.service.name}" não possui workflow configurado`);
    console.log(`   → Protocolo ${protocol.number} criado SEM workflow`);
    return [];
  }

  if (!workflow.isActive) {
    console.warn(`⚠️  Workflow do serviço "${protocol.service.name}" está INATIVO`);
    return [];
  }

  const stages = sortWorkflowStages((workflow.stages || []) as unknown as WorkflowStage[]);

  // Verificar se já existem stages para este protocolo
  const existingStages = await prisma.protocolStage.findMany({
    where: { protocolId }
  });

  if (existingStages.length > 0) {
    console.warn(`⚠️  Protocolo ${protocol.number} já possui ${existingStages.length} stage(s)`);
    return existingStages;
  }

  // Criar todas as etapas do workflow
  const createdStages = await Promise.all(
    stages.map((stage) => {
      // ✅ PRIMEIRA ETAPA SEMPRE INICIA COMO IN_PROGRESS
      const isFirstStage = stage.order === 1;

      return prisma.protocolStage.create({
        data: {
          protocolId,
          stageName: stage.name,
          stageOrder: stage.order,
          status: isFirstStage ? 'IN_PROGRESS' : 'PENDING',
          startedAt: isFirstStage ? new Date() : undefined,
          dueDate: stage.slaDays
            ? new Date(Date.now() + stage.slaDays * 24 * 60 * 60 * 1000)
            : undefined,
          metadata: buildProtocolStageMetadataFromWorkflowStage(stage)
        }
      });
    })
  );

  await Promise.all(
    createdStages.map(async (createdStage) => {
      try {
        await centralCalendarService.syncProtocolStageEventByStageId(createdStage.id);
      } catch (error) {
        console.warn('Falha ao sincronizar etapa inicial do protocolo com agenda centralizada', {
          stageId: createdStage.id,
          protocolId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    })
  );

  // ✅ FASE 1: Atualizar protocolo para PROGRESSO e setar currentStageId
  const firstStage = createdStages.find(s => s.stageOrder === 1);
  if (firstStage) {
    await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        status: 'PROGRESSO', // Status muda automaticamente quando workflow inicia
        currentStageId: firstStage.id
      }
    });
    console.log(`✅ Protocolo ${protocol.number} → status PROGRESSO (stage: ${firstStage.stageName})`);
  }

  console.log(`✅ Workflow "${workflow.name}" aplicado ao protocolo ${protocol.number}`);
  console.log(`   → ${createdStages.length} etapa(s) criada(s)`);

  return createdStages;
}

/**
 * Valida se todas as condições de uma etapa foram atendidas
 */
export async function validateStageConditions(
  protocolId: string,
  stageOrder: number
): Promise<StageValidationResult> {
  const stage = await prisma.protocolStage.findFirst({
    where: {
      protocolId,
      stageOrder
    },
    include: {
      protocol: {
        include: {
          service: true
        }
      }
    }
  });

  if (!stage) {
    return {
      canProgress: false,
      blockers: ['Etapa não encontrada'],
      warnings: [],
      missingDocuments: [],
      missingFormFields: []
    };
  }

  const metadata = stage.metadata as any;
  const service = stage.protocol.service;
  const blockers: string[] = [];
  const warnings: string[] = [];
  const missingDocuments: string[] = [];
  const awaitingReviewDocuments: string[] = [];
  const rejectedDocuments: string[] = [];
  const missingFormFields: string[] = [];
  const isReception = isReceptionStage({
    name: stage.stageName,
    stageType: metadata?.stageType
  });

  // ===== VALIDAR DOCUMENTOS =====
  const requiredDocTypes = isReception ? [] : metadata?.requiredDocumentTypes || [];

  if (requiredDocTypes.length > 0) {
    const documents = await prisma.protocolDocument.findMany({
      where: {
        protocolId,
      }
    });

    for (const requiredDocType of requiredDocTypes) {
      const matchingDocuments = documents.filter((document) =>
        matchDocumentType(document.documentType || document.fileName || '', requiredDocType)
      );

      const hasApprovedDocument = matchingDocuments.some(
        (document) => document.status === DocumentStatus.APPROVED
      );

      if (hasApprovedDocument) {
        continue;
      }

      const hasAwaitingReviewDocument = matchingDocuments.some(
        (document) =>
          document.status === DocumentStatus.UPLOADED ||
          document.status === DocumentStatus.UNDER_REVIEW
      );

      if (hasAwaitingReviewDocument) {
        awaitingReviewDocuments.push(requiredDocType);
        continue;
      }

      const hasRejectedDocument = matchingDocuments.some(
        (document) => document.status === DocumentStatus.REJECTED
      );

      if (hasRejectedDocument) {
        rejectedDocuments.push(requiredDocType);
        continue;
      }

      missingDocuments.push(requiredDocType);
    }

    if (missingDocuments.length > 0) {
      blockers.push(`Documentos não enviados: ${missingDocuments.join(', ')}`);
    }

    if (awaitingReviewDocuments.length > 0) {
      blockers.push(`Documentos enviados aguardando aprovação: ${awaitingReviewDocuments.join(', ')}`);
    }

    if (rejectedDocuments.length > 0) {
      blockers.push(`Documentos rejeitados aguardando reenvio: ${rejectedDocuments.join(', ')}`);
    }
  }

  // ===== VALIDAR CAMPOS DO FORMULÁRIO (usando ProtocolDataField.status) =====
  const serviceFormFieldCatalog = extractServiceFormFields(service || {});
  const allRequiredFieldIds = isReception ? [] : getRequiredInputFieldIds(metadata || {});
  const unresolvedRequiredFieldIds = allRequiredFieldIds.filter(
    fieldId => !serviceFormFieldCatalog.byId.has(fieldId)
  );

  if (unresolvedRequiredFieldIds.length > 0) {
    warnings.push(
      `Campos de entrada não mapeados no serviço (ignorados nesta validação): ${unresolvedRequiredFieldIds.join(', ')}`
    );
  }

  const requiredFieldIds = allRequiredFieldIds.filter(fieldId =>
    serviceFormFieldCatalog.byId.has(fieldId)
  );

  if (requiredFieldIds.length > 0) {
    // ✅ CORREÇÃO: Buscar status dos ProtocolDataField ao invés de verificar customData
    const dataFields = await prisma.protocolDataField.findMany({
      where: {
        protocolId,
        fieldKey: { in: requiredFieldIds }
      }
    });


    // Campos pendentes (não aprovados ou rejeitados)
    const pendingOrRejectedFields = dataFields.filter(f => f.status !== 'APPROVED');

    // Campos que não existem no ProtocolDataField (ainda não enviados)
    const missingFields = requiredFieldIds.filter(
      (fieldId: string) => !dataFields.find(f => f.fieldKey === fieldId)
    );

    // Se há campos não aprovados
    const unapprovedFieldIds = [
      ...pendingOrRejectedFields.map(f => f.fieldKey),
      ...missingFields
    ];

    if (unapprovedFieldIds.length > 0) {
      // Buscar labels do formSchema para exibição amigável
      const fieldLabels = mapFieldIdsToLabels(unapprovedFieldIds, serviceFormFieldCatalog);
      missingFormFields.push(...fieldLabels);
      blockers.push(`Campos de entrada não aprovados: ${fieldLabels.join(', ')}`);
    }
  }

  // ===== VALIDAR PENDÊNCIAS BLOQUEANTES =====
  const requiredStageOutputs = isReception ? [] : getRequiredStageOutputs(metadata || {});
  const stageOutputs =
    metadata?.stageOutputs && typeof metadata.stageOutputs === 'object'
      ? (metadata.stageOutputs as Record<string, unknown>)
      : {};
  const missingStageOutputs = requiredStageOutputs.filter(outputKey => !hasFilledValue(stageOutputs[outputKey]));

  if (missingStageOutputs.length > 0) {
    blockers.push(`Saídas obrigatórias da etapa pendentes: ${missingStageOutputs.join(', ')}`);
  }

  const blockingPendings = await prisma.protocolPending.count({
    where: {
      protocolId,
      blocksProgress: true,
      status: { in: ['OPEN', 'IN_PROGRESS'] }
    }
  });

  if (blockingPendings > 0) {
    blockers.push(`Existem ${blockingPendings} pendência(s) bloqueante(s) ativa(s)`);
  }

  return {
    canProgress: blockers.length === 0,
    blockers,
    warnings,
    missingDocuments,
    awaitingReviewDocuments,
    rejectedDocuments,
    missingFormFields,
    missingStageOutputs
  };
}

// ============================================================================
// ESTATÍSTICAS E RELATÓRIOS
// ============================================================================

/**
 * Obtém estatísticas de workflows
 */
export async function getWorkflowStats() {
  const workflows = await getAllServiceWorkflows({ isActive: true });

  // Contar protocolos com workflow aplicado
  const protocolsWithWorkflow = await prisma.protocolSimplified.count({
    where: {
      stages: {
        some: {}
      }
    }
  });

  // Contar stages ativas
  const activeStages = await prisma.protocolStage.count({
    where: {
      status: 'IN_PROGRESS'
    }
  });

  // Serviços sem workflow
  const servicesWithoutWorkflow = await prisma.serviceSimplified.count({
    where: {
      isActive: true,
      workflow: null
    }
  });

  const stageSupportAssignments = await prisma.workflowStageSupportAssignment.count();
  const workflowsWithStageSupport = workflows.filter(
    (workflow: any) => (workflow.supportAssignmentsCount || 0) > 0
  ).length;

  return {
    totalWorkflows: workflows.length,
    protocolsWithWorkflow,
    activeStages,
    servicesWithoutWorkflow,
    stageSupportAssignments,
    workflowsWithStageSupport,
    workflows: workflows.map((w) => ({
      serviceId: w.serviceId,
      serviceName: w.service.name,
      workflowName: w.name,
      stagesCount: Array.isArray(w.stages) ? w.stages.length : 0,
      defaultSLA: w.defaultSLA,
      isActive: w.isActive,
      supportAssignmentsCount: (w as any).supportAssignmentsCount || 0
    }))
  };
}

/**
 * Obtém informações do serviço para criar workflow
 */
export async function getServiceForWorkflow(serviceId: string) {
  const service = await prisma.serviceSimplified.findUnique({
    where: { id: serviceId },
    include: {
      department: true
    }
  });

  if (!service) {
    return null;
  }

  // Extrair documentos
  const requiredDocuments = Array.isArray(service.requiredDocuments)
    ? (service.requiredDocuments as any[]).map(doc => ({
        type: typeof doc === 'string' ? doc : doc.type,
        name: typeof doc === 'string' ? doc : (doc.name || doc.type),
        required: typeof doc === 'object' ? doc.required !== false : true
      }))
    : [];

  // Extrair campos do formulário
  const formFields = extractServiceFormFields(service).fields;

  return {
    id: service.id,
    name: service.name,
    description: service.description,
    departmentId: service.departmentId,
    departmentName: service.department.name,
    serviceType: service.serviceType,
    moduleType: service.moduleType,
    estimatedDays: service.estimatedDays,
    requiredDocuments,
    formFields
  };
}

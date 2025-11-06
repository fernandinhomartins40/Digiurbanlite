/**
 * Serviço de API para Workflows de Módulos
 */

import {
  ModuleWorkflow,
  CreateWorkflowData,
  ProtocolStage,
  ApiResponse,
} from '@/types/protocol-enhancements';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

/**
 * Cria um novo workflow de módulo
 */
export async function createWorkflow(
  data: CreateWorkflowData,
  token: string
): Promise<ModuleWorkflow> {
  const response = await fetch(`${API_URL}/api/workflows`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<ModuleWorkflow> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao criar workflow');
  }

  return result.data!;
}

/**
 * Lista todos os workflows
 */
export async function getAllWorkflows(
  token: string
): Promise<ModuleWorkflow[]> {
  const response = await fetch(`${API_URL}/api/workflows`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result: ApiResponse<ModuleWorkflow[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao listar workflows');
  }

  return result.data!;
}

/**
 * Obtém estatísticas de workflows
 */
export async function getWorkflowStats(token: string): Promise<any> {
  const response = await fetch(`${API_URL}/api/workflows/stats`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result: ApiResponse<any> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao obter estatísticas de workflows');
  }

  return result.data!;
}

/**
 * Obtém um workflow por tipo de módulo
 */
export async function getWorkflowByModuleType(
  moduleType: string,
  token: string
): Promise<ModuleWorkflow | null> {
  const response = await fetch(`${API_URL}/api/workflows/${moduleType}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  const result: ApiResponse<ModuleWorkflow> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao obter workflow');
  }

  return result.data || null;
}

/**
 * Atualiza um workflow
 */
export async function updateWorkflow(
  moduleType: string,
  data: Partial<CreateWorkflowData>,
  token: string
): Promise<ModuleWorkflow> {
  const response = await fetch(`${API_URL}/api/workflows/${moduleType}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  const result: ApiResponse<ModuleWorkflow> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao atualizar workflow');
  }

  return result.data!;
}

/**
 * Aplica um workflow a um protocolo
 */
export async function applyWorkflowToProtocol(
  moduleType: string,
  protocolId: string,
  token: string
): Promise<ProtocolStage[]> {
  const response = await fetch(
    `${API_URL}/api/workflows/${moduleType}/apply/${protocolId}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolStage[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao aplicar workflow');
  }

  return result.data!;
}

/**
 * Valida as condições de uma etapa
 */
export async function validateStageConditions(
  protocolId: string,
  stageOrder: number,
  token: string
): Promise<{ valid: boolean; missingItems: string[] }> {
  const response = await fetch(
    `${API_URL}/api/workflows/validate-stage/${protocolId}/${stageOrder}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<{ valid: boolean; missingItems: string[] }> =
    await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao validar etapa');
  }

  return result.data!;
}

/**
 * Cria workflows padrão
 */
export async function seedDefaultWorkflows(
  token: string
): Promise<ModuleWorkflow[]> {
  const response = await fetch(`${API_URL}/api/workflows/seed-defaults`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result: ApiResponse<ModuleWorkflow[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao criar workflows padrão');
  }

  return result.data!;
}

/**
 * Deleta um workflow (apenas administradores)
 */
export async function deleteWorkflow(
  moduleType: string,
  token: string
): Promise<void> {
  const response = await fetch(`${API_URL}/api/workflows/${moduleType}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const result: ApiResponse<any> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao deletar workflow');
  }
}

/**
 * Obtém workflows disponíveis para um tipo de serviço
 */
export async function getWorkflowsForServiceType(
  serviceType: string,
  token: string
): Promise<ModuleWorkflow[]> {
  const allWorkflows = await getAllWorkflows(token);
  return allWorkflows.filter((w) => w.moduleType.includes(serviceType));
}

/**
 * Verifica se um módulo tem workflow configurado
 */
export async function hasWorkflow(
  moduleType: string,
  token: string
): Promise<boolean> {
  const workflow = await getWorkflowByModuleType(moduleType, token);
  return workflow !== null;
}

/**
 * Obtém o número total de etapas de um workflow
 */
export function getWorkflowStagesCount(workflow: ModuleWorkflow): number {
  return Array.isArray(workflow.stages) ? workflow.stages.length : 0;
}

/**
 * Calcula o SLA total de um workflow (soma de todas as etapas)
 */
export function calculateWorkflowTotalSLA(workflow: ModuleWorkflow): number {
  if (workflow.defaultSLA) return workflow.defaultSLA;

  if (!Array.isArray(workflow.stages)) return 0;

  return workflow.stages.reduce((total: number, stage: any) => {
    return total + (stage.slaDays || 0);
  }, 0);
}

/**
 * Obtém documentos obrigatórios de um workflow
 */
export function getWorkflowRequiredDocuments(
  workflow: ModuleWorkflow
): string[] {
  if (!Array.isArray(workflow.stages)) return [];

  const documents = new Set<string>();

  workflow.stages.forEach((stage: any) => {
    if (stage.requiredDocuments) {
      stage.requiredDocuments.forEach((doc: string) => documents.add(doc));
    }
  });

  return Array.from(documents);
}

/**
 * Valida se um workflow está completo (todas as etapas obrigatórias)
 */
export function isWorkflowValid(workflow: ModuleWorkflow): boolean {
  if (!workflow.name || !workflow.moduleType) return false;
  if (!Array.isArray(workflow.stages) || workflow.stages.length === 0)
    return false;

  // Verifica se as etapas estão ordenadas corretamente
  const orders = workflow.stages.map((s: any) => s.order).sort((a: number, b: number) => a - b);
  for (let i = 0; i < orders.length; i++) {
    if (orders[i] !== i + 1) return false;
  }

  return true;
}

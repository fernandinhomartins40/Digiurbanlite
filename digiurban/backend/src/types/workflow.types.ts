/**
 * ============================================================================
 * WORKFLOW ENGINE - TIPOS
 * ============================================================================
 *
 * Sistema genérico de fluxos de trabalho (workflows) reutilizável por todos
 * os microsistemas do DigiUrban.
 *
 * Permite:
 * - Rastreabilidade total de processos
 * - Filas inteligentes com priorização
 * - SLA tracking automático
 * - Histórico completo de transições
 * - Handoff estruturado entre profissionais/setores
 */

import { WorkflowStatus } from '@prisma/client';

// ============================================================================
// WORKFLOW DEFINITION (Definição do Fluxo)
// ============================================================================

/**
 * Stage (etapa) de um workflow
 */
export interface WorkflowStage {
  id: string;                    // Identificador único da etapa
  name: string;                  // Nome da etapa (ex: "Triagem", "Análise Documental")
  description?: string;          // Descrição detalhada
  role?: string;                 // Role necessária (ex: "ENFERMEIRO", "MEDICO")
  department?: string;           // Departamento responsável
  slaHours?: number;             // SLA em horas (tempo máximo nesta etapa)
  isInitial?: boolean;           // É a etapa inicial?
  isFinal?: boolean;             // É uma etapa final?
  requiresApproval?: boolean;    // Requer aprovação para avançar?
  allowedActions: WorkflowAction[]; // Ações disponíveis nesta etapa
  nextStages?: string[];         // IDs das próximas etapas possíveis
  formFields?: WorkflowFormField[]; // Campos do formulário (se aplicável)
}

/**
 * Ação disponível em uma etapa
 */
export interface WorkflowAction {
  id: string;                    // Identificador da ação
  name: string;                  // Nome da ação (ex: "Aprovar", "Rejeitar")
  type: WorkflowActionType;      // Tipo da ação
  requiresNotes?: boolean;       // Requer observações?
  requiresAttachments?: boolean; // Requer anexos?
  targetStage?: string;          // Stage de destino (se aplicável)
  confirmationMessage?: string;  // Mensagem de confirmação
}

export enum WorkflowActionType {
  ADVANCE = 'ADVANCE',           // Avançar para próxima etapa
  RETURN = 'RETURN',             // Retornar para etapa anterior
  APPROVE = 'APPROVE',           // Aprovar
  REJECT = 'REJECT',             // Rejeitar
  CANCEL = 'CANCEL',             // Cancelar fluxo
  COMPLETE = 'COMPLETE',         // Concluir fluxo
  REQUEST_INFO = 'REQUEST_INFO', // Solicitar informações
  ASSIGN = 'ASSIGN',             // Atribuir a outro usuário
}

/**
 * Campo de formulário em uma etapa
 */
export interface WorkflowFormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'file';
  required?: boolean;
  options?: string[];            // Para tipo 'select'
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

/**
 * Definição completa de um workflow
 */
export interface WorkflowDefinitionData {
  id?: string;
  name: string;
  description?: string;
  module: string;                // "SAUDE", "EDUCACAO", "ASSISTENCIA_SOCIAL", etc
  version?: number;
  isActive?: boolean;
  stages: WorkflowStage[];
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// WORKFLOW INSTANCE (Instância do Fluxo)
// ============================================================================

/**
 * Instância de um workflow (processo em andamento)
 */
export interface WorkflowInstanceData {
  id?: string;
  definitionId: string;
  entityType: string;            // "ConsultaMedica", "LicencaObra", etc
  entityId: string;              // ID da entidade relacionada
  citizenId?: string;            // Cidadão vinculado (se aplicável)
  currentStage: string;          // ID da etapa atual
  status: WorkflowStatus;
  priority?: number;             // 0-10 (maior = mais urgente)
  metadata?: Record<string, any>; // Dados adicionais
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

/**
 * Metadados comuns para instâncias
 */
export interface WorkflowMetadata {
  assignedUserId?: string;       // Usuário responsável atual
  assignedUserName?: string;
  estimatedCompletionDate?: string;
  tags?: string[];
  customFields?: Record<string, any>;
}

// ============================================================================
// WORKFLOW HISTORY (Histórico de Transições)
// ============================================================================

/**
 * Registro de histórico de uma transição
 */
export interface WorkflowHistoryData {
  id?: string;
  instanceId: string;
  fromStage?: string;            // Stage anterior (null se é criação)
  toStage: string;               // Stage atual
  action: string;                // "CREATED", "ADVANCED", "RETURNED", etc
  userId: string;                // Quem executou
  userName?: string;
  notes?: string;
  attachments?: WorkflowAttachment[];
  timestamp?: Date;
  duration?: number;             // Tempo no stage anterior (minutos)
}

/**
 * Anexo de workflow
 */
export interface WorkflowAttachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
}

// ============================================================================
// DTOs (Data Transfer Objects)
// ============================================================================

/**
 * DTO para criar nova definição de workflow
 */
export interface CreateWorkflowDefinitionDto {
  name: string;
  description?: string;
  module: string;
  stages: WorkflowStage[];
}

/**
 * DTO para atualizar definição de workflow
 */
export interface UpdateWorkflowDefinitionDto {
  name?: string;
  description?: string;
  isActive?: boolean;
  stages?: WorkflowStage[];
}

/**
 * DTO para criar nova instância de workflow
 */
export interface CreateWorkflowInstanceDto {
  definitionId: string;
  entityType: string;
  entityId: string;
  citizenId?: string;
  priority?: number;
  metadata?: Record<string, any>;
}

/**
 * DTO para avançar workflow
 */
export interface AdvanceWorkflowDto {
  action: string;
  targetStage?: string;
  userId: string;
  userName?: string;
  notes?: string;
  attachments?: WorkflowAttachment[];
  formData?: Record<string, any>;
}

/**
 * DTO para retornar workflow
 */
export interface ReturnWorkflowDto {
  targetStage: string;
  userId: string;
  userName?: string;
  reason: string;
  attachments?: WorkflowAttachment[];
}

/**
 * DTO para cancelar workflow
 */
export interface CancelWorkflowDto {
  userId: string;
  userName?: string;
  reason: string;
}

// ============================================================================
// QUERY FILTERS
// ============================================================================

/**
 * Filtros para consulta de instâncias
 */
export interface WorkflowInstanceFilters {
  definitionId?: string;
  entityType?: string;
  citizenId?: string;
  currentStage?: string;
  status?: WorkflowStatus;
  priorityMin?: number;
  priorityMax?: number;
  createdAfter?: Date;
  createdBefore?: Date;
  assignedUserId?: string;
}

/**
 * Filtros para fila de trabalho
 */
export interface WorkflowQueueFilters {
  definitionId?: string;
  stage: string;                 // Stage específico
  status?: WorkflowStatus;
  assignedUserId?: string;
  unassignedOnly?: boolean;
  orderBy?: 'priority' | 'createdAt' | 'sla';
  orderDirection?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

/**
 * Resposta com instância e contexto completo
 */
export interface WorkflowInstanceResponse extends WorkflowInstanceData {
  definition?: WorkflowDefinitionData;
  currentStageData?: WorkflowStage;
  history?: WorkflowHistoryData[];
  availableActions?: WorkflowAction[];
  slaDaysRemaining?: number;
  isOverdue?: boolean;
}

/**
 * Item na fila de trabalho
 */
export interface WorkflowQueueItem {
  instance: WorkflowInstanceResponse;
  waitingTime: number;           // Minutos aguardando nesta etapa
  slaDaysRemaining?: number;
  isUrgent?: boolean;
  isOverdue?: boolean;
}

/**
 * Métricas de workflow
 */
export interface WorkflowMetrics {
  totalInstances: number;
  activeInstances: number;
  completedInstances: number;
  cancelledInstances: number;
  averageDuration: number;       // Minutos
  byStage: {
    [stageId: string]: {
      count: number;
      averageDuration: number;
      overdueCount: number;
    };
  };
  byPriority: {
    [priority: number]: number;
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  WorkflowStatus,
} from '@prisma/client';

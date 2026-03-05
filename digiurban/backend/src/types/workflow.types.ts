/**
 * ============================================================================
 * WORKFLOW ENGINE - TIPOS ATUALIZADOS
 * ============================================================================
 *
 * Sistema alinhado onde:
 * - Serviços definem documentos e formulários (fonte única da verdade)
 * - Workflows REFERENCIAM (não duplicam) requisitos dos serviços
 * - Protocolos executam baseado nas referências
 */

// ✅ FASE 2: WorkflowStatus removido (não era usado)

// ============================================================================
// WORKFLOW STAGE - ESTRUTURA ATUALIZADA
// ============================================================================

/**
 * Ações permitidas em uma etapa do workflow
 */
export type WorkflowStageAction =
  | 'APPROVE'           // Aprovar e avançar
  | 'REJECT'            // Rejeitar etapa
  | 'CREATE_PENDING'    // Criar pendência
  | 'REQUEST_INFO'      // Solicitar informações adicionais
  | 'SKIP'              // Pular etapa (se permitido)

export type WorkflowStageSupportTargetType = 'USER' | 'DEPARTMENT' | 'ORGANIZATIONAL_UNIT'

export type WorkflowStageSupportMode =
  | 'REFERENCE_ONLY'
  | 'SUGGEST_ASSIGNMENT'
  | 'REQUIRED_EXECUTION'

export interface WorkflowStageSupportAssignment {
  id?: string
  targetType: WorkflowStageSupportTargetType
  mode?: WorkflowStageSupportMode
  userId?: string
  departmentId?: string
  organizationalUnitId?: string
  userName?: string
  departmentName?: string
  organizationalUnitName?: string
  user?: {
    id: string
    name: string
    email?: string
      departmentId?: string
      departmentName?: string
  }
  department?: {
    id: string
    name: string
    code?: string
  }
  organizationalUnit?: {
    id: string
    nome: string
    sigla?: string
    tipo?: string
    departmentId?: string
    departmentName?: string
  }
}

/**
 * Etapa de workflow ALINHADA com serviços
 *
 * ✅ USA REFERÊNCIAS (não duplica dados)
 */
export interface WorkflowStage {
  id: string;                           // ID único da stage
  name: string;                         // Nome da etapa
  description?: string;                 // Descrição detalhada
  order: number;                        // Ordem de execução
  slaDays?: number;                     // SLA em dias para esta etapa

  // ✅ METADADOS DE UI - Definem estrutura da interface
  availableTabs?: string[];             // Abas disponíveis na UI (ex: ['resumo', 'documentos', 'location'])
  primaryTab?: string;                  // Aba principal/destacada (ex: 'documentos')

  // ✅ NOVO: Referências aos requisitos do SERVIÇO
  requiredDocumentTypes: string[];      // Tipos de documentos do serviço
  requiredInputFieldIds?: string[];     // IDs de campos de entrada (formSchema.properties)
  requiredStageOutputs?: string[];      // Chaves de saídas obrigatórias da etapa

  // Configurações da etapa
  allowedActions: WorkflowStageAction[]; // Ações permitidas
  canSkip: boolean;                      // Pode ser pulada?
    skipCondition?: string;                // Condicao para pular

  // Identificadores e rotulos de acao para UI
  stageType?: 'RECEPTION' | 'CONCLUSION' | string;
  actionLabels?: Record<string, string>;

  // Responsabilidade
  role?: string;                         // Role necessária (ex: "MEDICO")
  department?: string;                   // Departamento responsável
  requiresApproval?: boolean;            // Requer aprovação manual?
  supportAssignments?: WorkflowStageSupportAssignment[]; // Apoios externos por etapa
}

export type WorkflowStageInput = Omit<WorkflowStage, 'id'> & { id?: string }

// ============================================================================
// WORKFLOW DEFINITION
// ============================================================================

/**
 * Definição completa de um workflow
 */
export interface WorkflowDefinitionData {
  id?: string;
  moduleType: string;                   // Vincula ao ServiceSimplified.moduleType
  name: string;
  description?: string;
  version?: number;
  isActive?: boolean;
  defaultSLA?: number;                  // SLA total em dias
  stages: WorkflowStage[];
  rules?: any;                          // Regras customizadas
  createdAt?: Date;
  updatedAt?: Date;
}

// ============================================================================
// WORKFLOW INSTANCE (Execução)
// ============================================================================

/**
 * Instância de workflow em execução (protocolo)
 * ✅ FASE 2: WorkflowStatus migrado para string literal
 */
export interface WorkflowInstanceData {
  id?: string;
  definitionId: string;                 // ID do ModuleWorkflow
  entityType: string;                   // "ProtocolSimplified"
  entityId: string;                     // ID do protocolo
  citizenId?: string;
  currentStage: string;                 // ID da stage atual
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'CANCELLED' | 'ERROR'; // String ao invés de enum
  priority?: number;
  metadata?: Record<string, any>;
  createdAt?: Date;
  updatedAt?: Date;
  completedAt?: Date;
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

/**
 * Resultado de validação de uma etapa
 */
export interface StageValidationResult {
  canProgress: boolean;                 // Pode avançar?
  blockers: string[];                   // Impedimentos
  warnings: string[];                   // Avisos
  missingDocuments: string[];           // Documentos faltantes
  missingFormFields: string[];          // Campos de formulário não preenchidos
  missingStageOutputs?: string[];       // Saídas obrigatórias da etapa não preenchidas
}

// ============================================================================
// DTOs
// ============================================================================

/**
 * DTO para criar workflow
 */
export interface CreateWorkflowData {
  moduleType: string;
  name: string;
  description?: string;
  defaultSLA?: number;
  stages: WorkflowStageInput[];
  rules?: any;
}

/**
 * DTO para atualizar workflow
 */
export interface UpdateWorkflowData {
  name?: string;
  description?: string;
  defaultSLA?: number;
  stages?: WorkflowStageInput[];
  rules?: any;
}

/**
 * DTO para completar/aprovar uma stage
 */
export interface CompleteStageDto {
  result: 'APPROVED' | 'REJECTED' | 'SKIPPED';
  notes?: string;
  metadata?: any;
}

/**
 * DTO para criar pendência de uma stage
 */
export interface CreateStagePendingDto {
  title: string;
  description: string;
  blocksProgress: boolean;
  dueDate?: Date;
}

// ============================================================================
// SERVICE INTEGRATION
// ============================================================================

/**
 * Informações de um serviço para criar workflow
 */
export interface ServiceForWorkflow {
  id: string;
  moduleType: string;
  name: string;
  description?: string;
  estimatedDays?: number;

  // Documentos disponíveis
  requiredDocuments: Array<{
    type: string;
    name: string;
    required: boolean;
  }>;

  // Campos do formulário disponíveis
  formFields: Array<{
    id: string;
    label: string;
    type: string;
    required: boolean;
  }>;
}

// ============================================================================
// EXPORTS
// ============================================================================

// ✅ FASE 2: WorkflowStatus enum removido (não era usado)
// export { WorkflowStatus } from '@prisma/client';

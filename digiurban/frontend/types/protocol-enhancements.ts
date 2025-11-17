/**
 * ============================================================================
 * PROTOCOL ENHANCEMENTS - TIPOS
 * ============================================================================
 * Tipos para melhorias do sistema de protocolos
 */

// ============================================================================
// STAGES (Etapas do Workflow)
// ============================================================================

export enum StageStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  FAILED = 'FAILED',
}

export interface ProtocolStage {
  id: string
  protocolId: string
  stageName: string
  stageDescription?: string
  stageOrder: number
  status: StageStatus
  dueDate?: Date
  responsibleUserId?: string
  responsibleUser?: {
    id: string
    name: string
    email: string
  }
  assignedTo?: string
  result?: string
  startedAt?: Date
  completedAt?: Date
  skippedAt?: Date
  failedAt?: Date
  notes?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// SLA (Service Level Agreement)
// ============================================================================

export enum SLAStatus {
  WITHIN_SLA = 'WITHIN_SLA',
  NEAR_DUE = 'NEAR_DUE',
  OVERDUE = 'OVERDUE',
  PAUSED = 'PAUSED',
  COMPLETED = 'COMPLETED',
}

export interface ProtocolSLA {
  id: string
  protocolId: string
  targetDays: number
  startDate: Date
  dueDate: Date
  expectedEndDate: Date
  actualEndDate?: Date
  completedAt?: Date
  pausedAt?: Date
  resumedAt?: Date
  totalPausedDays: number
  workingDays?: number
  calendarDays?: number
  isPaused?: boolean
  isOverdue?: boolean
  pausedReason?: string
  status: SLAStatus
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// INTERACTIONS (Interações/Comunicações)
// ============================================================================

export enum InteractionType {
  COMMENT = 'COMMENT',
  MESSAGE = 'MESSAGE',
  STATUS_CHANGE = 'STATUS_CHANGE',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ASSIGNMENT = 'ASSIGNMENT',
  ASSIGNED = 'ASSIGNED',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  DOCUMENT_REQUEST = 'DOCUMENT_REQUEST',
  NOTIFICATION = 'NOTIFICATION',
  PENDING_CREATED = 'PENDING_CREATED',
  PENDING_RESOLVED = 'PENDING_RESOLVED',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
  INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',
  APPROVAL = 'APPROVAL',
  REJECTION = 'REJECTION',
  CANCELLATION = 'CANCELLATION',
  NOTE = 'NOTE',
  SYSTEM = 'SYSTEM',
}

export enum InteractionVisibility {
  PUBLIC = 'PUBLIC',
  INTERNAL = 'INTERNAL',
  PRIVATE = 'PRIVATE',
}

export interface ProtocolInteraction {
  id: string
  protocolId: string
  userId?: string
  user?: {
    id: string
    name: string
    email: string
  }
  interactionType: InteractionType
  type?: InteractionType
  visibility: InteractionVisibility
  message: string
  authorName?: string
  authorType?: string
  isInternal?: boolean
  attachments?: any[]
  metadata?: any
  isRead: boolean
  readAt?: Date
  createdAt: Date
  updatedAt: Date
}

export interface CreateInteractionData {
  protocolId: string
  message: string
  interactionType: InteractionType
  visibility: InteractionVisibility
  metadata?: any
}

// ============================================================================
// DOCUMENTS (Documentos)
// ============================================================================

export enum DocumentStatus {
  PENDING = 'PENDING',
  UPLOADED = 'UPLOADED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED',
}

export interface ProtocolDocument {
  id: string
  protocolId: string
  documentName: string
  documentType: string
  documentUrl: string
  fileName: string
  fileUrl: string
  fileSize: number
  mimeType: string
  isRequired?: boolean
  uploadedById?: string
  uploadedBy?: {
    id: string
    name: string
    email: string
  }
  uploadedAt?: Date
  status: DocumentStatus
  validatedAt?: Date
  validatedById?: string
  validatedBy?: {
    id: string
    name: string
    email: string
  }
  rejectionReason?: string
  metadata?: any
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// PENDINGS (Pendências)
// ============================================================================

export enum PendingType {
  DOCUMENT = 'DOCUMENT',
  INFORMATION = 'INFORMATION',
  CORRECTION = 'CORRECTION',
  VALIDATION = 'VALIDATION',
  PAYMENT = 'PAYMENT',
}

export enum PendingStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

export enum PendingPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export interface ProtocolPending {
  id: string
  protocolId: string
  title: string
  description: string
  priority: PendingPriority
  status: PendingStatus
  dueDate?: Date
  blocksProgress?: boolean
  assignedToId?: string
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  createdById?: string
  createdBy?: {
    id: string
    name: string
    email: string
  }
  resolvedAt?: Date
  resolvedById?: string
  resolvedBy?: {
    id: string
    name: string
    email: string
  }
  resolutionNotes?: string
  createdAt: Date
  updatedAt: Date
}

// ============================================================================
// PROTOCOL DETAILS (Detalhes completos do protocolo)
// ============================================================================

export interface ProtocolDetails {
  id: string
  protocolNumber: string
  status: string
  createdAt: Date
  updatedAt: Date

  // Relacionamentos
  stages: ProtocolStage[]
  sla?: ProtocolSLA
  interactions: ProtocolInteraction[]
  documents: ProtocolDocument[]
  pendings: ProtocolPending[]

  // Informações adicionais
  citizen?: {
    id: string
    name: string
    email: string
    cpf: string
  }
  service?: {
    id: string
    name: string
    description: string
  }
  department?: {
    id: string
    name: string
  }
}

// ============================================================================
// ESTATÍSTICAS E ANALYTICS
// ============================================================================

export interface ProtocolStats {
  total: number
  byStatus: Record<string, number>
  averageCompletionDays: number
  slaCompliance: number
  pendingCount: number
  overdueCount: number
}

export interface WorkflowStats {
  totalStages: number
  completedStages: number
  inProgressStages: number
  pendingStages: number
  averageStageCompletionTime: number
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// ============================================================================
// CREATE/UPDATE DATA TYPES
// ============================================================================

export interface ModuleWorkflow {
  id: string
  name: string
  moduleType: string
  departmentId?: string
  stages: any[]
  defaultSLA?: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateWorkflowData {
  name: string
  moduleType: string
  departmentId?: string
  stages: any[]
  defaultSLA?: number
}

export interface CreateDocumentData {
  protocolId: string
  documentName: string
  documentType: string
  documentUrl: string
  fileSize: number
  mimeType: string
}

export interface UploadDocumentData {
  file: File
  documentType: string
  isRequired?: boolean
}

export interface DocumentCheckResult {
  isComplete: boolean
  missingDocuments: string[]
  uploadedDocuments: ProtocolDocument[]
}

export interface DocumentApprovalCheckResult {
  allApproved: boolean
  pendingApproval: ProtocolDocument[]
  rejectedDocuments: ProtocolDocument[]
}

export interface CreatePendingData {
  protocolId: string
  title: string
  description: string
  priority: PendingPriority
  type: PendingType
  dueDate?: Date
  blocksProgress?: boolean
}

export interface ResolvePendingData {
  resolutionNotes?: string
}

export interface CancelPendingData {
  cancellationReason?: string
}

export interface PendingCountByStatus {
  total: number
  byStatus: Record<PendingStatus, number>
}

export interface CreateSLAData {
  protocolId: string
  targetDays: number
  startDate: Date
}

export interface SLAStats {
  averageCompletionDays: number
  onTimeRate: number
  overdueRate: number
  pausedCount: number
}

export interface CreateStageData {
  protocolId: string
  stageName: string
  stageDescription?: string
  stageOrder: number
  dueDate?: Date
}

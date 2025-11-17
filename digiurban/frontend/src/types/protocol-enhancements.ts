/**
 * Tipos para o sistema aprimorado de protocolos
 * Fase 1: Interações, Documentos e Pendências
 */

// ============================================================================
// INTERAÇÕES
// ============================================================================

export enum InteractionType {
  MESSAGE = 'MESSAGE',
  DOCUMENT_REQUEST = 'DOCUMENT_REQUEST',
  DOCUMENT_UPLOAD = 'DOCUMENT_UPLOAD',
  PENDING_CREATED = 'PENDING_CREATED',
  PENDING_RESOLVED = 'PENDING_RESOLVED',
  STATUS_CHANGED = 'STATUS_CHANGED',
  ASSIGNED = 'ASSIGNED',
  INSPECTION_SCHEDULED = 'INSPECTION_SCHEDULED',
  INSPECTION_COMPLETED = 'INSPECTION_COMPLETED',
  APPROVAL = 'APPROVAL',
  REJECTION = 'REJECTION',
  CANCELLATION = 'CANCELLATION',
  NOTE = 'NOTE',
}

export interface ProtocolInteraction {
  id: string;
  protocolId: string;
  type: InteractionType;
  authorType: 'CITIZEN' | 'SERVER' | 'SYSTEM';
  authorId?: string;
  authorName: string;
  message?: string;
  metadata?: any;
  isInternal: boolean;
  isRead: boolean;
  readAt?: string;
  attachments?: any;
  createdAt: string;
}

export interface CreateInteractionData {
  type?: InteractionType;
  message?: string;
  isInternal?: boolean;
  attachments?: any;
  metadata?: any;
}

// ============================================================================
// DOCUMENTOS
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
  id: string;
  protocolId: string;
  documentType: string;
  isRequired: boolean;
  status: DocumentStatus;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedAt?: string;
  uploadedBy?: string;
  validatedAt?: string;
  validatedBy?: string;
  rejectedAt?: string;
  rejectionReason?: string;
  version: number;
  previousDocId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDocumentData {
  documentType: string;
  isRequired?: boolean;
}

export interface UploadDocumentData {
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

export interface DocumentCheckResult {
  total: number;
  uploaded: number;
  pending: number;
  allUploaded: boolean;
}

export interface DocumentApprovalCheckResult {
  total: number;
  approved: number;
  pending: number;
  allApproved: boolean;
}

// ============================================================================
// PENDÊNCIAS
// ============================================================================

export enum PendingType {
  DOCUMENT = 'DOCUMENT',
  INFORMATION = 'INFORMATION',
  CORRECTION = 'CORRECTION',
  VALIDATION = 'VALIDATION',
  PAYMENT = 'PAYMENT',
  INSPECTION = 'INSPECTION',
  APPROVAL = 'APPROVAL',
  OTHER = 'OTHER',
}

export enum PendingStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
}

export interface ProtocolPending {
  id: string;
  protocolId: string;
  type: PendingType;
  title: string;
  description: string;
  dueDate?: string;
  status: PendingStatus;
  resolvedAt?: string;
  resolvedBy?: string;
  resolution?: string;
  blocksProgress: boolean;
  metadata?: any;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePendingData {
  type: PendingType;
  title: string;
  description: string;
  dueDate?: string;
  blocksProgress?: boolean;
  metadata?: any;
}

export interface ResolvePendingData {
  resolution: string;
}

export interface CancelPendingData {
  reason: string;
}

export interface PendingCountByStatus {
  [PendingStatus.OPEN]?: number;
  [PendingStatus.IN_PROGRESS]?: number;
  [PendingStatus.RESOLVED]?: number;
  [PendingStatus.EXPIRED]?: number;
  [PendingStatus.CANCELLED]?: number;
}

// ============================================================================
// WORKFLOW E ETAPAS
// ============================================================================

export enum StageStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  SKIPPED = 'SKIPPED',
  FAILED = 'FAILED',
}

export interface ProtocolStage {
  id: string;
  protocolId: string;
  stageName: string;
  stageOrder: number;
  status: StageStatus;
  startedAt?: string;
  completedAt?: string;
  dueDate?: string;
  assignedTo?: string;
  completedBy?: string;
  result?: string;
  notes?: string;
  metadata?: any;
}

export interface CreateStageData {
  stageName: string;
  stageOrder: number;
  assignedTo?: string;
  dueDate?: string;
  metadata?: any;
}

export interface WorkflowStage {
  name: string;
  order: number;
  slaDays?: number;
  requiredDocuments?: string[];
  requiredActions?: string[];
  canSkip?: boolean;
  skipCondition?: string;
}

export interface ModuleWorkflow {
  id: string;
  moduleType: string;
  name: string;
  description?: string;
  stages: WorkflowStage[];
  defaultSLA?: number;
  rules?: any;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkflowData {
  moduleType: string;
  name: string;
  description?: string;
  stages: WorkflowStage[];
  defaultSLA?: number;
  rules?: any;
}

// ============================================================================
// SLA (Service Level Agreement)
// ============================================================================

export interface ProtocolSLA {
  id: string;
  protocolId: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  isPaused: boolean;
  pausedAt?: string;
  pausedReason?: string;
  totalPausedDays: number;
  isOverdue: boolean;
  daysOverdue: number;
  workingDays: number;
  calendarDays: number;
  updatedAt: string;
}

export interface CreateSLAData {
  workingDays: number;
  startDate?: string;
}

export interface SLAStats {
  total: number;
  completed: number;
  onTime: number;
  overdue: number;
  paused: number;
  active: number;
  complianceRate: number;
}

// ============================================================================
// RESPOSTAS DA API
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: string;
  message?: string;
}

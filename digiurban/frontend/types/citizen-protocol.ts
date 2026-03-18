/**
 * Tipos compartilhados para visualização de protocolos do cidadão
 */

export interface CitizenProtocol {
  id: string;
  number: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  service: {
    id: string;
    name: string;
    description?: string | null;
    estimatedDays?: number | null;
    category?: string | null;
  };
  department: {
    id: string;
    name: string;
  };
  citizen: {
    id: string;
    name: string;
    cpf?: string;
  };
  customData?: Record<string, any>;
  history?: CitizenProtocolHistory[];
  _count?: {
    history: number;
    evaluations: number;
  };
  openCitizenPendingsCount?: number;
}

export interface CitizenProtocolHistory {
  id: string;
  action: string;
  comment: string | null;
  timestamp: string;
}

export interface CitizenWorkflowStage {
  id: string;
  stageName: string;
  stageOrder: number;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  metadata?: any;
}

export interface CitizenPending {
  id: string;
  protocolId?: string;
  stageId?: string;
  pendingType?: string;
  type: string;
  title?: string;
  description: string;
  status: string;
  priority?: number;
  requiresCitizenAction?: boolean;
  blocksProgress?: boolean;
  dueDate?: string | null;
  createdAt: string;
  submittedAt?: string | null;
  resolvedAt?: string | null;
  resolution?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  reviewNotes?: string | null;
  requiresReview?: boolean;
  sourceType?: string | null;
  sourceEntityType?: string | null;
  sourceEntityId?: string | null;
  metadata?: Record<string, any>;
}

export interface CitizenDocument {
  id: string;
  type: string;
  fileName: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'UPLOADED';
  uploadedAt: string;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
  fileUrl?: string;
  fileSize?: number | null;
  mimeType?: string | null;
}

export interface CitizenGeneratedDocument {
  id: string;
  type: string;
  name: string;
  generatedAt: string;
  expiresAt?: string | null;
  validationCode?: string | null;
  fileUrl?: string;
  metadata?: Record<string, any>;
}

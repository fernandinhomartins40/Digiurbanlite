/**
 * ============================================================================
 * DOCUMENT TYPES
 * ============================================================================
 * Tipos e interfaces para documentos e upload
 */

/**
 * Configuração de documento no serviço
 */
export interface DocumentConfig {
  name: string;
  description?: string;
  required: boolean;
  acceptedFormats: string[];
  allowCameraUpload: boolean;
  maxSizeMB: number;
}

/**
 * Documento armazenado no protocolo
 */
export interface ProtocolDocument {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
  uploadedBy?: string;
  documentType?: string; // Tipo do documento (ex: "CPF", "RG")
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
}

/**
 * Resultado de validação de documento
 */
export interface DocumentValidationResult {
  valid: boolean;
  error?: string;
  errorCode?: string;
  details?: Record<string, any>;
}

/**
 * Informações de arquivo enviado
 */
export interface UploadedFileInfo {
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  uploadedAt: Date;
  documentType?: string;
}

/**
 * Requisição de upload
 */
export interface DocumentUploadRequest {
  protocolId: string;
  documentType?: string;
  files: Express.Multer.File[];
  citizenId: string;
  metadata?: Record<string, any>;
}

/**
 * Resposta de upload
 */
export interface DocumentUploadResponse {
  success: boolean;
  message: string;
  files: UploadedFileInfo[];
  protocol?: {
    id: string;
    number: string;
  };
}

/**
 * Filtro de busca de documentos
 */
export interface DocumentFilter {
  protocolId?: string;
  citizenId?: string;
  documentType?: string;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  uploadedAfter?: Date;
  uploadedBefore?: Date;
}

/**
 * Metadados de arquivo
 */
export interface FileMetadata {
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  extension: string;
  basename: string;
  mimetype?: string;
  exists: boolean;
}

/**
 * Configuração de segurança de upload
 */
export interface UploadSecurityConfig {
  maxFileSize: number;
  maxFiles: number;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
  blockedExtensions: string[];
  scanForMalware: boolean;
}

/**
 * Estatísticas de documento
 */
export interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  byType: Record<string, number>;
  byStatus: Record<string, number>;
  byMimeType: Record<string, number>;
}

/**
 * Opções de download de documento
 */
export interface DocumentDownloadOptions {
  inline?: boolean; // true = visualizar no navegador, false = download
  filename?: string; // Nome personalizado para download
}

/**
 * Auditoria de documento
 */
export interface DocumentAudit {
  documentId: string;
  action: 'UPLOAD' | 'DOWNLOAD' | 'DELETE' | 'APPROVE' | 'REJECT' | 'VIEW';
  performedBy: string;
  performedAt: Date;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

/**
 * Permissões de documento
 */
export interface DocumentPermissions {
  canView: boolean;
  canDownload: boolean;
  canDelete: boolean;
  canApprove: boolean;
  canReject: boolean;
  reason?: string; // Motivo de negação de permissão
}

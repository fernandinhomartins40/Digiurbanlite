/**
 * ============================================================================
 * DOCUMENT INTEGRITY SERVICE - FASE 2
 * ============================================================================
 *
 * Valida integridade entre documentos no banco e arquivos físicos
 */

import { prisma } from '../lib/prisma';
import { DocumentStatus } from '@prisma/client';
import { getProtocolFilePath, extractFilename } from '../config/upload';
import fs from 'fs';

export interface DocumentIntegrityResult {
  valid: boolean;
  documentId: string;
  protocolId: string;
  documentType: string;
  fileUrl: string | null;
  fileExists: boolean;
  currentStatus: DocumentStatus;
  expectedStatuses: DocumentStatus[];
  reason: string;
}

export interface ProtocolIntegrityResult {
  protocolId: string;
  protocolNumber: string;
  totalDocuments: number;
  validDocuments: number;
  invalidDocuments: number;
  details: DocumentIntegrityResult[];
}

/**
 * Valida integridade de um documento individual
 */
export async function validateDocumentIntegrity(
  documentId: string
): Promise<DocumentIntegrityResult> {
  const doc = await prisma.protocolDocument.findUnique({
    where: { id: documentId },
    include: {
      protocol: {
        select: {
          id: true,
          number: true
        }
      }
    }
  });

  if (!doc) {
    return {
      valid: false,
      documentId,
      protocolId: '',
      documentType: '',
      fileUrl: null,
      fileExists: false,
      currentStatus: DocumentStatus.PENDING,
      expectedStatuses: [],
      reason: 'Documento não encontrado no banco de dados'
    };
  }

  // Se não tem fileUrl, deve estar PENDING
  if (!doc.fileUrl) {
    const valid = doc.status === DocumentStatus.PENDING;
    return {
      valid,
      documentId: doc.id,
      protocolId: doc.protocolId,
      documentType: doc.documentType,
      fileUrl: null,
      fileExists: false,
      currentStatus: doc.status,
      expectedStatuses: [DocumentStatus.PENDING],
      reason: valid
        ? 'Documento pendente (sem arquivo esperado)'
        : `Status inconsistente: ${doc.status} sem arquivo (deveria ser PENDING)`
    };
  }

  // Verificar se arquivo existe fisicamente
  const filename = extractFilename(doc.fileUrl);
  const filePath = getProtocolFilePath(doc.protocolId, filename);
  const fileExists = fs.existsSync(filePath);

  // Determinar status esperados baseado na existência do arquivo
  const expectedStatuses: DocumentStatus[] = fileExists
    ? [DocumentStatus.UPLOADED, DocumentStatus.UNDER_REVIEW, DocumentStatus.APPROVED, DocumentStatus.REJECTED]
    : [DocumentStatus.PENDING];

  const valid = expectedStatuses.includes(doc.status);

  return {
    valid,
    documentId: doc.id,
    protocolId: doc.protocolId,
    documentType: doc.documentType,
    fileUrl: doc.fileUrl,
    fileExists,
    currentStatus: doc.status,
    expectedStatuses,
    reason: valid
      ? 'Documento íntegro'
      : fileExists
      ? `Arquivo existe mas status está ${doc.status} (esperado: ${expectedStatuses.join(' ou ')})`
      : `Arquivo não existe mas status está ${doc.status} (esperado: PENDING)`
  };
}

/**
 * Valida integridade de todos os documentos de um protocolo
 */
export async function validateProtocolIntegrity(
  protocolId: string
): Promise<ProtocolIntegrityResult> {
  const protocol = await prisma.protocolSimplified.findUnique({
    where: { id: protocolId },
    select: { id: true, number: true }
  });

  if (!protocol) {
    throw new Error('Protocolo não encontrado');
  }

  const documents = await prisma.protocolDocument.findMany({
    where: { protocolId },
    select: { id: true }
  });

  const details: DocumentIntegrityResult[] = [];

  for (const doc of documents) {
    const result = await validateDocumentIntegrity(doc.id);
    details.push(result);
  }

  const validDocuments = details.filter(d => d.valid).length;

  return {
    protocolId: protocol.id,
    protocolNumber: protocol.number,
    totalDocuments: documents.length,
    validDocuments,
    invalidDocuments: documents.length - validDocuments,
    details
  };
}

/**
 * Auditoria completa de todos os documentos do sistema
 */
export async function auditAllDocuments(): Promise<{
  totalDocuments: number;
  validDocuments: number;
  invalidDocuments: number;
  pendingCount: number;
  uploadedCount: number;
  approvedCount: number;
  rejectedCount: number;
  filesWithoutDb: number;
  dbWithoutFiles: number;
  invalidDetails: DocumentIntegrityResult[];
}> {
  const allDocuments = await prisma.protocolDocument.findMany({
    select: { id: true, status: true }
  });

  const results: DocumentIntegrityResult[] = [];
  let dbWithoutFiles = 0;

  for (const doc of allDocuments) {
    const result = await validateDocumentIntegrity(doc.id);
    results.push(result);

    if (result.fileUrl && !result.fileExists) {
      dbWithoutFiles++;
    }
  }

  const validDocuments = results.filter(r => r.valid).length;
  const invalidDetails = results.filter(r => !r.valid);

  // Contar por status
  const statusCounts = allDocuments.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {} as Record<DocumentStatus, number>);

  return {
    totalDocuments: allDocuments.length,
    validDocuments,
    invalidDocuments: results.length - validDocuments,
    pendingCount: statusCounts[DocumentStatus.PENDING] || 0,
    uploadedCount: statusCounts[DocumentStatus.UPLOADED] || 0,
    approvedCount: statusCounts[DocumentStatus.APPROVED] || 0,
    rejectedCount: statusCounts[DocumentStatus.REJECTED] || 0,
    filesWithoutDb: 0, // Calculado em scanOrphanFiles()
    dbWithoutFiles,
    invalidDetails
  };
}

/**
 * Reconcilia um documento com estado inconsistente
 * SIMPLIFICADO: Apenas marca como PENDING se arquivo não existe
 */
export async function reconcileDocument(
  documentId: string
): Promise<{ fixed: boolean; action: string; result?: DocumentIntegrityResult }> {
  const validation = await validateDocumentIntegrity(documentId);

  if (validation.valid) {
    return {
      fixed: false,
      action: 'Documento íntegro - nenhuma ação necessária'
    };
  }

  // Único caso: Tem fileUrl mas arquivo não existe → Resetar para PENDING
  if (validation.fileUrl && !validation.fileExists) {
    await prisma.protocolDocument.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.PENDING,
        fileUrl: null,
        fileName: null,
        fileSize: null,
        mimeType: null,
        uploadedAt: null,
        uploadedBy: null
      }
    });

    return {
      fixed: true,
      action: 'Reset para PENDING (arquivo físico ausente)',
      result: await validateDocumentIntegrity(documentId)
    };
  }

  // Qualquer outro caso: Intervenção manual
  return {
    fixed: false,
    action: `Estado inconsistente (${validation.reason}) - verificar manualmente`
  };
}

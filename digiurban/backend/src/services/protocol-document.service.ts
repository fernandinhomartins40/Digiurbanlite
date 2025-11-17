import { DocumentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';

export interface CreateDocumentData {
  protocolId: string;
  documentType: string;
  isRequired: boolean;
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  uploadedBy?: string;
}

export interface UpdateDocumentData {
  fileName?: string;
  fileUrl?: string;
  fileSize?: number;
  mimeType?: string;
  status?: DocumentStatus;
  uploadedBy?: string;
  validatedBy?: string;
  rejectionReason?: string;
}

/**
 * Cria um novo documento no protocolo
 */
export async function createProtocolDocument(data: CreateDocumentData) {
  return prisma.protocolDocument.create({
    data: {
      protocolId: data.protocolId,
      documentType: data.documentType,
      isRequired: data.isRequired,
      fileName: data.fileName,
      fileUrl: data.fileUrl,
      fileSize: data.fileSize,
      mimeType: data.mimeType,
      uploadedBy: data.uploadedBy,
      status: data.fileUrl ? DocumentStatus.UPLOADED : DocumentStatus.PENDING,
      uploadedAt: data.fileUrl ? new Date() : undefined
        },
    include: {
      protocol: {
        select: {
          id: true,
          number: true
        }
      }
        }
        });
}

/**
 * Lista todos os documentos de um protocolo
 */
export async function getProtocolDocuments(protocolId: string) {
  return prisma.protocolDocument.findMany({
    where: { protocolId },
    orderBy: [
      { isRequired: 'desc' },
      { createdAt: 'asc' },
    ]
        });
}

/**
 * Obtém um documento específico
 */
export async function getDocumentById(documentId: string) {
  return prisma.protocolDocument.findUnique({
    where: { id: documentId },
    include: {
      protocol: true
        }
      });
}

/**
 * Faz upload de um documento (atualiza com arquivo)
 */
export async function uploadDocument(
  documentId: string,
  fileData: {
    fileName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
    uploadedBy: string;
  }
) {
  // Buscar o documento atual para criar versão
  const currentDoc = await prisma.protocolDocument.findUnique({
    where: { id: documentId }
        });

  if (!currentDoc) {
    throw new Error('Documento não encontrado');
  }

  // Se já existe um arquivo, criar nova versão
  if (currentDoc.fileUrl) {
    const newVersion = currentDoc.version + 1;

    return prisma.protocolDocument.update({
      where: { id: documentId },
      data: {
        fileName: fileData.fileName,
        fileUrl: fileData.fileUrl,
        fileSize: fileData.fileSize,
        mimeType: fileData.mimeType,
        uploadedBy: fileData.uploadedBy,
        uploadedAt: new Date(),
        status: DocumentStatus.UPLOADED,
        version: newVersion,
        previousDocId: documentId, // Referência à versão anterior
      }
        });
  }

  // Primeiro upload
  return prisma.protocolDocument.update({
    where: { id: documentId },
    data: {
      fileName: fileData.fileName,
      fileUrl: fileData.fileUrl,
      fileSize: fileData.fileSize,
      mimeType: fileData.mimeType,
      uploadedBy: fileData.uploadedBy,
      uploadedAt: new Date(),
      status: DocumentStatus.UPLOADED
        }
        });
}

/**
 * Aprova um documento
 */
export async function approveDocument(
  documentId: string,
  validatedBy: string
) {
  return prisma.protocolDocument.update({
    where: { id: documentId },
    data: {
      status: DocumentStatus.APPROVED,
      validatedBy,
      validatedAt: new Date(),
      rejectionReason: null
        }
        });
}

/**
 * Rejeita um documento
 */
export async function rejectDocument(
  documentId: string,
  validatedBy: string,
  rejectionReason: string
) {
  return prisma.protocolDocument.update({
    where: { id: documentId },
    data: {
      status: DocumentStatus.REJECTED,
      validatedBy,
      rejectedAt: new Date(),
      rejectionReason
        }
        });
}

/**
 * Marca documento como em análise
 */
export async function markDocumentUnderReview(documentId: string) {
  return prisma.protocolDocument.update({
    where: { id: documentId },
    data: {
      status: DocumentStatus.UNDER_REVIEW
        }
        });
}

/**
 * Verifica se todos os documentos obrigatórios foram enviados
 */
export async function checkRequiredDocuments(protocolId: string) {
  const required = await prisma.protocolDocument.count({
    where: {
      protocolId,
      isRequired: true
        }
        });

  const uploaded = await prisma.protocolDocument.count({
    where: {
      protocolId,
      isRequired: true,
      status: {
        in: [DocumentStatus.UPLOADED, DocumentStatus.UNDER_REVIEW, DocumentStatus.APPROVED]
        }
        }
        });

  return {
    total: required,
    uploaded,
    pending: required - uploaded,
    allUploaded: required === uploaded
        };
}

/**
 * Verifica se todos os documentos foram aprovados
 */
export async function checkAllDocumentsApproved(protocolId: string) {
  const required = await prisma.protocolDocument.count({
    where: {
      protocolId,
      isRequired: true
        }
        });

  const approved = await prisma.protocolDocument.count({
    where: {
      protocolId,
      isRequired: true,
      status: DocumentStatus.APPROVED
        }
        });

  return {
    total: required,
    approved,
    pending: required - approved,
    allApproved: required === approved
        };
}

/**
 * Deleta um documento
 */
export async function deleteDocument(documentId: string) {
  return prisma.protocolDocument.delete({
    where: { id: documentId }
        });
}

/**
 * Solicita um novo documento ao cidadão
 */
export async function requestDocument(
  protocolId: string,
  documentType: string,
  isRequired: boolean = true
) {
  return createProtocolDocument({
    protocolId,
    documentType,
    isRequired
        });
}

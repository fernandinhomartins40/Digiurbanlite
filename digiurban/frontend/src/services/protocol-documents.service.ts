/**
 * Serviço de API para Documentos de Protocolos
 */

import {
  ProtocolDocument,
  CreateDocumentData,
  UploadDocumentData,
  DocumentCheckResult,
  DocumentApprovalCheckResult,
  ApiResponse,
} from '@/types/protocol-enhancements';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

/**
 * Cria/Solicita um novo documento
 */
export async function createDocument(
  protocolId: string,
  data: CreateDocumentData,
  token: string
): Promise<ProtocolDocument> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/documents`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result: ApiResponse<ProtocolDocument> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao criar documento');
  }

  return result.data!;
}

/**
 * Lista todos os documentos de um protocolo
 */
export async function getProtocolDocuments(
  protocolId: string,
  token: string
): Promise<ProtocolDocument[]> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/documents`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolDocument[]> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao listar documentos');
  }

  return result.data!;
}

/**
 * Obtém um documento específico
 */
export async function getDocument(
  protocolId: string,
  documentId: string,
  token: string
): Promise<ProtocolDocument> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/documents/${documentId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolDocument> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao obter documento');
  }

  return result.data!;
}

/**
 * Faz upload de um documento
 */
export async function uploadDocument(
  protocolId: string,
  documentId: string,
  data: UploadDocumentData,
  token: string
): Promise<ProtocolDocument> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/documents/${documentId}/upload`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  const result: ApiResponse<ProtocolDocument> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao fazer upload de documento');
  }

  return result.data!;
}

/**
 * Aprova um documento
 */
export async function approveDocument(
  protocolId: string,
  documentId: string,
  token: string
): Promise<ProtocolDocument> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/documents/${documentId}/approve`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolDocument> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao aprovar documento');
  }

  return result.data!;
}

/**
 * Rejeita um documento
 */
export async function rejectDocument(
  protocolId: string,
  documentId: string,
  rejectionReason: string,
  token: string
): Promise<ProtocolDocument> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/documents/${documentId}/reject`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ rejectionReason }),
    }
  );

  const result: ApiResponse<ProtocolDocument> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao rejeitar documento');
  }

  return result.data!;
}

/**
 * Marca documento como em análise
 */
export async function markDocumentUnderReview(
  protocolId: string,
  documentId: string,
  token: string
): Promise<ProtocolDocument> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/documents/${documentId}/review`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<ProtocolDocument> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao marcar documento em análise');
  }

  return result.data!;
}

/**
 * Verifica documentos obrigatórios
 */
export async function checkRequiredDocuments(
  protocolId: string,
  token: string
): Promise<DocumentCheckResult> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/documents/check-required`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<DocumentCheckResult> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao verificar documentos obrigatórios');
  }

  return result.data!;
}

/**
 * Verifica se todos documentos estão aprovados
 */
export async function checkAllDocumentsApproved(
  protocolId: string,
  token: string
): Promise<DocumentApprovalCheckResult> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/documents/check-approved`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<DocumentApprovalCheckResult> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao verificar documentos aprovados');
  }

  return result.data!;
}

/**
 * Deleta um documento
 */
export async function deleteDocument(
  protocolId: string,
  documentId: string,
  token: string
): Promise<void> {
  const response = await fetch(
    `${API_URL}/protocols/${protocolId}/documents/${documentId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const result: ApiResponse<any> = await response.json();

  if (!response.ok || !result.success) {
    throw new Error(result.error || 'Erro ao deletar documento');
  }
}

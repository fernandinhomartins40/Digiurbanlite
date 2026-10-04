/**
 * Resposta do cidadão a uma pendência (texto, dados corrigidos ou documentos).
 *
 * Um caminho só para o portal (/api/citizen/protocols) e para o DigiBot
 * (/api/internal) — antes a mesma lógica estava copiada nas duas rotas e
 * correções feitas numa não chegavam na outra.
 */

import path from 'path';
import fs from 'fs';
import { DocumentStatus } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { ensureProtocolDir, getProtocolFileUrl, moveUploadedFileSync } from '../config/upload';
import { sanitizeDocumentId, mapUploadedFilesToDocuments } from '../utils/document-mapping';
import { uploadDocument } from './protocol-document.service';
import * as pendingService from './protocol-pending.service';
import * as dataFieldService from './protocol-data-field.service';

/** Erro de validação da resposta: vira 400 com a mensagem para o cidadão */
export class PendingResponseError extends Error {
  public statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = 'PendingResponseError';
    this.statusCode = statusCode;
  }
}

function metadataOf(pending: any): Record<string, any> {
  return pending?.metadata && typeof pending.metadata === 'object' && !Array.isArray(pending.metadata)
    ? pending.metadata as Record<string, any>
    : {};
}

export function parseResolutionInput(rawResolution: unknown) {
  if (typeof rawResolution !== 'string') {
    return { text: '', payload: null as Record<string, any> | null };
  }

  const trimmed = rawResolution.trim();
  if (!trimmed) {
    return { text: '', payload: null as Record<string, any> | null };
  }

  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return { text: trimmed, payload: parsed as Record<string, any> };
    }
  } catch {
    // Segue como texto simples
  }

  return { text: trimmed, payload: null as Record<string, any> | null };
}

export function getPendingFieldRequests(pending: any) {
  const metadata = metadataOf(pending);

  if (Array.isArray(metadata.fields) && metadata.fields.length > 0) {
    return metadata.fields.map((field: any) => ({
      fieldId: typeof field?.id === 'string' ? field.id : undefined,
      fieldKey: typeof field?.key === 'string' ? field.key : undefined,
      fieldLabel: typeof field?.label === 'string' ? field.label : undefined,
      fieldType: typeof field?.type === 'string' ? field.type : undefined,
      required: field?.required !== false,
    }));
  }

  if (metadata.fieldId || metadata.fieldKey || metadata.fieldLabel) {
    return [{
      fieldId: typeof metadata.fieldId === 'string' ? metadata.fieldId : undefined,
      fieldKey: typeof metadata.fieldKey === 'string' ? metadata.fieldKey : undefined,
      fieldLabel: typeof metadata.fieldLabel === 'string' ? metadata.fieldLabel : undefined,
      fieldType: typeof metadata.fieldType === 'string' ? metadata.fieldType : undefined,
      required: true,
    }];
  }

  return [];
}

export function getPendingDocumentRequests(pending: any) {
  const metadata = metadataOf(pending);

  if (Array.isArray(metadata.documentRequests) && metadata.documentRequests.length > 0) {
    return metadata.documentRequests.map((document: any, index: number) => ({
      id: String(document?.id || document?.documentId || document?.documentType || document?.name || `document-${index}`),
      documentId: typeof document?.documentId === 'string' ? document.documentId : undefined,
      documentType: String(document?.documentType || document?.name || pending.title || `Documento ${index + 1}`),
      label: String(document?.label || document?.name || document?.documentType || pending.title || `Documento ${index + 1}`),
      required: document?.required !== false,
    }));
  }

  return [{
    id: String(metadata.documentId || metadata.documentType || pending.id),
    documentId: typeof metadata.documentId === 'string' ? metadata.documentId : undefined,
    documentType: String(metadata.documentType || pending.title || 'DOCUMENTO_PENDENCIA'),
    label: String(metadata.documentLabel || metadata.documentType || pending.title || 'Documento solicitado'),
    required: true,
  }];
}

export function parsePendingUploadMetadata(rawMetadata: unknown, filesCount: number) {
  if (!rawMetadata || typeof rawMetadata !== 'string') {
    return [];
  }

  try {
    const parsed = JSON.parse(rawMetadata);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.slice(0, filesCount).map((item: any) => ({
      documentId: item?.docId || item?.documentId || undefined,
      documentType: item?.documentType || item?.name || undefined,
      required: item?.required !== false,
    }));
  } catch {
    return [];
  }
}

/** A pendência precisa existir, ser do protocolo e estar esperando resposta */
export async function loadAnswerablePending(protocolId: string, pendingId: string) {
  const pending = await prisma.protocolPending.findFirst({
    where: { id: pendingId, protocolId },
  });

  if (!pending) {
    throw new PendingResponseError('Pendência não encontrada', 404);
  }

  if (!['OPEN', 'IN_PROGRESS'].includes(pending.status)) {
    throw new PendingResponseError(
      pending.status === 'UNDER_REVIEW'
        ? 'A pendência já recebeu sua resposta e aguarda análise da equipe'
        : 'Pendência já foi resolvida ou cancelada',
      409
    );
  }

  return pending;
}

/** Resposta em texto ou dados corrigidos */
export async function submitPendingText(
  protocolId: string,
  pending: any,
  citizenId: string,
  resolution: unknown
) {
  const { text, payload } = parseResolutionInput(resolution);

  const fieldRequests = getPendingFieldRequests(pending);
  if (fieldRequests.length > 0) {
    const submittedFields = fieldRequests.map((field: any, index: number) => {
      const candidateValue =
        typeof payload?.[String(field.fieldId || '')] === 'string' ? payload?.[String(field.fieldId || '')] :
        typeof payload?.[String(field.fieldKey || '')] === 'string' ? payload?.[String(field.fieldKey || '')] :
        fieldRequests.length === 1 && typeof payload?.value === 'string' ? payload.value :
        fieldRequests.length === 1 ? text :
        '';

      return {
        ...field,
        value: candidateValue?.trim(),
        index,
      };
    });

    const missingFields = submittedFields.filter((field: any) => field.required !== false && !field.value);
    if (missingFields.length > 0) {
      throw new PendingResponseError(
        `Informe os dados solicitados: ${missingFields.map((field: any) => field.fieldLabel || field.fieldKey || `campo ${field.index + 1}`).join(', ')}`
      );
    }

    const answered = submittedFields.filter((field: any) => field.value);

    await dataFieldService.applyPendingFieldResponses(
      answered.map((field: any) => ({
        protocolId,
        fieldId: field.fieldId,
        fieldKey: field.fieldKey,
        fieldLabel: field.fieldLabel,
        fieldType: field.fieldType,
        value: String(field.value),
        correctedBy: citizenId,
        required: field.required,
      }))
    );

    const summary = answered
      .map((field: any) => `${field.fieldLabel || field.fieldKey || 'Campo'}: ${field.value}`)
      .join('\n');

    await pendingService.submitPendingResponse(pending.id, citizenId, summary, {
      fields: submittedFields.map((field: any) => ({
        id: field.fieldId || field.fieldKey,
        key: field.fieldKey || field.fieldId,
        label: field.fieldLabel || field.fieldKey || 'Campo',
        type: field.fieldType || 'text',
        required: field.required !== false,
      })),
      submittedFields: answered.map((field: any) => ({
        id: field.fieldId || field.fieldKey,
        key: field.fieldKey || field.fieldId,
        label: field.fieldLabel || field.fieldKey || 'Campo',
        value: field.value,
      })),
    });

    return prisma.protocolPending.findUnique({ where: { id: pending.id } });
  }

  if (!text) {
    throw new PendingResponseError('Escreva a resposta da pendência.');
  }

  await pendingService.submitPendingResponse(pending.id, citizenId, text);
  return prisma.protocolPending.findUnique({ where: { id: pending.id } });
}

/** Resposta com documento(s) */
export async function submitPendingDocuments(
  protocolId: string,
  pending: any,
  citizenId: string,
  files: Express.Multer.File[],
  rawUploadMetadata?: unknown
) {
  const discardFiles = (list: Express.Multer.File[]) => {
    for (const file of list) {
      fs.promises.unlink(file.path).catch(() => undefined);
    }
  };

  if (pending.type !== 'DOCUMENT') {
    discardFiles(files);
    throw new PendingResponseError('Esta pendência não aceita envio de documento.');
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new PendingResponseError('Envie o documento solicitado.');
  }

  const requestedDocuments = getPendingDocumentRequests(pending);
  const uploadMetadata = parsePendingUploadMetadata(rawUploadMetadata, files.length);

  const mapping = mapUploadedFilesToDocuments(
    files.map((file, index) => ({
      documentId: sanitizeDocumentId(
        String(
          uploadMetadata[index]?.documentId ||
          uploadMetadata[index]?.documentType ||
          file.originalname
        )
      ),
      name: file.originalname,
    })),
    requestedDocuments.map((document: any) => ({
      id: sanitizeDocumentId(document.id || document.documentType || document.label),
      name: document.label,
      required: document.required !== false,
    }))
  );

  if (mapping.missingRequired.length > 0) {
    discardFiles(files);
    throw new PendingResponseError(`Ainda faltam documentos obrigatórios: ${mapping.missingRequired.join(', ')}`);
  }

  const uploadedDocuments: Array<{ id: string; documentType: string; fileName: string }> = [];
  const usedFileIndexes = new Set<number>();
  const protocolDir = ensureProtocolDir(protocolId);

  for (const requestedDocument of requestedDocuments) {
    const requiredId = sanitizeDocumentId(requestedDocument.id || requestedDocument.documentType || requestedDocument.label);
    const fileIndex = mapping.mapped.get(requiredId);
    if (fileIndex === undefined) {
      continue;
    }

    usedFileIndexes.add(fileIndex);
    const file = files[fileIndex];
    moveUploadedFileSync(file.path, path.join(protocolDir, file.filename));

    let targetDocumentId = requestedDocument.documentId;
    if (!targetDocumentId) {
      const existingDocument = await prisma.protocolDocument.findFirst({
        where: { protocolId, documentType: requestedDocument.documentType },
        orderBy: { createdAt: 'asc' },
      });

      targetDocumentId = existingDocument
        ? existingDocument.id
        : (await prisma.protocolDocument.create({
            data: {
              protocolId,
              documentType: requestedDocument.documentType,
              isRequired: requestedDocument.required !== false,
              status: DocumentStatus.PENDING,
            },
          })).id;
    }

    const updatedDocument = await uploadDocument(targetDocumentId, {
      fileName: file.originalname,
      fileUrl: getProtocolFileUrl(protocolId, file.filename),
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedBy: citizenId,
    }, {
      skipPendingSubmission: true,
    });

    uploadedDocuments.push({
      id: updatedDocument.id,
      documentType: updatedDocument.documentType,
      fileName: updatedDocument.fileName || file.originalname,
    });
  }

  // Arquivos que não corresponderam a nenhum documento pedido ficavam no disco
  discardFiles(files.filter((_, index) => !usedFileIndexes.has(index)));

  const resolutionText = uploadedDocuments.length === 1
    ? `Documento enviado: ${uploadedDocuments[0].documentType}`
    : `Documentos enviados: ${uploadedDocuments.map((document) => document.documentType).join(', ')}`;

  await pendingService.submitPendingResponse(pending.id, citizenId, resolutionText, {
    documentRequests: requestedDocuments,
    submittedDocuments: uploadedDocuments,
  });

  return prisma.protocolPending.findUnique({ where: { id: pending.id } });
}

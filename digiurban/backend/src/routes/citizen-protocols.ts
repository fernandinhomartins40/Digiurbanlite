/**
 * ============================================================================
 * CITIZEN PROTOCOLS ROUTES
 * ============================================================================
 * Rotas para cidadãos acessarem seus protocolos
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { upload, getProtocolFileUrl, ensureProtocolDir, moveUploadedFileSync } from '../config/upload';
import { protocolStatusEngine } from '../services/protocol-status.engine';
import { protocolModuleService } from '../services/protocol-module.service';
import { DocumentStatus } from '@prisma/client';
import { createProtocolSLA } from '../services/protocol-sla.service';
import { sanitizeDocumentId, mapUploadedFilesToDocuments } from '../utils/document-mapping';
import messageNotificationService from '../lib/messages/MessageNotificationService';
import { validateProtocolUniqueness } from '../services/protocol-uniqueness.service';
import {
  getProtocolDocuments as getProtocolDocumentsForProtocol,
  uploadDocument as uploadProtocolDocument,
} from '../services/protocol-document.service';
import * as pendingService from '../services/protocol-pending.service';
import * as dataFieldService from '../services/protocol-data-field.service';
import fs from 'fs';
import path from 'path';

const router = Router();

/**
 * Helper: Cria documentos PENDING baseado nas configurações do serviço
 */
async function createPendingDocumentsForProtocol(
  protocolId: string,
  service: any,
  uploadedFiles: any[]
): Promise<void> {
  try {
    // Verificar se serviço requer documentos
    if (!service.requiresDocuments || !service.requiredDocuments) {
      return;
    }

    // Parsear requiredDocuments
    let requiredDocs: any[] = [];
    if (typeof service.requiredDocuments === 'string') {
      try {
        requiredDocs = JSON.parse(service.requiredDocuments);
      } catch (e) {
        console.warn('Erro ao parsear requiredDocuments:', e);
        return;
      }
    } else if (Array.isArray(service.requiredDocuments)) {
      requiredDocs = service.requiredDocuments;
    }

    if (requiredDocs.length === 0) {
      return;
    }

    // ✅ FASE 3: MAPEAMENTO ROBUSTO com sanitização
    const normalizedRequiredDocs = requiredDocs.map(docConfig => ({
      id: sanitizeDocumentId(docConfig.id || docConfig.name || docConfig),
      name: docConfig.name || docConfig.id || docConfig,
      required: docConfig.required !== false
    }));

    const normalizedUploadedFiles = uploadedFiles.map(file => ({
      ...file,
      documentId: sanitizeDocumentId(file.documentId || file.id)
    }));

    const mapping = mapUploadedFilesToDocuments(
      normalizedUploadedFiles,
      normalizedRequiredDocs
    );

    // Criar documentos baseado no mapeamento
    for (const reqDoc of normalizedRequiredDocs) {
      const fileIndex = mapping.mapped.get(reqDoc.id);

      if (fileIndex !== undefined) {
        // Arquivo foi enviado - criar como UPLOADED
        const uploadedFile = uploadedFiles[fileIndex];

        await prisma.protocolDocument.create({
          data: {
            protocolId,
            documentType: reqDoc.name,
            isRequired: reqDoc.required,
            fileName: uploadedFile.filename, // ✅ Usar filename (processado) ao invés de name (original)
            fileUrl: uploadedFile.url,
            fileSize: uploadedFile.size,
            mimeType: uploadedFile.mimetype,
            status: DocumentStatus.UPLOADED,
            uploadedAt: new Date()
          }
        });
        console.log(`   ✓ Documento UPLOADED: ${reqDoc.name} (sanitized: ${reqDoc.id})`);
      } else {
        // Arquivo não foi enviado - criar como PENDING
        await prisma.protocolDocument.create({
          data: {
            protocolId,
            documentType: reqDoc.name,
            isRequired: reqDoc.required,
            status: DocumentStatus.PENDING
          }
        });
        console.log(`   → Documento PENDING: ${reqDoc.name} (sanitized: ${reqDoc.id})`);
      }
    }

    // ⚠️  AVISO: Arquivos sem mapeamento
    if (mapping.unmappedFiles.length > 0) {
      for (const idx of mapping.unmappedFiles) {
        const file = uploadedFiles[idx];
        console.warn(`   ⚠️  ATENÇÃO: Arquivo não mapeado: ${file.name} (documentId: ${file.documentId})`);
        console.warn(`      → Sanitizado como: ${normalizedUploadedFiles[idx].documentId}`);
        console.warn(`      → Este arquivo NÃO será salvo no protocolo!`);
      }
    }

    // ⚠️  AVISO: Documentos obrigatórios faltando
    if (mapping.missingRequired.length > 0) {
      console.warn(`   ⚠️  Documentos obrigatórios não enviados: ${mapping.missingRequired.join(', ')}`);
    }

    console.log(`   ✅ Total processado: ${requiredDocs.length} requeridos | ${mapping.mapped.size} enviados | ${mapping.unmappedFiles.length} não mapeados`);
  } catch (error) {
    console.error('Erro ao criar documentos PENDING:', error);
    // Não falhar a criação do protocolo se documentos falharem
  }
}

function parseCitizenResolutionInput(rawResolution: unknown) {
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

function normalizeCitizenPendingResponse(pending: any) {
  return pendingService.serializePendingForCitizen(pending);
}

function getPendingFieldRequests(pending: any) {
  const metadata = pending?.metadata && typeof pending.metadata === 'object'
    ? pending.metadata as Record<string, any>
    : {};

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

function getPendingDocumentRequests(pending: any) {
  const metadata = pending?.metadata && typeof pending.metadata === 'object'
    ? pending.metadata as Record<string, any>
    : {};

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

function parsePendingUploadMetadata(rawMetadata: unknown, filesCount: number) {
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

async function resolveCitizenPendingText(
  protocolId: string,
  pending: any,
  citizenId: string,
  resolution: string
) {
  const metadata = pending?.metadata && typeof pending.metadata === 'object'
    ? pending.metadata as Record<string, any>
    : {};
  const { text, payload } = parseCitizenResolutionInput(resolution);

  const fieldRequests = getPendingFieldRequests(pending);
  if (fieldRequests.length > 0) {
    const submittedFields = fieldRequests.map((field, index) => {
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

    const missingFields = submittedFields.filter((field) => field.required !== false && !field.value);
    if (missingFields.length > 0) {
      throw new Error(`Informe os dados solicitados: ${missingFields.map((field) => field.fieldLabel || field.fieldKey || `campo ${field.index + 1}`).join(', ')}`);
    }

    await dataFieldService.applyPendingFieldResponses(
      submittedFields
        .filter((field) => field.value)
        .map((field) => ({
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

    const summary = submittedFields
      .filter((field) => field.value)
      .map((field) => `${field.fieldLabel || field.fieldKey || 'Campo'}: ${field.value}`)
      .join('\n');

    await pendingService.submitPendingResponse(pending.id, citizenId, summary, {
      fields: submittedFields.map((field) => ({
        id: field.fieldId || field.fieldKey,
        key: field.fieldKey || field.fieldId,
        label: field.fieldLabel || field.fieldKey || 'Campo',
        type: field.fieldType || 'text',
        required: field.required !== false,
      })),
      submittedFields: submittedFields
        .filter((field) => field.value)
        .map((field) => ({
          id: field.fieldId || field.fieldKey,
          key: field.fieldKey || field.fieldId,
          label: field.fieldLabel || field.fieldKey || 'Campo',
          value: field.value,
        })),
    });

    return prisma.protocolPending.findUnique({ where: { id: pending.id } });
  }

  if (!text) {
    throw new Error('Resolucao e obrigatoria.');
  }

  await pendingService.submitPendingResponse(pending.id, citizenId, text);
  return prisma.protocolPending.findUnique({ where: { id: pending.id } });
}

async function resolveCitizenPendingWithDocument(
  protocolId: string,
  pending: any,
  citizenId: string,
  files: Express.Multer.File[],
  rawUploadMetadata?: unknown
) {
  if (pending.type !== 'DOCUMENT') {
    throw new Error('Esta pendencia nao aceita envio de documento.');
  }

  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('Documento é obrigatório.');
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
    requestedDocuments.map((document) => ({
      id: sanitizeDocumentId(document.id || document.documentType || document.label),
      name: document.label,
      required: document.required !== false,
    }))
  );

  if (mapping.missingRequired.length > 0) {
    throw new Error(`Ainda faltam documentos obrigatórios: ${mapping.missingRequired.join(', ')}`);
  }

  const uploadedDocuments: Array<{ id: string; documentType: string; fileName: string }> = [];
  const protocolDir = ensureProtocolDir(protocolId);

  for (const requestedDocument of requestedDocuments) {
    const requiredId = sanitizeDocumentId(requestedDocument.id || requestedDocument.documentType || requestedDocument.label);
    const fileIndex = mapping.mapped.get(requiredId);
    if (fileIndex === undefined) {
      continue;
    }

    const file = files[fileIndex];
    const newPath = path.join(protocolDir, file.filename);
    moveUploadedFileSync(file.path, newPath);

    let targetDocumentId = requestedDocument.documentId;
    if (!targetDocumentId) {
      const existingDocument = await prisma.protocolDocument.findFirst({
        where: {
          protocolId,
          documentType: requestedDocument.documentType,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (existingDocument) {
        targetDocumentId = existingDocument.id;
      } else {
        const created = await prisma.protocolDocument.create({
          data: {
            protocolId,
            documentType: requestedDocument.documentType,
            isRequired: requestedDocument.required !== false,
            status: DocumentStatus.PENDING,
          },
        });
        targetDocumentId = created.id;
      }
    }

    const updatedDocument = await uploadProtocolDocument(targetDocumentId, {
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

  const resolutionText = uploadedDocuments.length === 1
    ? `Documento enviado: ${uploadedDocuments[0].documentType}`
    : `Documentos enviados: ${uploadedDocuments.map((document) => document.documentType).join(', ')}`;

  await pendingService.submitPendingResponse(pending.id, citizenId, resolutionText, {
    documentRequests: requestedDocuments,
    submittedDocuments: uploadedDocuments,
  });

  return prisma.protocolPending.findUnique({ where: { id: pending.id } });
}

// Middleware de autenticação do cidadão
router.use(citizenAuthMiddleware);

// POST /api/citizen/protocols - Criar novo protocolo com upload de arquivos
// ✅ CORREÇÃO CRÍTICA: usar .any() ao invés de .array('documents')
// Frontend envia: documents[0][file], documents[1][file], etc
// Multer .array() só aceita: documents[], documents[], etc
router.post('/', upload.any(), async (req, res) => {
  const files = (req.files as Express.Multer.File[]) || [];

  // Remove arquivos temporários quando a criação NÃO acontece
  const cleanupTempFiles = () => {
    for (const file of files) {
      fs.promises.unlink(file.path).catch(() => undefined);
    }
  };

  try {
    const citizenId = (req as any).citizen?.id;
    const citizenName = (req as any).citizen?.name;

    if (!citizenId) {
      cleanupTempFiles();
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    const {
      serviceId,
      programId,
      programName,
      formData: formDataString
        } = req.body;

    // serviceId ausente vinculava o PRIMEIRO serviço do banco
    // (findFirst com id undefined ignora o filtro) — validar antes de tudo
    if (!serviceId || typeof serviceId !== 'string') {
      cleanupTempFiles();
      return res.status(400).json({
        success: false,
        error: 'serviceId é obrigatório'
      });
    }

    // Parse formData JSON com guard (payload malformado não pode virar 500)
    let formData: Record<string, any> = {};
    if (formDataString) {
      try {
        formData = JSON.parse(formDataString);
      } catch {
        cleanupTempFiles();
        return res.status(400).json({
          success: false,
          error: 'formData inválido: não é um JSON válido'
        });
      }
    }

    // ✅ EXTRAÇÃO ROBUSTA: Aceitar múltiplos formatos
    let documentTypes: string[] = [];

    // Formato 1: Array documentTypes (preferido)
    if (req.body.documentTypes) {
      try {
        documentTypes = typeof req.body.documentTypes === 'string'
          ? JSON.parse(req.body.documentTypes)
          : req.body.documentTypes;
      } catch {
        documentTypes = [];
      }
    }
    // Formato 2: Indexed fields documents[i][id]
    else if (files.length > 0) {
      documentTypes = files.map((_, index) =>
        req.body[`documents[${index}][id]`] ||
        req.body[`documents[${index}][documentId]`] ||
        ''
      ).filter(Boolean);
    }

    // Buscar serviço (validação antecipada — module service revalida)
    const service = await prisma.serviceSimplified.findFirst({
      where: { id: serviceId },
      include: { department: true }
    });

    if (!service) {
      cleanupTempFiles();
      return res.status(404).json({
        success: false,
        error: 'Serviço não encontrado'
        });
    }

    // ✅ VALIDAÇÃO DE UNICIDADE: Verificar se cidadão pode criar este protocolo
    const uniquenessValidation = await validateProtocolUniqueness(
      citizenId,
      serviceId,
      formData
    );

    if (!uniquenessValidation.canCreate) {
      cleanupTempFiles();
      return res.status(400).json({
        success: false,
        error: uniquenessValidation.errorMessage || 'Não é possível criar este protocolo',
        reason: uniquenessValidation.reason,
        existingProtocolNumber: uniquenessValidation.existingProtocolNumber
      });
    }

    // ✅ CRIAÇÃO UNIFICADA via protocolModuleService (mesmo caminho do admin,
    // do citizen-services e do bot): número gerado DENTRO da transação de
    // criação, geolocalização, histórico, workflow auto-gerado se ausente,
    // data fields e hooks de módulo. Falha aqui = NADA persiste (sem
    // protocolos órfãos que bloqueavam o retry do cidadão via unicidade).
    const result = await protocolModuleService.createProtocolWithModule({
      citizenId,
      serviceId,
      formData: {
        ...formData,
        ...(programId !== undefined && { programId }),
        ...(programName !== undefined && { programName })
      }
    });

    const protocol = result.protocol;

    // ========================================================================
    // PÓS-CRIAÇÃO (não-fatal): arquivos, documentos, interação, SLA, notificação
    // Se algo falhar aqui o protocolo já existe e é válido — o cidadão pode
    // reenviar documentos pelo portal.
    // ========================================================================
    try {
      // Mover arquivos para diretório do protocolo com padrão único
      const protocolDir = ensureProtocolDir(protocol.id);
      const uploadedDocuments = files.map((file, index) => {
        const documentType = documentTypes[index];
        const newPath = path.join(protocolDir, file.filename);
        moveUploadedFileSync(file.path, newPath);

        return {
          id: documentType || file.originalname,
          documentId: documentType || file.originalname,
          name: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          filename: file.filename,
          url: getProtocolFileUrl(protocol.id, file.filename),
          uploadedAt: new Date().toISOString()
        };
      });

      // Criar documentos PENDING/UPLOADED na tabela ProtocolDocument
      await createPendingDocumentsForProtocol(protocol.id, service, uploadedDocuments);

      // Criar interação inicial (visível ao cidadão)
      await prisma.protocolInteraction.create({
        data: {
          protocolId: protocol.id,
          type: 'MESSAGE',
          authorType: 'CITIZEN',
          authorId: citizenId,
          authorName: citizenName || 'Cidadão',
          message: `Protocolo ${protocol.number} criado`,
          isInternal: false,
          isRead: false
        }
      });

      // Garantir SLA (idempotente — module service cria quando o workflow
      // define defaultSLA; aqui cobre o fallback de estimatedDays/30 dias)
      await createProtocolSLA(protocol.id);
    } catch (postError) {
      console.error('⚠️ Pós-criação do protocolo falhou (não-fatal):', postError);
    }

    // ✅ FASE 1: Enviar notificação via mensageiro
    try {
      await messageNotificationService.notifyProtocolCreated(protocol.id);
    } catch (notifError) {
      console.error('⚠️ Erro ao enviar notificação de criação:', notifError);
      // Não falhar a criação do protocolo se notificação falhar
    }

    return res.status(201).json({
      success: true,
      protocol,
      message: 'Protocolo criado com sucesso'
        });
  } catch (error) {
    cleanupTempFiles();
    console.error('❌ Erro ao criar protocolo:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

// GET /api/citizen/protocols - Listar protocolos do cidadão logado
router.get('/', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    const { page = 1, limit = 100, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Construir filtros
    const where: any = {
      citizenId
        };

    if (status) {
      where.status = status;
    }

    // Buscar protocolos do cidadão
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              name: true,
              description: true,
              estimatedDays: true
        }
      },
          department: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              pendings: {
                where: {
                  status: { in: ['OPEN', 'IN_PROGRESS'] },
                  type: { in: ['DOCUMENT', 'INFORMATION', 'CORRECTION', 'VALIDATION', 'PAYMENT'] }
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: Number(limit)
        }),
      prisma.protocolSimplified.count({ where }),
    ]);

    const normalizedProtocols = protocols.map((protocol: any) => ({
      ...protocol,
      openCitizenPendingsCount: protocol._count?.pendings || 0
    }));

    return res.json({
      protocols: normalizedProtocols,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
        }
        });
  } catch (error) {
    console.error('Erro ao buscar protocolos do cidadão:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/citizen/protocols/:id - Detalhes de um protocolo específico
router.get('/:id', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    // Buscar protocolo
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id,
        citizenId, // Garantir que o protocolo pertence ao cidadão
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            description: true,
            estimatedDays: true,
            category: true
        }
      },
        department: {
          select: {
            id: true,
            name: true
        }
      },
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true
        }
      },
        assignedUser: {
          select: {
            id: true,
            name: true
          }
        },
        _count: {
          select: {
            pendings: {
              where: {
                status: { in: ['OPEN', 'IN_PROGRESS'] },
                type: { in: ['DOCUMENT', 'INFORMATION', 'CORRECTION', 'VALIDATION', 'PAYMENT'] }
              }
            }
          }
        }
        }
        });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo não encontrado' });
    }

    // Buscar histórico do protocolo
    const history = await prisma.protocolHistorySimplified.findMany({
      where: {
        protocolId: id
        },
      orderBy: {
        timestamp: 'desc'
        }
        });

    return res.json({
      protocol: {
        ...protocol,
        openCitizenPendingsCount: protocol._count?.pendings || 0
      },
      history
        });
  } catch (error) {
    console.error('Erro ao buscar detalhes do protocolo:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/citizen/protocols/:id/interactions - Listar interações do protocolo
router.get('/:id/interactions', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id,
        citizenId
        }
        });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo não encontrado' });
    }

    // Buscar interações (apenas públicas para cidadãos)
    const interactions = await prisma.protocolInteraction.findMany({
      where: {
        protocolId: id,
        isInternal: false, // Apenas interações públicas
      },
      orderBy: {
        createdAt: 'asc'
        }
        });

    return res.json({
      interactions
        });
  } catch (error) {
    console.error('Erro ao buscar interações:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/citizen/protocols/:id/interactions - Criar nova interação
router.post('/:id/interactions', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const citizenName = (req as any).citizen?.name;
    const { id } = req.params;
    const { message, type } = req.body;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mensagem é obrigatória' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id,
        citizenId
        }
        });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo não encontrado' });
    }

    // Criar interação
    const interaction = await prisma.protocolInteraction.create({
      data: {
        protocolId: id,
        type: type || 'MESSAGE',
        authorType: 'CITIZEN',
        authorId: citizenId,
        authorName: citizenName || 'Cidadão',
        message: message.trim(),
        isInternal: false,
        isRead: false
        }
        });

    // ✅ FASE 1: Notificar servidor sobre novo comentário do cidadão
    try {
      await messageNotificationService.notifyNewComment(
        id,
        message.trim(),
        citizenName || 'Cidadão'
      );
    } catch (notifError) {
      console.error('Erro ao enviar notificação de comentário:', notifError);
    }

    return res.status(201).json({
      interaction
        });
  } catch (error) {
    console.error('Erro ao criar interação:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/citizen/protocols/:id/cancel - Cancelar protocolo
router.post('/:id/cancel', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const citizenName = (req as any).citizen?.name;
    const { id } = req.params;
    const { reason } = req.body;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id,
        citizenId
        }
        });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo não encontrado' });
    }

    // Verificar se o protocolo já está cancelado ou concluído
    if (protocol.status === 'CANCELADO') {
      return res.status(400).json({ error: 'Protocolo já está cancelado' });
    }

    if (protocol.status === 'CONCLUIDO') {
      return res.status(400).json({ error: 'Não é possível cancelar um protocolo concluído' });
    }

    // Bloquear apenas quando um SERVIDOR humano já interagiu com o cidadão
    // (mensagens automáticas do sistema/internas não impedem o cancelamento)
    const serverInteractions = await prisma.protocolInteraction.findMany({
      where: {
        protocolId: id,
        authorType: 'SERVER',
        isInternal: false
        },
      take: 1
        });

    if (serverInteractions.length > 0) {
      return res.status(400).json({
        error: 'Não é possível cancelar o protocolo pois já há interações da secretaria',
        canCancel: false
        });
    }

    // Bloquear apenas por pendências ABERTAS (resolvidas/canceladas não contam)
    const pendencies = await prisma.protocolPending.findMany({
      where: {
        protocolId: id,
        status: { in: ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW'] }
        },
      take: 1
        });

    if (pendencies.length > 0) {
      return res.status(400).json({
        error: 'Não é possível cancelar o protocolo pois há pendências em aberto',
        canCancel: false
        });
    }

    // Atualizar status do protocolo para CANCELADO usando motor centralizado
    const result = await protocolStatusEngine.updateStatus({
      protocolId: id,
      newStatus: 'CANCELADO',
      actorId: citizenId,
      actorRole: 'CITIZEN',
      comment: reason || 'Cancelado a pedido do cidadão',
      reason: reason,
      metadata: {
        source: 'citizen-protocols',
        action: 'citizen_cancellation'
      }
    });

    const updatedProtocol = result.protocol;

    // Criar interação informando o cancelamento
    await prisma.protocolInteraction.create({
      data: {
        protocolId: id,
        type: 'CANCELLATION',
        authorType: 'CITIZEN',
        authorId: citizenId,
        authorName: citizenName || 'Cidadão',
        message: reason ? `Protocolo cancelado. Motivo: ${reason}` : 'Protocolo cancelado pelo cidadão',
        isInternal: false,
        isRead: false
        }
        });

    return res.json({
      success: true,
      protocol: updatedProtocol,
      message: 'Protocolo cancelado com sucesso'
        });
  } catch (error) {
    console.error('Erro ao cancelar protocolo:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/citizen/protocols/:id/can-cancel - Verificar se pode cancelar
router.get('/:id/can-cancel', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id,
        citizenId
        }
        });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo não encontrado' });
    }

    let canCancel = true;
    let reason = '';

    // Verificar status
    if (protocol.status === 'CANCELADO') {
      canCancel = false;
      reason = 'Protocolo já está cancelado';
    } else if (protocol.status === 'CONCLUIDO') {
      canCancel = false;
      reason = 'Protocolo já foi concluído';
    } else {
      // Verificar interações humanas da secretaria (mesma regra do /cancel)
      const serverInteractions = await prisma.protocolInteraction.findMany({
        where: {
          protocolId: id,
          authorType: 'SERVER',
          isInternal: false
        },
        take: 1
        });

      if (serverInteractions.length > 0) {
        canCancel = false;
        reason = 'Protocolo já possui interações da secretaria';
      }

      // Verificar pendências ABERTAS
      const pendencies = await prisma.protocolPending.findMany({
        where: {
          protocolId: id,
          status: { in: ['OPEN', 'IN_PROGRESS', 'UNDER_REVIEW'] }
        },
        take: 1
        });

      if (pendencies.length > 0) {
        canCancel = false;
        reason = 'Protocolo possui pendências em aberto';
      }
    }

    return res.json({
      canCancel,
      reason: canCancel ? 'Protocolo pode ser cancelado' : reason,
      status: protocol.status
        });
  } catch (error) {
    console.error('Erro ao verificar cancelamento:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// ========================================
// GET WORKFLOW STAGES (READ-ONLY)
// ========================================

/**
 * GET /api/citizen/protocols/:id/stages
 * Listar etapas do workflow do protocolo (somente leitura)
 */
router.get('/:id/stages', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Buscar stages do protocolo
    const stages = await prisma.protocolStage.findMany({
      where: { protocolId },
      orderBy: { stageOrder: 'asc' }
    });

    return res.json({
      success: true,
      data: stages
    });
  } catch (error: any) {
    console.error('Error fetching protocol stages:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar etapas do protocolo'
    });
  }
});

// ========================================
// GET PROTOCOL PENDINGS (READ-ONLY)
// ========================================

/**
 * GET /api/citizen/protocols/:id/pendings
 * Listar pendências do protocolo
 */
router.get('/:id/pendings', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    const pendings = await pendingService.getCitizenPendings(protocolId);

    return res.json({
      success: true,
      data: pendings,
      pendings
    });
  } catch (error: any) {
    console.error('Error fetching protocol pendings:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar pendências do protocolo'
    });
  }
});

/**
 * PATCH /api/citizen/protocols/:id/pendings/:pendingId/resolve
 * Resolver uma pendência com texto ou dados corrigidos
 */
router.patch('/:id/pendings/:pendingId/resolve', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId, pendingId } = req.params;
    const { resolution } = req.body;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    if (!resolution || !String(resolution).trim()) {
      return res.status(400).json({ error: 'Resolução é obrigatória' });
    }

    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    const pending = await prisma.protocolPending.findFirst({
      where: { id: pendingId, protocolId }
    });

    if (!pending) {
      return res.status(404).json({
        success: false,
        error: 'Pendência não encontrada'
      });
    }

    if (!['OPEN', 'IN_PROGRESS'].includes(pending.status)) {
      return res.status(400).json({
        success: false,
        error: pending.status === 'UNDER_REVIEW'
          ? 'A pendência já recebeu sua resposta e aguarda análise da equipe'
          : 'Pendência já foi resolvida ou cancelada'
      });
    }

    const updatedPending = await resolveCitizenPendingText(
      protocolId,
      pending,
      citizenId,
      String(resolution)
    );

    return res.json({
      success: true,
      data: normalizeCitizenPendingResponse(updatedPending)
    });
  } catch (error: any) {
    console.error('Error resolving pending:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao resolver pendência'
    });
  }
});

/**
 * PATCH /api/citizen/protocols/:id/pendings/:pendingId/resolve-with-document
 * Resolver uma pendência enviando um documento
 */
router.patch('/:id/pendings/:pendingId/resolve-with-document', upload.any(), async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId, pendingId } = req.params;
    const files = Array.isArray(req.files) ? req.files as Express.Multer.File[] : [];

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    if (files.length === 0) {
      return res.status(400).json({ error: 'Documento é obrigatório' });
    }

    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    const pending = await prisma.protocolPending.findFirst({
      where: { id: pendingId, protocolId }
    });

    if (!pending) {
      return res.status(404).json({
        success: false,
        error: 'Pendência não encontrada'
      });
    }

    if (!['OPEN', 'IN_PROGRESS'].includes(pending.status)) {
      return res.status(400).json({
        success: false,
        error: pending.status === 'UNDER_REVIEW'
          ? 'A pendência já recebeu sua resposta e aguarda análise da equipe'
          : 'Pendência já foi resolvida ou cancelada'
      });
    }

    const updatedPending = await resolveCitizenPendingWithDocument(
      protocolId,
      pending,
      citizenId,
      files,
      req.body?.fileMetadata
    );

    return res.json({
      success: true,
      data: normalizeCitizenPendingResponse(updatedPending)
    });
  } catch (error: any) {
    console.error('Error resolving pending with document:', error);
    return res.status(500).json({
      success: false,
      error: error?.message || 'Erro ao enviar documento'
    });
  }
});

// ========================================
// GET CITIZEN LINKS (READ-ONLY)
// ========================================

/**
 * GET /api/citizen/protocols/:id/citizen-links
 * Listar vínculos de cidadãos do protocolo (somente leitura)
 */
router.get('/:id/citizen-links', async (req, res) => {
  try {
    const { id: protocolId } = req.params;
    const citizenId = (req as any).citizenId;

    // Verificar se o protocolo pertence ao cidadão logado
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId: citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Buscar vínculos do protocolo
    const links = await prisma.protocolCitizenLink.findMany({
      where: { protocolId },
      include: {
        linkedCitizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            birthDate: true,
            rg: true
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    return res.json({
      success: true,
      data: { links }
    });
  } catch (error: any) {
    console.error('Error fetching protocol citizen links:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar vínculos do protocolo'
    });
  }
});

// ========================================
// PROTOCOL DOCUMENTS
// ========================================

/**
 * POST /api/citizen/protocols/:id/documents/upload
 * Upload de documento adicional pelo cidadão
 */
router.post('/:id/documents/upload', upload.single('document'), async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId } = req.params;
    const file = req.file as Express.Multer.File | undefined;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Documento é obrigatório' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Mover arquivo para diretório do protocolo
    const protocolDir = ensureProtocolDir(protocolId);
    const newPath = path.join(protocolDir, file.filename);
    moveUploadedFileSync(file.path, newPath);

    // Criar documento no banco
    const document = await prisma.protocolDocument.create({
      data: {
        protocolId,
        documentType: 'DOCUMENTO_ADICIONAL',
        isRequired: false,
        status: DocumentStatus.UPLOADED,
        fileName: file.originalname,
        fileUrl: getProtocolFileUrl(protocolId, file.filename),
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        uploadedBy: citizenId
      }
    });

    // Criar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId,
        action: 'DOCUMENTO_ENVIADO',
        comment: `Documento adicional enviado: ${file.originalname}`,
        timestamp: new Date()
      }
    });

    // ✅ FASE 1: Notificar servidor sobre documento enviado
    try {
      await messageNotificationService.notifyDocumentUploaded(
        protocolId,
        file.originalname
      );
    } catch (notifError) {
      console.error('Erro ao enviar notificação de documento:', notifError);
    }

    return res.json({
      success: true,
      document
    });
  } catch (error: any) {
    console.error('Error uploading document:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao enviar documento'
    });
  }
});

/**
 * GET /api/citizen/protocols/:id/documents
 * Listar documentos enviados pelo cidadão para o protocolo
 */
router.get('/:id/documents', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Buscar documentos do protocolo
    const documents = await getProtocolDocumentsForProtocol(protocolId);

    // Mapear para formato esperado pelo frontend
    const mappedDocuments = documents.map(doc => ({
      id: doc.id,
      type: doc.documentType,
      fileName: doc.fileName || 'Documento',
      status: doc.status,
      uploadedAt: doc.uploadedAt?.toISOString() || new Date().toISOString(),
      reviewedAt: doc.validatedAt?.toISOString() || null,
      rejectionReason: doc.rejectionReason || null,
      fileUrl: doc.fileUrl || null,
      fileSize: doc.fileSize || null,
      mimeType: doc.mimeType || null
    }));

    return res.json({
      success: true,
      documents: mappedDocuments
    });
  } catch (error: any) {
    console.error('Error fetching protocol documents:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar documentos do protocolo'
    });
  }
});

/**
 * GET /api/citizen/protocols/:id/documents/:documentId/download
 * Download ou visualização de um documento
 */
router.get('/:id/documents/:documentId/download', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId, documentId } = req.params;
    const inline = req.query.inline === 'true';

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Buscar documento
    const document = await prisma.protocolDocument.findFirst({
      where: {
        id: documentId,
        protocolId
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado'
      });
    }

    if (!document.fileUrl) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não disponível'
      });
    }

    // Se fileUrl é uma URL externa
    if (document.fileUrl.startsWith('http')) {
      return res.redirect(document.fileUrl);
    }

    // Arquivo local - buscar e enviar
    const { getProtocolFilePath, extractFilename } = await import('../config/upload');
    const filename = extractFilename(document.fileUrl);
    const filePath = getProtocolFilePath(protocolId, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor'
      });
    }

    // Detectar MIME type
    const guessMimeFromExtension = (fileName?: string): string => {
      if (!fileName) return 'application/octet-stream';
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.pdf')) return 'application/pdf';
      if (lower.match(/\.(jpg|jpeg)$/)) return 'image/jpeg';
      if (lower.endsWith('.png')) return 'image/png';
      if (lower.endsWith('.gif')) return 'image/gif';
      if (lower.endsWith('.webp')) return 'image/webp';
      return 'application/octet-stream';
    };

    const mimeType = document.mimeType || guessMimeFromExtension(document.fileName || undefined);

    // Configurar headers
    const disposition = inline ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${document.fileName || 'documento'}"`);
    res.setHeader('Content-Type', mimeType);

    // Stream do arquivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('Error downloading document:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao fazer download do documento'
    });
  }
});

// ========================================
// GET GENERATED DOCUMENTS (READ-ONLY)
// ========================================

/**
 * GET /api/citizen/protocols/:id/generated-documents
 * Listar documentos gerados pelo sistema para o protocolo
 */
router.get('/:id/generated-documents', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // ✅ CORREÇÃO: Buscar documentos gerados na tabela GeneratedDocument
    const docs = await prisma.generatedDocument.findMany({
      where: {
        protocolId,
        isActive: true,
        isSigned: true,
        publishedToCitizen: true,
        status: 'PUBLISHED'
      },
      include: {
        template: {
          select: {
            id: true,
            name: true,
            documentType: true
          }
        }
      },
      orderBy: { generatedAt: 'desc' }
    });

    // Mapear para formato esperado pelo frontend
    const generatedDocuments = docs.map(doc => ({
      id: doc.id,
      type: doc.template.documentType,
      name: doc.fileName,
      generatedAt: doc.generatedAt.toISOString(),
      expiresAt: doc.expiresAt?.toISOString() || null,
      validationCode: doc.validationCode || null,
      fileUrl: doc.fileUrl || doc.filePath,
      // ✅ CORREÇÃO: Enviar apenas metadados essenciais (sem variablesUsed)
      metadata: {
        template: doc.template.name,
        protocolo: protocol.number
      }
    }));

    return res.json({
      success: true,
      documents: generatedDocuments
    });
  } catch (error: any) {
    console.error('Error fetching generated documents:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao buscar documentos gerados'
    });
  }
});

/**
 * GET /api/citizen/protocols/:id/generated-documents/:documentId/download
 * Download de documento gerado
 */
router.get('/:id/generated-documents/:documentId/download', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId, documentId } = req.params;
    const inline = req.query.inline === 'true';

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // ✅ CORREÇÃO: Buscar na tabela GeneratedDocument
    const document = await prisma.generatedDocument.findFirst({
      where: {
        id: documentId,
        protocolId,
        isActive: true,
        isSigned: true,
        publishedToCitizen: true,
        status: 'PUBLISHED'
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento não encontrado'
      });
    }

    // Verificar se arquivo existe
    const filePathFromDB = document.filePath;

    if (!filePathFromDB) {
      return res.status(404).json({
        success: false,
        error: 'Caminho do arquivo não disponível'
      });
    }

    // Construir caminho absoluto do arquivo
    const filePath = path.join(process.cwd(), filePathFromDB);

    // Verificar se arquivo existe no sistema de arquivos
    if (!fs.existsSync(filePath)) {
      console.error(`[ERROR] Arquivo de documento gerado não encontrado no servidor`);
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor'
      });
    }

    // Usar mimeType do documento gerado
    const mimeType = document.mimeType || 'application/pdf';

    // Configurar headers para download ou visualização
    const disposition = inline ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${document.fileName}"`);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', document.fileSize.toString());

    // Stream do arquivo
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);
  } catch (error: any) {
    console.error('Error downloading generated document:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao fazer download do documento'
    });
  }
});

// ========================================
// GET UNREAD MESSAGES COUNT
// ========================================

/**
 * GET /api/citizen/protocols/:id/interactions/unread-count
 * Contar mensagens não lidas do protocolo
 */
router.get('/:id/interactions/unread-count', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Contar mensagens não lidas (mensagens do servidor/sistema para o cidadão)
    const unreadCount = await prisma.protocolInteraction.count({
      where: {
        protocolId,
        isInternal: false,
        isRead: false,
        authorType: {
          in: ['SERVER', 'SYSTEM']
        }
      }
    });

    return res.json({
      success: true,
      unreadCount
    });
  } catch (error: any) {
    console.error('Error counting unread messages:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao contar mensagens não lidas'
    });
  }
});

/**
 * PATCH /api/citizen/protocols/:id/interactions/mark-read
 * Marcar todas as mensagens como lidas
 */
router.patch('/:id/interactions/mark-read', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Marcar todas as mensagens como lidas
    await prisma.protocolInteraction.updateMany({
      where: {
        protocolId,
        isInternal: false,
        isRead: false,
        authorType: {
          in: ['SERVER', 'SYSTEM']
        }
      },
      data: {
        isRead: true
      }
    });

    return res.json({
      success: true,
      message: 'Mensagens marcadas como lidas'
    });
  } catch (error: any) {
    console.error('Error marking messages as read:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao marcar mensagens como lidas'
    });
  }
});
export default router;

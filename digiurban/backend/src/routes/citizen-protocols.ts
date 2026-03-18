/**
 * ============================================================================
 * CITIZEN PROTOCOLS ROUTES
 * ============================================================================
 * Rotas para cidadÃƒÂ£os acessarem seus protocolos
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { upload, getProtocolFileUrl, ensureProtocolDir } from '../config/upload';
import { generateProtocolNumberSafe } from '../services/protocol-number.service';
import { protocolStatusEngine } from '../services/protocol-status.engine';
import { DocumentStatus } from '@prisma/client';
import { applyWorkflowToProtocol } from '../services/service-workflow.service';
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
 * Helper: Cria documentos PENDING baseado nas configuraÃƒÂ§ÃƒÂµes do serviÃƒÂ§o
 */
async function createPendingDocumentsForProtocol(
  protocolId: string,
  service: any,
  uploadedFiles: any[]
): Promise<void> {
  try {
    // Verificar se serviÃƒÂ§o requer documentos
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

    // Ã¢Å“â€¦ FASE 3: MAPEAMENTO ROBUSTO com sanitizaÃƒÂ§ÃƒÂ£o
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
            fileName: uploadedFile.filename, // Ã¢Å“â€¦ Usar filename (processado) ao invÃƒÂ©s de name (original)
            fileUrl: uploadedFile.url,
            fileSize: uploadedFile.size,
            mimeType: uploadedFile.mimetype,
            status: DocumentStatus.UPLOADED,
            uploadedAt: new Date()
          }
        });
        console.log(`   Ã¢Å“â€œ Documento UPLOADED: ${reqDoc.name} (sanitized: ${reqDoc.id})`);
      } else {
        // Arquivo nÃƒÂ£o foi enviado - criar como PENDING
        await prisma.protocolDocument.create({
          data: {
            protocolId,
            documentType: reqDoc.name,
            isRequired: reqDoc.required,
            status: DocumentStatus.PENDING
          }
        });
        console.log(`   Ã¢â€ â€™ Documento PENDING: ${reqDoc.name} (sanitized: ${reqDoc.id})`);
      }
    }

    // Ã¢Å¡Â Ã¯Â¸Â  AVISO: Arquivos sem mapeamento
    if (mapping.unmappedFiles.length > 0) {
      for (const idx of mapping.unmappedFiles) {
        const file = uploadedFiles[idx];
        console.warn(`   Ã¢Å¡Â Ã¯Â¸Â  ATENÃƒâ€¡ÃƒÆ’O: Arquivo nÃƒÂ£o mapeado: ${file.name} (documentId: ${file.documentId})`);
        console.warn(`      Ã¢â€ â€™ Sanitizado como: ${normalizedUploadedFiles[idx].documentId}`);
        console.warn(`      Ã¢â€ â€™ Este arquivo NÃƒÆ’O serÃƒÂ¡ salvo no protocolo!`);
      }
    }

    // Ã¢Å¡Â Ã¯Â¸Â  AVISO: Documentos obrigatÃƒÂ³rios faltando
    if (mapping.missingRequired.length > 0) {
      console.warn(`   Ã¢Å¡Â Ã¯Â¸Â  Documentos obrigatÃƒÂ³rios nÃƒÂ£o enviados: ${mapping.missingRequired.join(', ')}`);
    }

    console.log(`   Ã¢Å“â€¦ Total processado: ${requiredDocs.length} requeridos | ${mapping.mapped.size} enviados | ${mapping.unmappedFiles.length} nÃƒÂ£o mapeados`);
  } catch (error) {
    console.error('Erro ao criar documentos PENDING:', error);
    // NÃƒÂ£o falhar a criaÃƒÂ§ÃƒÂ£o do protocolo se documentos falharem
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

  if (pending.type === 'CORRECTION' && metadata.fieldId) {
    const candidateValue =
      typeof payload?.[String(metadata.fieldId)] === 'string' ? payload?.[String(metadata.fieldId)] :
      typeof payload?.[String(metadata.fieldKey || '')] === 'string' ? payload?.[String(metadata.fieldKey || '')] :
      typeof payload?.value === 'string' ? payload.value :
      text;

    if (!candidateValue?.trim()) {
      throw new Error('Informe o novo valor para corrigir o dado solicitado.');
    }

    await dataFieldService.correctDataField({
      fieldId: String(metadata.fieldId),
      newValue: candidateValue.trim(),
      correctedBy: citizenId,
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
  file: Express.Multer.File
) {
  if (pending.type !== 'DOCUMENT') {
    throw new Error('Esta pendencia nao aceita envio de documento.');
  }

  const metadata = pending?.metadata && typeof pending.metadata === 'object'
    ? pending.metadata as Record<string, any>
    : {};
  const documentType = String(metadata.documentType || pending.title || 'DOCUMENTO_PENDENCIA');

  const protocolDir = ensureProtocolDir(protocolId);
  const newPath = path.join(protocolDir, file.filename);
  fs.renameSync(file.path, newPath);

  let targetDocumentId = typeof metadata.documentId === 'string' ? metadata.documentId : undefined;

  if (!targetDocumentId) {
    const existingDocument = await prisma.protocolDocument.findFirst({
      where: {
        protocolId,
        documentType,
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
          documentType,
          isRequired: true,
          status: DocumentStatus.PENDING,
        },
      });
      targetDocumentId = created.id;
    }
  }

  await uploadProtocolDocument(targetDocumentId, {
    fileName: file.originalname,
    fileUrl: getProtocolFileUrl(protocolId, file.filename),
    fileSize: file.size,
    mimeType: file.mimetype,
    uploadedBy: citizenId,
  });

  return prisma.protocolPending.findUnique({ where: { id: pending.id } });
}

// Middleware de autenticaÃƒÂ§ÃƒÂ£o do cidadÃƒÂ£o
router.use(citizenAuthMiddleware);

// POST /api/citizen/protocols - Criar novo protocolo com upload de arquivos
// Ã¢Å“â€¦ CORREÃƒâ€¡ÃƒÆ’O CRÃƒÂTICA: usar .any() ao invÃƒÂ©s de .array('documents')
// Frontend envia: documents[0][file], documents[1][file], etc
// Multer .array() sÃƒÂ³ aceita: documents[], documents[], etc
router.post('/', upload.any(), async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const citizenName = (req as any).citizen?.name;
    const files = req.files as Express.Multer.File[];

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    const {
      serviceId,
      moduleType,
      programId,
      programName,
      formData: formDataString
        } = req.body;

    // Parse formData JSON
    const formData = formDataString ? JSON.parse(formDataString) : {};

    console.log('\n========== POST /api/citizen/protocols ==========');
    console.log('Citizen:', citizenName, `(${citizenId})`);
    console.log('Service ID:', serviceId);
    console.log('Module Type:', moduleType);
    console.log('Program ID:', programId);
    console.log('Files received:', files ? files.length : 0);
    console.log('Form Data:', formData);

    // Debug detalhado de arquivos
    if (files && files.length > 0) {
      console.log('Ã°Å¸â€œÂ Arquivos recebidos:');
      files.forEach((file, idx) => {
        console.log(`  [${idx}] ${file.originalname} - ${file.size} bytes - ${file.mimetype}`);
        console.log(`      fieldname: ${file.fieldname}`);
        console.log(`      path: ${file.path}`);
      });
    } else {
      console.log('Ã¢Å¡Â Ã¯Â¸Â  NENHUM arquivo recebido!');
      console.log('   req.files:', req.files);
      console.log('   req.file:', (req as any).file);
    }

    // Debug: Mostrar todos os campos do req.body
    console.log('   Ã°Å¸â€œâ€¹ req.body keys:', Object.keys(req.body));

    // Ã¢Å“â€¦ EXTRAÃƒâ€¡ÃƒÆ’O ROBUSTA: Aceitar mÃƒÂºltiplos formatos
    let documentTypes: string[] = [];

    // Formato 1: Array documentTypes (preferido)
    if (req.body.documentTypes) {
      documentTypes = typeof req.body.documentTypes === 'string'
        ? JSON.parse(req.body.documentTypes)
        : req.body.documentTypes;
    }
    // Formato 2: Indexed fields documents[i][id]
    else if (files) {
      documentTypes = files.map((_, index) =>
        req.body[`documents[${index}][id]`] ||
        req.body[`documents[${index}][documentId]`] ||
        ''
      ).filter(Boolean);
    }

    console.log('   Ã°Å¸ÂÂ·Ã¯Â¸Â  Document Types extraÃƒÂ­dos:', documentTypes);
    console.log('   Ã°Å¸â€œÂ¦ Total de arquivos:', files?.length || 0);

    // TEMPORÃƒÂRIO: Mover arquivos para diretÃƒÂ³rio temporÃƒÂ¡rio
    // ApÃƒÂ³s criar protocolo, moveremos para /uploads/protocols/{protocolId}/
    const tempUploadedFiles = files ? files.map((file, index) => {
      const documentType = documentTypes[index];

      if (!documentType) {
        console.warn(`   Ã¢Å¡Â Ã¯Â¸Â  Arquivo ${index} (${file.originalname}) SEM documentType definido!`);
      }

      console.log(`   Ã¢â€ â€™ Arquivo ${index}: ${file.originalname}`);
      console.log(`      - Tipo de documento: ${documentType || 'INDEFINIDO'}`);

      return {
        id: documentType || file.originalname,
        documentId: documentType || file.originalname,
        name: file.originalname,
        tempPath: file.path,  // Caminho temporÃƒÂ¡rio em /uploads/documents
        size: file.size,
        mimetype: file.mimetype,
        filename: file.filename
      };
    }) : [];

    console.log('Uploaded Documents (temp):', tempUploadedFiles.length);

    // Buscar serviÃƒÂ§o
    const service = await prisma.serviceSimplified.findFirst({
      where: {
        id: serviceId
      },
      include: {
        department: true
        }
      });

    if (!service) {
      return res.status(404).json({
        success: false,
        error: 'ServiÃƒÂ§o nÃƒÂ£o encontrado'
        });
    }

    // Ã¢Å“â€¦ VALIDAÃƒâ€¡ÃƒÆ’O DE UNICIDADE: Verificar se cidadÃƒÂ£o pode criar este protocolo
    console.log('Ã°Å¸â€Â Validando unicidade do protocolo...');
    const uniquenessValidation = await validateProtocolUniqueness(
      citizenId,
      serviceId,
      formData
    );

    if (!uniquenessValidation.canCreate) {
      console.log(`   Ã¢ÂÅ’ ValidaÃƒÂ§ÃƒÂ£o falhou: ${uniquenessValidation.reason}`);
      return res.status(400).json({
        success: false,
        error: uniquenessValidation.errorMessage || 'NÃƒÂ£o ÃƒÂ© possÃƒÂ­vel criar este protocolo',
        reason: uniquenessValidation.reason,
        existingProtocolNumber: uniquenessValidation.existingProtocolNumber
      });
    }
    console.log('   Ã¢Å“â€œ ValidaÃƒÂ§ÃƒÂ£o de unicidade passou');

    // Gerar nÃƒÂºmero do protocolo - Sistema centralizado com lock
    const protocolNumber = await generateProtocolNumberSafe();

    // Criar protocolo
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: service.name,
        description: service.description || `SolicitaÃƒÂ§ÃƒÂ£o de ${service.name}`,
        serviceId,
        departmentId: service.department.id,
        citizenId,
        moduleType: service.moduleType || moduleType || 'GERAL',
        status: 'VINCULADO',
        priority: 3,
        customData: {
          ...formData,
          programId,
          programName
        },
        createdAt: new Date(),
        updatedAt: new Date()
        },
      include: {
        service: true,
        department: true,
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true
        }
      }
        }
        });

    // Ã¢Å“â€¦ FASE 1: Mover arquivos para diretÃƒÂ³rio do protocolo com padrÃƒÂ£o ÃƒÂºnico
    const protocolDir = ensureProtocolDir(protocol.id);
    const uploadedDocuments = tempUploadedFiles.map(file => {
      const newFilename = file.filename;
      const newPath = path.join(protocolDir, newFilename);

      // Mover arquivo de /uploads/documents para /uploads/protocols/{protocolId}
      fs.renameSync(file.tempPath, newPath);
      console.log(`   Ã¢Å“â€œ Arquivo movido: ${file.name} Ã¢â€ â€™ ${newPath}`);

      return {
        ...file,
        url: getProtocolFileUrl(protocol.id, newFilename),
        uploadedAt: new Date().toISOString()
      };
    });

    // Criar histÃƒÂ³rico inicial
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'Protocolo criado',
        comment: `Protocolo criado pelo cidadÃƒÂ£o para o serviÃƒÂ§o: ${service.name}`,
        timestamp: new Date()
        }
        });

    // Criar interaÃƒÂ§ÃƒÂ£o inicial
    await prisma.protocolInteraction.create({
      data: {
        protocolId: protocol.id,
        type: 'MESSAGE',
        authorType: 'CITIZEN',
        authorId: citizenId,
        authorName: citizenName || 'CidadÃƒÂ£o',
        message: `Protocolo ${protocolNumber} criado`,
        isInternal: false,
        isRead: false
        }
        });

    // Criar documentos PENDING/UPLOADED na tabela ProtocolDocument
    await createPendingDocumentsForProtocol(protocol.id, service, uploadedDocuments);

    // Ã¢Å“â€¦ INICIALIZAR WORKFLOW OBRIGATORIAMENTE (FALHA SE NÃƒÆ’O CONSEGUIR)
    console.log(`Ã°Å¸â€œâ€¹ Inicializando workflow para protocolo ${protocol.id}`);
    const stages = await applyWorkflowToProtocol(protocol.id);

    if (!stages || stages.length === 0) {
      // Ã¢ÂÅ’ ServiÃƒÂ§o nÃƒÂ£o tem workflow configurado - FALHA CRIAÃƒâ€¡ÃƒÆ’O
      throw new Error(`ServiÃƒÂ§o "${service.name}" nÃƒÂ£o possui workflow configurado. Configure o workflow antes de criar protocolos.`);
    }
    console.log(`   Ã¢Å“â€œ Workflow inicializado com ${stages.length} etapa(s), primeira IN_PROGRESS`);

    // Ã¢Å“â€¦ CRIAR SLA OBRIGATORIAMENTE (FALHA SE NÃƒÆ’O CONSEGUIR)
    console.log('Ã¢ÂÂ±Ã¯Â¸Â  Criando SLA do protocolo');
    const sla = await createProtocolSLA(protocol.id);

    if (!sla) {
      // Ã¢ÂÅ’ SLA nÃƒÂ£o foi criado - FALHA CRIAÃƒâ€¡ÃƒÆ’O
      throw new Error('Erro ao criar SLA do protocolo');
    }
    console.log('   Ã¢Å“â€œ SLA criado com sucesso');

    console.log('Ã¢Å“â€¦ Protocolo criado:', protocol.number);

    // Ã¢Å“â€¦ FASE 1: Enviar notificaÃƒÂ§ÃƒÂ£o via mensageiro
    try {
      await messageNotificationService.notifyProtocolCreated(protocol.id);
      console.log('   Ã¢Å“â€œ NotificaÃƒÂ§ÃƒÂ£o de criaÃƒÂ§ÃƒÂ£o enviada via mensageiro');
    } catch (notifError) {
      console.error('   Ã¢Å¡Â Ã¯Â¸Â  Erro ao enviar notificaÃƒÂ§ÃƒÂ£o:', notifError);
      // NÃƒÂ£o falhar a criaÃƒÂ§ÃƒÂ£o do protocolo se notificaÃƒÂ§ÃƒÂ£o falhar
    }

    console.log('========== FIM POST /protocols ==========\n');

    return res.status(201).json({
      success: true,
      protocol,
      message: 'Protocolo criado com sucesso'
        });
  } catch (error) {
    console.error('Ã¢ÂÅ’ Erro ao criar protocolo:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro interno do servidor',
      message: error instanceof Error ? error.message : 'Erro desconhecido'
        });
  }
});

// GET /api/citizen/protocols - Listar protocolos do cidadÃƒÂ£o logado
router.get('/', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
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

    // Buscar protocolos do cidadÃƒÂ£o
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
    console.error('Erro ao buscar protocolos do cidadÃƒÂ£o:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/citizen/protocols/:id - Detalhes de um protocolo especÃƒÂ­fico
router.get('/:id', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    // Buscar protocolo
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id,
        citizenId, // Garantir que o protocolo pertence ao cidadÃƒÂ£o
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
      return res.status(404).json({ error: 'Protocolo nÃƒÂ£o encontrado' });
    }

    // Buscar histÃƒÂ³rico do protocolo
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

// GET /api/citizen/protocols/:id/interactions - Listar interaÃƒÂ§ÃƒÂµes do protocolo
router.get('/:id/interactions', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id,
        citizenId
        }
        });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo nÃƒÂ£o encontrado' });
    }

    // Buscar interaÃƒÂ§ÃƒÂµes (apenas pÃƒÂºblicas para cidadÃƒÂ£os)
    const interactions = await prisma.protocolInteraction.findMany({
      where: {
        protocolId: id,
        isInternal: false, // Apenas interaÃƒÂ§ÃƒÂµes pÃƒÂºblicas
      },
      orderBy: {
        createdAt: 'asc'
        }
        });

    return res.json({
      interactions
        });
  } catch (error) {
    console.error('Erro ao buscar interaÃƒÂ§ÃƒÂµes:', error);
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/citizen/protocols/:id/interactions - Criar nova interaÃƒÂ§ÃƒÂ£o
router.post('/:id/interactions', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const citizenName = (req as any).citizen?.name;
    const { id } = req.params;
    const { message, type } = req.body;

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({ error: 'Mensagem ÃƒÂ© obrigatÃƒÂ³ria' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id,
        citizenId
        }
        });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo nÃƒÂ£o encontrado' });
    }

    // Criar interaÃƒÂ§ÃƒÂ£o
    const interaction = await prisma.protocolInteraction.create({
      data: {
        protocolId: id,
        type: type || 'MESSAGE',
        authorType: 'CITIZEN',
        authorId: citizenId,
        authorName: citizenName || 'CidadÃƒÂ£o',
        message: message.trim(),
        isInternal: false,
        isRead: false
        }
        });

    // Ã¢Å“â€¦ FASE 1: Notificar servidor sobre novo comentÃƒÂ¡rio do cidadÃƒÂ£o
    try {
      await messageNotificationService.notifyNewComment(
        id,
        message.trim(),
        citizenName || 'CidadÃƒÂ£o'
      );
    } catch (notifError) {
      console.error('Erro ao enviar notificaÃƒÂ§ÃƒÂ£o de comentÃƒÂ¡rio:', notifError);
    }

    return res.status(201).json({
      interaction
        });
  } catch (error) {
    console.error('Erro ao criar interaÃƒÂ§ÃƒÂ£o:', error);
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
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id,
        citizenId
        }
        });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo nÃƒÂ£o encontrado' });
    }

    // Verificar se o protocolo jÃƒÂ¡ estÃƒÂ¡ cancelado ou concluÃƒÂ­do
    if (protocol.status === 'CANCELADO') {
      return res.status(400).json({ error: 'Protocolo jÃƒÂ¡ estÃƒÂ¡ cancelado' });
    }

    if (protocol.status === 'CONCLUIDO') {
      return res.status(400).json({ error: 'NÃƒÂ£o ÃƒÂ© possÃƒÂ­vel cancelar um protocolo concluÃƒÂ­do' });
    }

    // Verificar se hÃƒÂ¡ interaÃƒÂ§ÃƒÂµes de servidores (exceto a criaÃƒÂ§ÃƒÂ£o do protocolo)
    const serverInteractions = await prisma.protocolInteraction.findMany({
      where: {
        protocolId: id,
        authorType: {
          in: ['SERVER', 'SYSTEM']
        }
        },
      take: 1
        });

    if (serverInteractions.length > 0) {
      return res.status(400).json({
        error: 'NÃƒÂ£o ÃƒÂ© possÃƒÂ­vel cancelar o protocolo pois jÃƒÂ¡ hÃƒÂ¡ interaÃƒÂ§ÃƒÂµes da secretaria',
        canCancel: false
        });
    }

    // Verificar se hÃƒÂ¡ pendÃƒÂªncias
    const pendencies = await prisma.protocolPending.findMany({
      where: {
        protocolId: id
        },
      take: 1
        });

    if (pendencies.length > 0) {
      return res.status(400).json({
        error: 'NÃƒÂ£o ÃƒÂ© possÃƒÂ­vel cancelar o protocolo pois hÃƒÂ¡ pendÃƒÂªncias registradas',
        canCancel: false
        });
    }

    // Atualizar status do protocolo para CANCELADO usando motor centralizado
    const result = await protocolStatusEngine.updateStatus({
      protocolId: id,
      newStatus: 'CANCELADO',
      actorId: citizenId,
      actorRole: 'CITIZEN',
      comment: reason || 'Cancelado a pedido do cidadÃƒÂ£o',
      reason: reason,
      metadata: {
        source: 'citizen-protocols',
        action: 'citizen_cancellation'
      }
    });

    const updatedProtocol = result.protocol;

    // Criar interaÃƒÂ§ÃƒÂ£o informando o cancelamento
    await prisma.protocolInteraction.create({
      data: {
        protocolId: id,
        type: 'CANCELLATION',
        authorType: 'CITIZEN',
        authorId: citizenId,
        authorName: citizenName || 'CidadÃƒÂ£o',
        message: reason ? `Protocolo cancelado. Motivo: ${reason}` : 'Protocolo cancelado pelo cidadÃƒÂ£o',
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
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id,
        citizenId
        }
        });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocolo nÃƒÂ£o encontrado' });
    }

    let canCancel = true;
    let reason = '';

    // Verificar status
    if (protocol.status === 'CANCELADO') {
      canCancel = false;
      reason = 'Protocolo jÃƒÂ¡ estÃƒÂ¡ cancelado';
    } else if (protocol.status === 'CONCLUIDO') {
      canCancel = false;
      reason = 'Protocolo jÃƒÂ¡ foi concluÃƒÂ­do';
    } else {
      // Verificar interaÃƒÂ§ÃƒÂµes de servidores
      const serverInteractions = await prisma.protocolInteraction.findMany({
        where: {
          protocolId: id,
          authorType: {
            in: ['SERVER', 'SYSTEM']
        }
        },
        take: 1
        });

      if (serverInteractions.length > 0) {
        canCancel = false;
        reason = 'Protocolo jÃƒÂ¡ possui interaÃƒÂ§ÃƒÂµes da secretaria';
      }

      // Verificar pendÃƒÂªncias
      const pendencies = await prisma.protocolPending.findMany({
        where: {
          protocolId: id
        },
        take: 1
        });

      if (pendencies.length > 0) {
        canCancel = false;
        reason = 'Protocolo possui pendÃƒÂªncias registradas';
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
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃƒÂ£o encontrado'
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
 * Listar pendÃªncias do protocolo
 */
router.get('/:id/pendings', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃ£o nÃ£o autenticado' });
    }

    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃ£o encontrado'
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
      error: 'Erro ao buscar pendÃªncias do protocolo'
    });
  }
});

/**
 * PATCH /api/citizen/protocols/:id/pendings/:pendingId/resolve
 * Resolver uma pendÃªncia com texto ou dados corrigidos
 */
router.patch('/:id/pendings/:pendingId/resolve', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId, pendingId } = req.params;
    const { resolution } = req.body;

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃ£o nÃ£o autenticado' });
    }

    if (!resolution || !String(resolution).trim()) {
      return res.status(400).json({ error: 'ResoluÃ§Ã£o Ã© obrigatÃ³ria' });
    }

    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃ£o encontrado'
      });
    }

    const pending = await prisma.protocolPending.findFirst({
      where: { id: pendingId, protocolId }
    });

    if (!pending) {
      return res.status(404).json({
        success: false,
        error: 'PendÃªncia nÃ£o encontrada'
      });
    }

    if (!['OPEN', 'IN_PROGRESS'].includes(pending.status)) {
      return res.status(400).json({
        success: false,
        error: pending.status === 'UNDER_REVIEW'
          ? 'A pendÃªncia jÃ¡ recebeu sua resposta e aguarda anÃ¡lise da equipe'
          : 'PendÃªncia jÃ¡ foi resolvida ou cancelada'
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
      error: error?.message || 'Erro ao resolver pendÃªncia'
    });
  }
});

/**
 * PATCH /api/citizen/protocols/:id/pendings/:pendingId/resolve-with-document
 * Resolver uma pendÃªncia enviando um documento
 */
router.patch('/:id/pendings/:pendingId/resolve-with-document', upload.single('document'), async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId, pendingId } = req.params;
    const file = req.file;

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃ£o nÃ£o autenticado' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Documento Ã© obrigatÃ³rio' });
    }

    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃ£o encontrado'
      });
    }

    const pending = await prisma.protocolPending.findFirst({
      where: { id: pendingId, protocolId }
    });

    if (!pending) {
      return res.status(404).json({
        success: false,
        error: 'PendÃªncia nÃ£o encontrada'
      });
    }

    if (!['OPEN', 'IN_PROGRESS'].includes(pending.status)) {
      return res.status(400).json({
        success: false,
        error: pending.status === 'UNDER_REVIEW'
          ? 'A pendÃªncia jÃ¡ recebeu sua resposta e aguarda anÃ¡lise da equipe'
          : 'PendÃªncia jÃ¡ foi resolvida ou cancelada'
      });
    }

    const updatedPending = await resolveCitizenPendingWithDocument(
      protocolId,
      pending,
      citizenId,
      file
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
 * Listar vÃƒÂ­nculos de cidadÃƒÂ£os do protocolo (somente leitura)
 */
router.get('/:id/citizen-links', async (req, res) => {
  try {
    const { id: protocolId } = req.params;
    const citizenId = (req as any).citizenId;

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o logado
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId: citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃƒÂ£o encontrado'
      });
    }

    // Buscar vÃƒÂ­nculos do protocolo
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
      error: 'Erro ao buscar vÃƒÂ­nculos do protocolo'
    });
  }
});

// ========================================
// PROTOCOL DOCUMENTS
// ========================================

/**
 * POST /api/citizen/protocols/:id/documents/upload
 * Upload de documento adicional pelo cidadÃƒÂ£o
 */
router.post('/:id/documents/upload', upload.single('document'), async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId } = req.params;
    const file = req.file;

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    if (!file) {
      return res.status(400).json({ error: 'Documento ÃƒÂ© obrigatÃƒÂ³rio' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃƒÂ£o encontrado'
      });
    }

    // Mover arquivo para diretÃƒÂ³rio do protocolo
    const protocolDir = ensureProtocolDir(protocolId);
    const newPath = path.join(protocolDir, file.filename);
    fs.renameSync(file.path, newPath);

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

    // Criar histÃƒÂ³rico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId,
        action: 'DOCUMENTO_ENVIADO',
        comment: `Documento adicional enviado: ${file.originalname}`,
        timestamp: new Date()
      }
    });

    // Ã¢Å“â€¦ FASE 1: Notificar servidor sobre documento enviado
    try {
      await messageNotificationService.notifyDocumentUploaded(
        protocolId,
        file.originalname
      );
    } catch (notifError) {
      console.error('Erro ao enviar notificaÃƒÂ§ÃƒÂ£o de documento:', notifError);
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
 * Listar documentos enviados pelo cidadÃƒÂ£o para o protocolo
 */
router.get('/:id/documents', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃƒÂ£o encontrado'
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
 * Download ou visualizaÃƒÂ§ÃƒÂ£o de um documento
 */
router.get('/:id/documents/:documentId/download', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId, documentId } = req.params;
    const inline = req.query.inline === 'true';

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃƒÂ£o encontrado'
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
        error: 'Documento nÃƒÂ£o encontrado'
      });
    }

    if (!document.fileUrl) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo nÃƒÂ£o disponÃƒÂ­vel'
      });
    }

    // Se fileUrl ÃƒÂ© uma URL externa
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
        error: 'Arquivo nÃƒÂ£o encontrado no servidor'
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
    res.setHeader('Access-Control-Allow-Origin', '*');

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
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃƒÂ£o encontrado'
      });
    }

    // Ã¢Å“â€¦ CORREÃƒâ€¡ÃƒÆ’O: Buscar documentos gerados na tabela GeneratedDocument
    const docs = await prisma.generatedDocument.findMany({
      where: {
        protocolId,
        isActive: true
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
      // Ã¢Å“â€¦ CORREÃƒâ€¡ÃƒÆ’O: Enviar apenas metadados essenciais (sem variablesUsed)
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
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃƒÂ£o encontrado'
      });
    }

    // Ã¢Å“â€¦ CORREÃƒâ€¡ÃƒÆ’O: Buscar na tabela GeneratedDocument
    const document = await prisma.generatedDocument.findFirst({
      where: {
        id: documentId,
        protocolId,
        isActive: true
      }
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: 'Documento nÃƒÂ£o encontrado'
      });
    }

    // Verificar se arquivo existe
    const filePathFromDB = document.filePath;

    if (!filePathFromDB) {
      return res.status(404).json({
        success: false,
        error: 'Caminho do arquivo nÃƒÂ£o disponÃƒÂ­vel'
      });
    }

    // Construir caminho absoluto do arquivo
    const filePath = path.join(process.cwd(), filePathFromDB);

    console.log('[DEBUG] Download de documento gerado:');
    console.log('  - Document ID:', documentId);
    console.log('  - Protocol ID:', protocolId);
    console.log('  - FilePath (DB):', filePathFromDB);
    console.log('  - Full filePath:', filePath);
    console.log('  - Process CWD:', process.cwd());
    console.log('  - File exists:', fs.existsSync(filePath));

    // Verificar se arquivo existe no sistema de arquivos
    if (!fs.existsSync(filePath)) {
      console.error(`[ERROR] Arquivo nÃƒÂ£o encontrado: ${filePath}`);
      return res.status(404).json({
        success: false,
        error: 'Arquivo nÃƒÂ£o encontrado no servidor'
      });
    }

    // Usar mimeType do documento gerado
    const mimeType = document.mimeType || 'application/pdf';

    // Configurar headers para download ou visualizaÃƒÂ§ÃƒÂ£o
    const disposition = inline ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${document.fileName}"`);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', document.fileSize.toString());
    res.setHeader('Access-Control-Allow-Origin', '*');

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
 * Contar mensagens nÃƒÂ£o lidas do protocolo
 */
router.get('/:id/interactions/unread-count', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const { id: protocolId } = req.params;

    if (!citizenId) {
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃƒÂ£o encontrado'
      });
    }

    // Contar mensagens nÃƒÂ£o lidas (mensagens do servidor/sistema para o cidadÃƒÂ£o)
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
      error: 'Erro ao contar mensagens nÃƒÂ£o lidas'
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
      return res.status(401).json({ error: 'CidadÃƒÂ£o nÃƒÂ£o autenticado' });
    }

    // Verificar se o protocolo pertence ao cidadÃƒÂ£o
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo nÃƒÂ£o encontrado'
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

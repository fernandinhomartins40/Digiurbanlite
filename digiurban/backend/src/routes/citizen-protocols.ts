/**
 * ============================================================================
 * CITIZEN PROTOCOLS ROUTES
 * ============================================================================
 * Rotas para cidadãos acessarem seus protocolos
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { upload, getProtocolFileUrl, ensureProtocolDir } from '../config/upload';
import { generateProtocolNumberSafe } from '../services/protocol-number.service';
import { protocolStatusEngine } from '../services/protocol-status.engine';
import { DocumentStatus } from '@prisma/client';
import { applyWorkflowToProtocol } from '../services/module-workflow.service';
import { createProtocolSLA } from '../services/protocol-sla.service';
import { sanitizeDocumentId, matchDocumentType, mapUploadedFilesToDocuments } from '../utils/document-mapping';
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

// Middleware de autenticação do cidadão
router.use(citizenAuthMiddleware);

// POST /api/citizen/protocols - Criar novo protocolo com upload de arquivos
// ✅ CORREÇÃO CRÍTICA: usar .any() ao invés de .array('documents')
// Frontend envia: documents[0][file], documents[1][file], etc
// Multer .array() só aceita: documents[], documents[], etc
router.post('/', upload.any(), async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const citizenName = (req as any).citizen?.name;
    const files = req.files as Express.Multer.File[];

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
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
      console.log('📁 Arquivos recebidos:');
      files.forEach((file, idx) => {
        console.log(`  [${idx}] ${file.originalname} - ${file.size} bytes - ${file.mimetype}`);
        console.log(`      fieldname: ${file.fieldname}`);
        console.log(`      path: ${file.path}`);
      });
    } else {
      console.log('⚠️  NENHUM arquivo recebido!');
      console.log('   req.files:', req.files);
      console.log('   req.file:', (req as any).file);
    }

    // Debug: Mostrar todos os campos do req.body
    console.log('   📋 req.body keys:', Object.keys(req.body));

    // ✅ EXTRAÇÃO ROBUSTA: Aceitar múltiplos formatos
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

    console.log('   🏷️  Document Types extraídos:', documentTypes);
    console.log('   📦 Total de arquivos:', files?.length || 0);

    // TEMPORÁRIO: Mover arquivos para diretório temporário
    // Após criar protocolo, moveremos para /uploads/protocols/{protocolId}/
    const tempUploadedFiles = files ? files.map((file, index) => {
      const documentType = documentTypes[index];

      if (!documentType) {
        console.warn(`   ⚠️  Arquivo ${index} (${file.originalname}) SEM documentType definido!`);
      }

      console.log(`   → Arquivo ${index}: ${file.originalname}`);
      console.log(`      - Tipo de documento: ${documentType || 'INDEFINIDO'}`);

      return {
        id: documentType || file.originalname,
        documentId: documentType || file.originalname,
        name: file.originalname,
        tempPath: file.path,  // Caminho temporário em /uploads/documents
        size: file.size,
        mimetype: file.mimetype,
        filename: file.filename
      };
    }) : [];

    console.log('Uploaded Documents (temp):', tempUploadedFiles.length);

    // Buscar serviço
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
        error: 'Serviço não encontrado'
        });
    }

    // Gerar número do protocolo - Sistema centralizado com lock
    const protocolNumber = await generateProtocolNumberSafe();

    // Criar protocolo
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: service.name,
        description: service.description || `Solicitação de ${service.name}`,
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

    // ✅ FASE 1: Mover arquivos para diretório do protocolo com padrão único
    const protocolDir = ensureProtocolDir(protocol.id);
    const uploadedDocuments = tempUploadedFiles.map(file => {
      const newFilename = file.filename;
      const newPath = path.join(protocolDir, newFilename);

      // Mover arquivo de /uploads/documents para /uploads/protocols/{protocolId}
      fs.renameSync(file.tempPath, newPath);
      console.log(`   ✓ Arquivo movido: ${file.name} → ${newPath}`);

      return {
        ...file,
        url: getProtocolFileUrl(protocol.id, newFilename),
        uploadedAt: new Date().toISOString()
      };
    });

    // Criar histórico inicial
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'Protocolo criado',
        comment: `Protocolo criado pelo cidadão para o serviço: ${service.name}`,
        timestamp: new Date()
        }
        });

    // Criar interação inicial
    await prisma.protocolInteraction.create({
      data: {
        protocolId: protocol.id,
        type: 'MESSAGE',
        authorType: 'CITIZEN',
        authorId: citizenId,
        authorName: citizenName || 'Cidadão',
        message: `Protocolo ${protocolNumber} criado`,
        isInternal: false,
        isRead: false
        }
        });

    // Criar documentos PENDING/UPLOADED na tabela ProtocolDocument
    await createPendingDocumentsForProtocol(protocol.id, service, uploadedDocuments);

    // ✅ INICIALIZAR WORKFLOW OBRIGATORIAMENTE (FALHA SE NÃO CONSEGUIR)
    console.log(`📋 Inicializando workflow para protocolo ${protocol.id}`);
    const stages = await applyWorkflowToProtocol(protocol.id, protocol.moduleType || undefined);

    if (!stages || stages.length === 0) {
      // ❌ Serviço não tem workflow configurado - FALHA CRIAÇÃO
      throw new Error(`Serviço "${service.name}" não possui workflow configurado. Configure o workflow antes de criar protocolos.`);
    }
    console.log(`   ✓ Workflow inicializado com ${stages.length} etapa(s), primeira IN_PROGRESS`);

    // ✅ CRIAR SLA OBRIGATORIAMENTE (FALHA SE NÃO CONSEGUIR)
    console.log('⏱️  Criando SLA do protocolo');
    const sla = await createProtocolSLA(protocol.id);

    if (!sla) {
      // ❌ SLA não foi criado - FALHA CRIAÇÃO
      throw new Error('Erro ao criar SLA do protocolo');
    }
    console.log('   ✓ SLA criado com sucesso');

    console.log('✅ Protocolo criado:', protocol.number);
    console.log('========== FIM POST /protocols ==========\n');

    return res.status(201).json({
      success: true,
      protocol,
      message: 'Protocolo criado com sucesso'
        });
  } catch (error) {
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

    return res.json({
      protocols,
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
      protocol,
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

    // Verificar se há interações de servidores (exceto a criação do protocolo)
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
        error: 'Não é possível cancelar o protocolo pois já há interações da secretaria',
        canCancel: false
        });
    }

    // Verificar se há pendências
    const pendencies = await prisma.protocolPending.findMany({
      where: {
        protocolId: id
        },
      take: 1
        });

    if (pendencies.length > 0) {
      return res.status(400).json({
        error: 'Não é possível cancelar o protocolo pois há pendências registradas',
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
      // Verificar interações de servidores
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
        reason = 'Protocolo já possui interações da secretaria';
      }

      // Verificar pendências
      const pendencies = await prisma.protocolPending.findMany({
        where: {
          protocolId: id
        },
        take: 1
        });

      if (pendencies.length > 0) {
        canCancel = false;
        reason = 'Protocolo possui pendências registradas';
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
 * Listar pendências do protocolo (somente leitura)
 */
router.get('/:id/pendings', async (req, res) => {
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

    // Buscar pendências do protocolo
    const pendings = await prisma.protocolPending.findMany({
      where: { protocolId },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({
      success: true,
      data: pendings
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
 * Resolver uma pendência (cidadão pode responder)
 */
router.patch('/:id/pendings/:pendingId/resolve', async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const citizenName = (req as any).citizen?.name;
    const { id: protocolId, pendingId } = req.params;
    const { resolution } = req.body;

    if (!citizenId) {
      return res.status(401).json({ error: 'Cidadão não autenticado' });
    }

    if (!resolution || !resolution.trim()) {
      return res.status(400).json({ error: 'Resolução é obrigatória' });
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

    // Verificar se a pendência existe e pertence ao protocolo
    const pending = await prisma.protocolPending.findFirst({
      where: {
        id: pendingId,
        protocolId
      }
    });

    if (!pending) {
      return res.status(404).json({
        success: false,
        error: 'Pendência não encontrada'
      });
    }

    if (pending.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: 'Pendência já foi resolvida ou cancelada'
      });
    }

    // Atualizar pendência
    const updatedPending = await prisma.protocolPending.update({
      where: { id: pendingId },
      data: {
        status: 'RESOLVED',
        resolution: resolution.trim(),
        resolvedAt: new Date(),
        resolvedBy: citizenId
      }
    });

    // Criar interação informando a resolução
    await prisma.protocolInteraction.create({
      data: {
        protocolId,
        type: 'MESSAGE',
        authorType: 'CITIZEN',
        authorId: citizenId,
        authorName: citizenName || 'Cidadão',
        message: `Pendência resolvida: ${pending.title || pending.description}\n\nResolução: ${resolution.trim()}`,
        isInternal: false,
        isRead: false
      }
    });

    return res.json({
      success: true,
      data: updatedPending
    });
  } catch (error: any) {
    console.error('Error resolving pending:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao resolver pendência'
    });
  }
});

/**
 * PATCH /api/citizen/protocols/:id/pendings/:pendingId/resolve-with-document
 * Resolver uma pendência enviando um documento
 */
router.patch('/:id/pendings/:pendingId/resolve-with-document', upload.single('document'), async (req, res) => {
  try {
    const citizenId = (req as any).citizen?.id;
    const citizenName = (req as any).citizen?.name;
    const { id: protocolId, pendingId } = req.params;
    const file = req.file;

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

    // Verificar se a pendência existe e pertence ao protocolo
    const pending = await prisma.protocolPending.findFirst({
      where: {
        id: pendingId,
        protocolId
      }
    });

    if (!pending) {
      return res.status(404).json({
        success: false,
        error: 'Pendência não encontrada'
      });
    }

    if (pending.status !== 'OPEN') {
      return res.status(400).json({
        success: false,
        error: 'Pendência já foi resolvida ou cancelada'
      });
    }

    // Verificar se a pendência é do tipo DOCUMENT
    if (pending.type !== 'DOCUMENT') {
      return res.status(400).json({
        success: false,
        error: 'Esta pendência não é do tipo documento'
      });
    }

    // Criar documento no protocolo
    const metadata = pending.metadata as any;
    const documentType = metadata?.documentType || pending.title || 'DOCUMENTO_PENDENCIA';

    // ✅ FASE 1: Mover arquivo para diretório do protocolo
    const protocolDir = ensureProtocolDir(protocolId);
    const newPath = path.join(protocolDir, file.filename);
    fs.renameSync(file.path, newPath);

    const uploadedDoc = await prisma.protocolDocument.create({
      data: {
        protocolId,
        documentType,
        isRequired: true,
        status: DocumentStatus.UPLOADED,
        fileName: file.originalname,
        fileUrl: getProtocolFileUrl(protocolId, file.filename),
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadedAt: new Date(),
        uploadedBy: citizenId
      }
    });

    // Atualizar pendência como resolvida
    const newMetadata = typeof pending.metadata === 'object' && pending.metadata !== null
      ? { ...(pending.metadata as object), uploadedDocumentId: uploadedDoc.id }
      : { uploadedDocumentId: uploadedDoc.id };

    const updatedPending = await prisma.protocolPending.update({
      where: { id: pendingId },
      data: {
        status: 'RESOLVED',
        resolution: `Documento enviado: ${file.originalname}`,
        resolvedAt: new Date(),
        resolvedBy: citizenId,
        metadata: newMetadata
      }
    });

    // Criar interação informando o envio do documento
    await prisma.protocolInteraction.create({
      data: {
        protocolId,
        type: 'DOCUMENT_UPLOAD',
        authorType: 'CITIZEN',
        authorId: citizenId,
        authorName: citizenName || 'Cidadão',
        message: `Documento enviado para resolver pendência: ${pending.title}\n\nArquivo: ${file.originalname}`,
        isInternal: false,
        isRead: false
      }
    });

    return res.json({
      success: true,
      data: {
        pending: updatedPending,
        document: uploadedDoc
      }
    });
  } catch (error: any) {
    console.error('Error resolving pending with document:', error);
    return res.status(500).json({
      success: false,
      error: 'Erro ao enviar documento'
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
    const file = req.file;

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

    // Criar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId,
        action: 'DOCUMENTO_ENVIADO',
        comment: `Documento adicional enviado: ${file.originalname}`,
        timestamp: new Date()
      }
    });

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
    const documents = await prisma.protocolDocument.findMany({
      where: { protocolId },
      orderBy: { uploadedAt: 'desc' }
    });

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

    // Buscar documentos gerados - usar tabela GeneratedDocument se existir
    // Por enquanto, retornar baseado em documentos do tipo GENERATED ou protocolo concluído
    const generatedDocuments: any[] = [];

    // Se protocolo está concluído, gerar documentos automaticamente
    if (protocol.status === 'CONCLUIDO') {
      // Buscar documentos do tipo certificado/certidão
      const docs = await prisma.protocolDocument.findMany({
        where: {
          protocolId,
          documentType: {
            in: ['CERTIDAO', 'CERTIFICADO', 'COMPROVANTE', 'DOCUMENTO_GERADO']
          }
        },
        orderBy: { uploadedAt: 'desc' }
      });

      for (const doc of docs) {
        generatedDocuments.push({
          id: doc.id,
          type: doc.documentType,
          name: doc.fileName || `${doc.documentType} - Protocolo ${protocol.number}`,
          generatedAt: doc.uploadedAt?.toISOString() || protocol.updatedAt.toISOString(),
          expiresAt: null,
          validationCode: `VAL-2026-${protocol.number.replace(/[^0-9]/g, '')}`,
          fileUrl: doc.fileUrl,
          metadata: {
            emitente: 'Sistema',
            validade: 'Indeterminada',
            protocolo: protocol.number
          }
        });
      }
    }

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

    // Redirecionar para o endpoint de download de documentos normais
    // pois documentos gerados também são armazenados na mesma tabela
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

    // Arquivo local
    const { getProtocolFilePath, extractFilename } = await import('../config/upload');
    const filename = extractFilename(document.fileUrl);
    const filePath = getProtocolFilePath(protocolId, filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo não encontrado no servidor'
      });
    }

    const guessMimeFromExtension = (fileName?: string): string => {
      if (!fileName) return 'application/pdf';
      const lower = fileName.toLowerCase();
      if (lower.endsWith('.pdf')) return 'application/pdf';
      if (lower.match(/\.(jpg|jpeg)$/)) return 'image/jpeg';
      if (lower.endsWith('.png')) return 'image/png';
      return 'application/pdf';
    };

    const mimeType = document.mimeType || guessMimeFromExtension(document.fileName || undefined);

    const disposition = inline ? 'inline' : 'attachment';
    res.setHeader('Content-Disposition', `${disposition}; filename="${document.fileName || 'documento'}"`);
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Access-Control-Allow-Origin', '*');

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

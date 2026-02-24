/**
 * Rotas Internas - API para chamadas de serviços internos (UltraZend)
 */

import { Router, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { internalAuthMiddleware } from '../middleware/internal-auth';
import { uploadDocuments } from '../config/upload';
import { prisma } from '../lib/prisma';
import { validateServiceFormData } from '../lib/json-schema-validator';
import { DocumentUploadService } from '../services/document-upload.service';
import { validateProtocolUniqueness } from '../services/protocol-uniqueness.service';
import { ensureRequiredProtocolDocuments } from '../services/required-protocol-documents.service';
import { protocolModuleService } from '../services/protocol-module.service';

const router = Router();
const documentUploadService = new DocumentUploadService();

// Aplicar middleware de autenticação em todas as rotas
router.use(internalAuthMiddleware);

const coerceObject = (value: any) => {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    } catch {
      return {};
    }
  }

  return {};
};

// ========================================
// CITIZENS
// ========================================

// GET /api/internal/citizens/:citizenId - Buscar cidadão por ID
router.get('/citizens/:citizenId', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.params;

    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: {
        id: true,
        name: true,
        cpf: true,
        email: true,
        phone: true,
        phoneSecondary: true,
        birthDate: true,
        address: true,
        municipioId: true,
        isActive: true,
        verificationStatus: true,
        rg: true,
        motherName: true,
        maritalStatus: true,
        occupation: true,
        familyIncome: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!citizen) {
      return res.status(404).json({ error: 'Citizen not found' });
    }

    res.json(citizen);
  } catch (error) {
    console.error('[internal.routes] Error in GET /citizens/:citizenId', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/internal/citizens/:citizenId - Atualizar perfil do cidadão
router.put('/citizens/:citizenId', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.params;
    const updates = req.body;

    // Campos permitidos para atualização
    const allowedFields = [
      'name', 'email', 'phone', 'phoneSecondary', 'birthDate',
      'address', 'rg', 'motherName', 'maritalStatus', 'occupation', 'familyIncome'
    ];

    const dataToUpdate: any = {};
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        dataToUpdate[field] = updates[field];
      }
    }

    // EndereÃ§o Ã© um JSON: fazer merge com o endereÃ§o atual para permitir atualizaÃ§Ãµes parciais
    // e suportar "pular" no complemento (fluxo envia sem o campo em vez de sobrescrever com "pular").
    if (dataToUpdate.address !== undefined) {
      const incomingAddress = coerceObject(dataToUpdate.address);

      if (incomingAddress && Object.keys(incomingAddress).length > 0) {
        const existing = await prisma.citizen.findUnique({
          where: { id: citizenId },
          select: { address: true },
        });

        const baseAddress = coerceObject(existing?.address);
        dataToUpdate.address = {
          ...(baseAddress as any),
          ...(incomingAddress as any),
        };
      } else {
        // Evita sobrescrever com objeto vazio
        delete dataToUpdate.address;
      }
    }

    const citizen = await prisma.citizen.update({
      where: { id: citizenId },
      data: dataToUpdate,
    });

    res.json(citizen);
  } catch (error) {
    console.error('[internal.routes] Error in PUT /citizens/:citizenId', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/citizens/:citizenId/family - Composição familiar
router.get('/citizens/:citizenId/family', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.params;

    const familyMembers = await prisma.familyComposition.findMany({
      where: {
        OR: [
          { headId: citizenId },
          { memberId: citizenId },
        ],
      },
      include: {
        head: {
          select: {
            id: true,
            name: true,
            cpf: true,
            birthDate: true,
          },
        },
        member: {
          select: {
            id: true,
            name: true,
            cpf: true,
            birthDate: true,
          },
        },
      },
    });

    res.json(familyMembers);
  } catch (error) {
    console.error('[internal.routes] Error in GET /citizens/:citizenId/family', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// SERVICES
// ========================================

// GET /api/internal/services/search - Buscar serviços
router.get('/services/search', async (req: Request, res: Response) => {
  try {
    const { query, category, limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    let services;
    const selectFields = {
      id: true,
      name: true,
      description: true,
      category: true,
      estimatedDays: true,
      requiresDocuments: true,
      requiredDocuments: true,
      formSchema: true,
      formFieldsConfig: true,
      enabledFields: true,
      moduleType: true,
      department: {
        select: {
          id: true,
          name: true,
        },
      },
    };

    if (query) {
      // Busca por query (texto)
      services = await prisma.serviceSimplified.findMany({
        where: {
          isActive: true,
          OR: [
            { name: { contains: query as string, mode: 'insensitive' } },
            { description: { contains: query as string, mode: 'insensitive' } },
          ],
        },
        take: limitNum,
        orderBy: { name: 'asc' },
        select: selectFields,
      });
    } else if (category) {
      // Busca por categoria
      services = await prisma.serviceSimplified.findMany({
        where: {
          isActive: true,
          category: category as string,
        },
        take: limitNum,
        orderBy: { name: 'asc' },
        select: selectFields,
      });
    } else {
      // Listar serviços populares
      services = await prisma.serviceSimplified.findMany({
        where: { isActive: true },
        take: limitNum,
        orderBy: { name: 'asc' },
        select: selectFields,
      });
    }

    res.json(services);
  } catch (error) {
    console.error('[internal.routes] Error in GET /services/search', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/services - Listar serviços
router.get('/services', async (req: Request, res: Response) => {
  try {
    const { limit = '50' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    console.log('[internal.routes] GET /services - limit:', limitNum);

    const services = await prisma.serviceSimplified.findMany({
      where: { isActive: true },
      take: limitNum,
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        category: true,
        estimatedDays: true,
        requiresDocuments: true,
        requiredDocuments: true,
        formSchema: true,
        formFieldsConfig: true,
        enabledFields: true,
        moduleType: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    console.log('[internal.routes] GET /services - found:', services.length, 'services');

    if (services.length === 0) {
      console.warn('[internal.routes] GET /services - AVISO: Nenhum serviço ativo encontrado no banco!');
    }

    res.json(services);
  } catch (error) {
    console.error('[internal.routes] Error in GET /services', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/services/categories - Listar categorias
router.get('/services/categories', async (req: Request, res: Response) => {
  try {
    const categories = await prisma.serviceSimplified.findMany({
      where: { isActive: true },
      distinct: ['category'],
      select: { category: true },
    });

    const categoryList = categories
      .map(c => c.category)
      .filter(c => c !== null && c !== '')
      .sort();

    res.json(categoryList);
  } catch (error) {
    console.error('[internal.routes] Error in GET /services/categories', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/services/:serviceId - Obter serviço
router.get('/services/:serviceId', async (req: Request, res: Response) => {
  try {
    const { serviceId } = req.params;

    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      include: {
        department: true,
      },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('[internal.routes] Error in GET /services/:serviceId', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// PROTOCOLS
// ========================================

// POST /api/internal/protocols - Criar protocolo
router.post(
  '/protocols',
  (req, res, next) => {
    uploadDocuments(req, res, (err) => {
      if (err) {
        console.error('[internal.routes] Multer error in POST /protocols:', err);
        return res.status(400).json({
          error: 'Erro ao processar upload de arquivos',
          details: err.message,
        });
      }
      next();
    });
  },
  async (req: Request, res: Response) => {
    try {
      const { citizenId, serviceId, description, customData } = req.body as any;

      if (!citizenId || !serviceId) {
        return res.status(400).json({ error: 'citizenId and serviceId are required' });
      }

      const service = await prisma.serviceSimplified.findUnique({
        where: { id: serviceId },
        include: { department: true },
      });

      if (!service) {
        return res.status(404).json({ error: 'Service not found' });
      }

      // Extrair e limpar dados do formulário (description é campo separado)
      const baseCustomData = coerceObject(customData);
      const cleanedCustomData: Record<string, any> = { ...(baseCustomData as any) };
      delete cleanedCustomData.description;
      delete cleanedCustomData.descricao;

      // Validar formData contra o JSON Schema do serviço (se houver)
      if (Object.keys(cleanedCustomData).length > 0) {
        const validation = validateServiceFormData(service as any, cleanedCustomData);
        if (!validation.valid) {
          return res.status(400).json({
            error: 'Dados do formulário inválidos',
            details: validation.errors,
          });
        }
      }

      const moduleFormData = {
        citizenId,
        ...cleanedCustomData,
      };

      // Validação de unicidade (mesma regra do painel do cidadão)
      const uniquenessValidation = await validateProtocolUniqueness(
        citizenId,
        serviceId,
        moduleFormData
      );

      if (!uniquenessValidation.canCreate) {
        return res.status(400).json({
          error: uniquenessValidation.errorMessage || 'Não é possível criar este protocolo',
          reason: uniquenessValidation.reason,
          existingProtocolNumber: uniquenessValidation.existingProtocolNumber,
        });
      }

      // Criar protocolo usando o mesmo pipeline do painel do cidadão
      const result = await protocolModuleService.createProtocolWithModule({
        citizenId,
        serviceId,
        formData: moduleFormData,
        description: description || '',
        createdById: undefined,
      });

      const uploadedFiles = ((req as any).files || []) as Express.Multer.File[];

      let documentTypes: string[] = [];
      if ((req.body as any).documentTypes) {
        const raw = (req.body as any).documentTypes;
        if (Array.isArray(raw)) {
          documentTypes = raw;
        } else if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            documentTypes = Array.isArray(parsed) ? parsed : [raw];
          } catch {
            documentTypes = [raw];
          }
        }
      }

      let uploadedDocsResult: any[] = [];
      let uploadErrors: string[] = [];

      if (uploadedFiles.length > 0) {
        try {
          const uploadResult = await documentUploadService.uploadDocumentsToProtocol({
            protocolId: result.protocol.id,
            files: uploadedFiles,
            uploadedBy: citizenId,
            documentTypes,
          });
          uploadedDocsResult = uploadResult.uploadedDocuments || [];
          uploadErrors = uploadResult.errors || [];
        } catch (docErr: any) {
          console.error('[internal.routes] Error uploading protocol documents:', docErr);
          uploadErrors = [docErr?.message || 'Erro ao salvar documentos do protocolo'];
        }
      }

      // Criar pendentes para documentos obrigatórios que não foram enviados
      await ensureRequiredProtocolDocuments(result.protocol.id, service as any, uploadedDocsResult);

      const fullProtocol = await prisma.protocolSimplified.findUnique({
        where: { id: result.protocol.id },
        include: { service: true, department: true },
      });

      // Registrar uma interaÃ§Ã£o pÃºblica no protocolo (visÃ­vel ao cidadÃ£o)
      // Isso ajuda a manter o histÃ³rico consistente no painel.
      try {
        const citizen = await prisma.citizen.findUnique({
          where: { id: citizenId },
          select: { name: true },
        });

        await prisma.protocolInteraction.create({
          data: {
            protocolId: result.protocol.id,
            type: 'MESSAGE',
            authorType: 'CITIZEN',
            authorId: citizenId,
            authorName: citizen?.name || 'Cidadão',
            message: `Protocolo ${result.protocol.number} criado via DigiBot`,
            isInternal: false,
            isRead: false,
          },
        });
      } catch (interactionErr) {
        console.warn('[internal.routes] Failed to create protocol interaction:', interactionErr);
      }

      const warnings = uploadErrors.filter(Boolean);
      if (warnings.length > 0) {
        console.warn('[internal.routes] Protocol created with warnings:', warnings);
      }

      res.json({ protocol: fullProtocol, warnings });
    } catch (error) {
      console.error('[internal.routes] Error in POST /protocols', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/internal/protocols - Listar protocolos do cidadão
router.get('/protocols', async (req: Request, res: Response) => {
  try {
    const { citizenId, limit = '10' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    const protocols = await prisma.protocolSimplified.findMany({
      where: { citizenId: citizenId as string },
      take: limitNum,
      orderBy: { createdAt: 'desc' },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            estimatedDays: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    res.json(protocols);
  } catch (error) {
    console.error('[internal.routes] Error in GET /protocols', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/protocols/number/:protocolNumber - Buscar por número
router.get('/protocols/number/:protocolNumber', async (req: Request, res: Response) => {
  try {
    const { protocolNumber } = req.params;
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        number: protocolNumber,
        citizenId: citizenId as string,
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            estimatedDays: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    res.json(protocol);
  } catch (error) {
    console.error('[internal.routes] Error in GET /protocols/number/:protocolNumber', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/internal/protocols/:protocolId/comments - Adicionar comentário
router.post('/protocols/:protocolId/comments', async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    const { citizenId, comment } = req.body;

    if (!comment) {
      return res.status(400).json({ error: 'comment is required' });
    }

    // Atualizar protocolo com comentário no metadata ou criar sistema de comentários
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id: protocolId },
      select: { customData: true },
    });

    const existingCustomData = coerceObject(protocol?.customData);
    const existingComments = Array.isArray((existingCustomData as any).comments)
      ? (existingCustomData as any).comments
      : [];

    const newComment = {
      citizenId,
      comment,
      createdAt: new Date().toISOString(),
    };

    const updatedCustomData = {
      ...existingCustomData,
      comments: [...existingComments, newComment],
    };

    const updated = await prisma.protocolSimplified.update({
      where: { id: protocolId },
      data: {
        customData: updatedCustomData,
      },
    });

    await prisma.protocolInteraction.create({
      data: {
        protocolId,
        type: 'MESSAGE',
        authorType: 'CITIZEN',
        authorId: citizenId,
        authorName: 'Cidadao',
        message: comment,
        isInternal: false,
        isRead: false,
      },
    });

    res.json({ success: true, protocol: updated, comment: newComment });
  } catch (error) {
    console.error('[internal.routes] Error in POST /protocols/:protocolId/comments', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// NOTIFICATIONS
// ========================================

// GET /api/internal/notifications - Listar notificações
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { citizenId, unreadOnly = 'false', limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    const where: any = { citizenId: citizenId as string };
    if (unreadOnly === 'true') {
      where.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      take: limitNum,
      orderBy: { createdAt: 'desc' },
    });

    res.json(notifications);
  } catch (error) {
    console.error('[internal.routes] Error in GET /notifications', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/internal/notifications/read - Marcar como lidas
router.put('/notifications/read', async (req: Request, res: Response) => {
  try {
    const { citizenId, notificationIds } = req.body;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    const where: any = { citizenId };
    if (notificationIds && Array.isArray(notificationIds)) {
      where.id = { in: notificationIds };
    }

    await prisma.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[internal.routes] Error in PUT /notifications/read', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// PROTOCOL INTERACTIONS
// ========================================

// GET /api/internal/protocols/:protocolId/interactions - Histórico de interações
router.get('/protocols/:protocolId/interactions', async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId: citizenId as string },
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const interactions = await prisma.protocolInteraction.findMany({
      where: {
        protocolId,
        isInternal: false, // Não mostrar interações internas ao cidadão
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json(interactions);
  } catch (error) {
    console.error('[internal.routes] Error in GET /protocols/:protocolId/interactions', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// DOCUMENTS
// ========================================

// GET /api/internal/citizens/:citizenId/documents - Documentos do cidadão
router.get('/citizens/:citizenId/documents', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.params;
    const { limit = '20' } = req.query;
    const limitNum = parseInt(limit as string, 10);

    const documents = await prisma.protocolDocument.findMany({
      where: {
        protocol: {
          citizenId,
        },
      },
      include: {
        protocol: {
          select: {
            id: true,
            number: true,
            title: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
      take: limitNum,
    });

    res.json(documents);
  } catch (error) {
    console.error('[internal.routes] Error in GET /citizens/:citizenId/documents', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/internal/protocols/:protocolId/documents - Documentos de um protocolo
router.get('/protocols/:protocolId/documents', async (req: Request, res: Response) => {
  try {
    const { protocolId } = req.params;
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    // Verificar se o protocolo pertence ao cidadão
    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id: protocolId, citizenId: citizenId as string },
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found' });
    }

    const documents = await prisma.protocolDocument.findMany({
      where: { protocolId },
      orderBy: { uploadedAt: 'desc' },
    });

    res.json(documents);
  } catch (error) {
    console.error('[internal.routes] Error in GET /protocols/:protocolId/documents', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// EVALUATIONS
// ========================================

// GET /api/internal/evaluations/pending - Protocolos concluídos sem avaliação
router.get('/evaluations/pending', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.query;

    if (!citizenId) {
      return res.status(400).json({ error: 'citizenId is required' });
    }

    // Buscar protocolos concluídos do cidadão que ainda não foram avaliados
    const protocols = await prisma.protocolSimplified.findMany({
      where: {
        citizenId: citizenId as string,
        status: 'CONCLUIDO',
        evaluations: {
          none: {},
        },
      },
      include: {
        service: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { concludedAt: 'desc' },
    });

    res.json(protocols);
  } catch (error) {
    console.error('[internal.routes] Error in GET /evaluations/pending', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/internal/evaluations - Submeter avaliação
router.post('/evaluations', async (req: Request, res: Response) => {
  try {
    const { protocolId, citizenId, rating, comment } = req.body;

    if (!protocolId || !citizenId || rating === undefined) {
      return res.status(400).json({ error: 'protocolId, citizenId and rating are required' });
    }

    // Verificar se o protocolo pertence ao cidadão e está concluído
    const protocol = await prisma.protocolSimplified.findFirst({
      where: {
        id: protocolId,
        citizenId,
        status: 'CONCLUIDO',
      },
    });

    if (!protocol) {
      return res.status(404).json({ error: 'Protocol not found or not completed' });
    }

    // Verificar se já existe avaliação
    const existingEval = await prisma.protocolEvaluationSimplified.findFirst({
      where: { protocolId },
    });

    if (existingEval) {
      return res.status(400).json({ error: 'Protocol already evaluated' });
    }

    const evaluation = await prisma.protocolEvaluationSimplified.create({
      data: {
        protocolId,
        rating: Math.min(5, Math.max(0, parseInt(String(rating), 10))),
        comment: comment || '',
      },
    });

    res.json(evaluation);
  } catch (error) {
    console.error('[internal.routes] Error in POST /evaluations', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ========================================
// DEPARTMENTS
// ========================================

// GET /api/internal/departments - Listar departamentos
router.get('/departments', async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
      },
    });

    res.json(departments);
  } catch (error) {
    console.error('[internal.routes] Error in GET /departments', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;


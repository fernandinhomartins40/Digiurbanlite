/**
 * Rotas Internas - API para chamadas de serviços internos (UltraZend)
 */

import { Router, Request, Response } from 'express';
import { PrismaClient, Prisma } from '@prisma/client';
import { internalAuthMiddleware } from '../middleware/internal-auth';
import { generateProtocolNumberSafe } from '../services/protocol-number.service';
import { applyWorkflowToProtocol } from '../services/service-workflow.service';
import { createProtocolSLA } from '../services/protocol-sla.service';

const router = Router();
const prisma = new PrismaClient();

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
router.post('/protocols', async (req: Request, res: Response) => {
    try {
      const { citizenId, serviceId, description, customData, documents, moduleType } = req.body;

    if (!citizenId || !serviceId) {
      return res.status(400).json({ error: 'citizenId and serviceId are required' });
    }

    // Buscar o serviço
    const service = await prisma.serviceSimplified.findUnique({
      where: { id: serviceId },
      include: {
        department: true,
      },
    });

    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }

    // Gerar número do protocolo
    const protocolNumber = await generateProtocolNumberSafe();

    const baseCustomData = coerceObject(customData);
    const resolvedDocuments = Array.isArray(documents) ? documents : [];
    const mergedCustomData = {
      ...baseCustomData,
      botDocuments: resolvedDocuments,
      source: 'DIGIBOT',
    };

    // Criar protocolo
    const protocol = await prisma.protocolSimplified.create({
      data: {
        number: protocolNumber,
        title: service.name,
        citizenId,
        serviceId,
        departmentId: service.departmentId,
        description: description || '',
        status: 'VINCULADO',
        priority: 3, // Prioridade normal
        customData: mergedCustomData || Prisma.JsonNull,
        moduleType: service.moduleType || moduleType || 'GERAL',
        createdById: citizenId, // Cidadão é o criador
      },
      include: {
        service: true,
        department: true,
      },
    });

    const citizen = await prisma.citizen.findUnique({
      where: { id: citizenId },
      select: { id: true, name: true, cpf: true },
    });

    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: protocol.id,
        action: 'Protocolo criado',
        comment: `Protocolo criado via DigiBot para o serviÇõo: ${service.name}`,
        timestamp: new Date(),
      },
    });

    await prisma.protocolInteraction.create({
      data: {
        protocolId: protocol.id,
        type: 'MESSAGE',
        authorType: 'CITIZEN',
        authorId: citizenId,
        authorName: citizen?.name || 'Cidadao',
        message: `Protocolo ${protocolNumber} criado`,
        isInternal: false,
        isRead: false,
      },
    });

    let workflowWarning: string | null = null;
    let slaWarning: string | null = null;

    try {
      const stages = await applyWorkflowToProtocol(protocol.id);
      if (!stages || stages.length === 0) {
        workflowWarning = `Servico "${service.name}" sem workflow configurado`;
      }
    } catch (error: any) {
      workflowWarning = error?.message || 'Erro ao aplicar workflow';
    }

    try {
      const sla = await createProtocolSLA(protocol.id);
      if (!sla) {
        slaWarning = 'Erro ao criar SLA do protocolo';
      }
    } catch (error: any) {
      slaWarning = error?.message || 'Erro ao criar SLA do protocolo';
    }

    const warnings = [workflowWarning, slaWarning].filter(Boolean);
    if (warnings.length > 0) {
      console.warn('[internal.routes] Protocol created with warnings:', warnings);
    }

    res.json({ protocol, warnings });
  } catch (error) {
    console.error('[internal.routes] Error in POST /protocols', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

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


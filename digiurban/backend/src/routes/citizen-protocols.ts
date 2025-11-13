/**
 * ============================================================================
 * CITIZEN PROTOCOLS ROUTES
 * ============================================================================
 * Rotas para cidadãos acessarem seus protocolos
 */

import { Router } from 'express';
import { prisma } from '../lib/prisma';
import { citizenAuthMiddleware } from '../middleware/citizen-auth';
import { upload, getFileUrl } from '../config/upload';
import { generateProtocolNumberSafe } from '../services/protocol-number.service';
import { protocolStatusEngine } from '../services/protocol-status.engine';

const router = Router();

// Middleware de autenticação do cidadão
router.use(citizenAuthMiddleware);

// POST /api/citizen/protocols - Criar novo protocolo com upload de arquivos
router.post('/', upload.array('documents'), async (req, res) => {
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
    console.log('Files:', files ? files.length : 0);
    console.log('Form Data:', formData);

    // Processar arquivos enviados
    const uploadedDocuments = files ? files.map((file, index) => ({
      id: req.body[`documents[${index}][id]`] || `doc_${index}`,
      name: file.originalname,
      url: getFileUrl(file.filename),
      uploadedAt: new Date().toISOString(),
      size: file.size,
      mimetype: file.mimetype
        })) : [];

    console.log('Uploaded Documents:', uploadedDocuments.length);

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
        moduleType: moduleType || service.category || 'GERAL',
        status: 'VINCULADO',
        priority: 3,
        customData: {
          ...formData,
          programId,
          programName
        },
        documents: uploadedDocuments,
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

export default router;

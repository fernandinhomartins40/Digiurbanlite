/**
 * ============================================================================
 * PROTOCOLS SIMPLIFIED ROUTES - Sistema Integrado com Módulos
 * ============================================================================
 * Rotas de protocolos simplificados com integração automática aos módulos
 */

import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { adminAuthMiddleware, requireMinRole } from '../middleware/admin-auth';
import { UserRole, ProtocolStatus } from '@prisma/client';
import { AuthenticatedRequest } from '../types';
import { protocolModuleService } from '../services/protocol-module.service';
import { protocolServiceSimplified } from '../services/protocol-simplified.service';
import { protocolStatusEngine } from '../services/protocol-status.engine';
import { getProtocolCitizenLinks } from '../services/protocol-citizen-links.service';

const router = Router();

// Aplicar middlewares
router.use(adminAuthMiddleware);

// ========================================
// CRIAR PROTOCOLO (INTEGRADO COM MÓDULOS)
// ========================================

/**
 * POST /api/protocols-simplified
 * Criar novo protocolo (integrado com módulos)
 */
router.post('/', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;

    const {
      serviceId,
      citizenData,
      formData,
      latitude,
      longitude,
      address,
      attachments
        } = req.body;

    // Validações
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        error: 'serviceId é obrigatório'
        });
    }

    if (!citizenData || !citizenData.cpf) {
      return res.status(400).json({
        success: false,
        error: 'Dados do cidadão são obrigatórios (cpf mínimo)'
        });
    }

    // Buscar ou criar cidadão
    let citizen = await prisma.citizen.findFirst({
      where: {
        cpf: citizenData.cpf
        }
        });

    if (!citizen) {
      citizen = await prisma.citizen.create({
        data: {
          cpf: citizenData.cpf,
          name: citizenData.name || 'Cidadão',
          email: citizenData.email || `temp_${citizenData.cpf}@temp.com`,
          phone: citizenData.phone,
          password: 'TEMP_PASSWORD',
          registrationSource: 'ADMIN'
        }
        });
    }

    // Criar protocolo com integração de módulo
    const result = await protocolModuleService.createProtocolWithModule({
      citizenId: citizen.id,
      serviceId,
      formData: formData || {},
      createdById: userId,
      latitude,
      longitude,
      address,
      attachments
        });

    // ✅ NOVO: Buscar citizen links criados
    const citizenLinks = await getProtocolCitizenLinks(result.protocol.id);

    return res.status(201).json({
      success: true,
      data: {
        protocol: result.protocol,
        hasModule: result.hasModule,
        moduleType: result.protocol.moduleType || null,
        citizenLinks // ✅ Retornar links criados
        },
      message: result.hasModule
        ? `Protocolo ${result.protocol.number} criado e vinculado ao módulo`
        : `Protocolo ${result.protocol.number} criado (informativo)`
        });
  } catch (error: any) {
    console.error('Create protocol error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao criar protocolo'
        });
  }
});

// ========================================
// LISTAR TODOS OS PROTOCOLOS (NOVO)
// ========================================

/**
 * GET /api/protocols
 * Lista todos os protocolos com filtros
 */
router.get('/', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const user = authReq.user;

    const {
      status,
      priority,
      search,
      departmentId,
      serviceId,
      serviceIds,  // ✅ NOVO: suporte para múltiplos serviceIds
      assignedUserId,
      page = '1',
      limit = '50'
    } = req.query;

    // Montar filtros baseado no role do usuário
    const where: any = {};

    // Filtros opcionais
    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = parseInt(priority as string);
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    // ✅ FILTRO POR SERVIÇO (para módulos específicos)
    if (serviceId) {
      where.serviceId = serviceId;
    }

    // ✅ NOVO: Filtro por múltiplos serviços (para view agregada SEM_DADOS)
    if (serviceIds) {
      const ids = (serviceIds as string).split(',').filter(id => id.trim());
      if (ids.length > 0) {
        where.serviceId = { in: ids };
      }
    }

    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    // Busca por número, título ou nome do cidadão
    if (search) {
      where.OR = [
        { number: { contains: search as string, mode: 'insensitive' } },
        { title: { contains: search as string, mode: 'insensitive' } },
        { citizen: { name: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    // Restrição de acesso baseado no role
    if (user.role === 'USER') {
      // Usuários comuns veem apenas protocolos atribuídos a eles
      where.assignedUserId = userId;
    } else if (user.role === 'MANAGER') {
      // Gerentes veem protocolos do seu departamento
      if (user.departmentId) {
        where.departmentId = user.departmentId;
      }
    }
    // ADMIN vê todos os protocolos

    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Buscar protocolos
    const [protocols, total] = await Promise.all([
      prisma.protocolSimplified.findMany({
        where,
        include: {
          citizen: {
            select: {
              id: true,
              name: true,
              cpf: true,
              email: true
        }
      },
          service: {
            select: {
              id: true,
              name: true,
              category: true
        }
      },
          department: {
            select: {
              id: true,
              name: true,
              code: true
        }
      },
          assignedUser: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
        }
      },
          createdBy: {
            select: {
              id: true,
              name: true,
              role: true
        }
      },
          _count: {
            select: {
              history: true
        }
      }
        },
        orderBy: {
          createdAt: 'desc'
        },
        skip,
        take: limitNum
        }),
      prisma.protocolSimplified.count({ where }),
    ]);

    return res.json({
      success: true,
      protocols,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
        }
        });
  } catch (error: any) {
    console.error('Erro ao listar protocolos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar protocolos'
        });
  }
});

// ========================================
// BUSCAR PROTOCOLO POR ID
// ========================================

/**
 * GET /api/protocols-simplified/:id
 * Buscar protocolo específico por ID
 */
router.get('/:id', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const user = authReq.user;
    const { id } = req.params;

    const protocol = await prisma.protocolSimplified.findFirst({
      where: { id },
      include: {
        citizen: {
          select: {
            id: true,
            name: true,
            cpf: true,
            email: true,
            phone: true,
            address: true
          }
        },
        service: {
          select: {
            id: true,
            name: true,
            category: true,
            description: true
          }
        },
        department: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        history: {
          orderBy: { timestamp: 'desc' }
        },
        citizenLinks: {
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
        }
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Verificar permissões
    if (user.role === 'USER' && protocol.assignedUserId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para ver este protocolo'
      });
    }

    if (user.role === 'MANAGER' && protocol.departmentId !== user.departmentId) {
      return res.status(403).json({
        success: false,
        error: 'Você não tem permissão para ver protocolos de outros departamentos'
      });
    }

    return res.json({
      success: true,
      data: protocol
    });
  } catch (error: any) {
    console.error('Erro ao buscar protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar protocolo'
    });
  }
});

// ========================================
// APROVAR/REJEITAR PROTOCOLO (NOVO)
// ========================================

/**
 * PUT /api/protocols-simplified/:id/approve
 * Aprovar protocolo (ativa registro no módulo)
 */
router.put('/:id/approve', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const { id } = req.params;
    const { comment, additionalData } = req.body;

    const protocol = await protocolModuleService.approveProtocol({
      protocolId: id,
      userId,
      comment,
      additionalData
        });

    return res.json({
      success: true,
      data: protocol,
      message: 'Protocolo aprovado com sucesso'
        });
  } catch (error: any) {
    console.error('Approve protocol error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao aprovar protocolo'
        });
  }
});

/**
 * PUT /api/protocols-simplified/:id/reject
 * Rejeitar protocolo
 */
router.put('/:id/reject', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        error: 'Motivo da rejeição é obrigatório'
        });
    }

    const protocol = await protocolModuleService.rejectProtocol({
      protocolId: id,
      userId,
      reason
        });

    return res.json({
      success: true,
      data: protocol,
      message: 'Protocolo rejeitado'
        });
  } catch (error: any) {
    console.error('Reject protocol error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao rejeitar protocolo'
        });
  }
});

// ========================================
// ATUALIZAR STATUS
// ========================================

/**
 * PATCH /api/protocols-simplified/:id/status
 * Atualiza status do protocolo
 */
router.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, comment, userId } = req.body;
    const authReq = req as AuthenticatedRequest;

    if (!status || !Object.values(ProtocolStatus).includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Status inválido'
        });
    }

    // Usar motor centralizado de status
    const result = await protocolStatusEngine.updateStatus({
      protocolId: id,
      newStatus: status,
      actorId: userId || authReq.user.id,
      actorRole: authReq.user.role,
      comment,
      metadata: {
        source: 'protocols-simplified-routes'
      }
    });

    return res.json({
      success: true,
      data: result.protocol,
      message: 'Status atualizado com sucesso'
        });
  } catch (error: any) {
    console.error('Erro ao atualizar status:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atualizar status'
        });
  }
});

// ========================================
// ADICIONAR COMENTÁRIO
// ========================================

/**
 * POST /api/protocols-simplified/:id/comments
 * Adiciona comentário ao protocolo
 */
router.post('/:id/comments', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { comment, userId } = req.body;

    if (!comment) {
      return res.status(400).json({
        success: false,
        error: 'Comentário é obrigatório'
        });
    }

    await protocolServiceSimplified.addComment(id, comment, userId);

    return res.json({
      success: true,
      message: 'Comentário adicionado com sucesso'
        });
  } catch (error: any) {
    console.error('Erro ao adicionar comentário:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao adicionar comentário'
        });
  }
});

// ========================================
// ATRIBUIR PROTOCOLO
// ========================================

/**
 * PATCH /api/protocols-simplified/:id/assign
 * Atribui protocolo a um usuário
 */
router.patch('/:id/assign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { assignedUserId, userId } = req.body;

    if (!assignedUserId) {
      return res.status(400).json({
        success: false,
        error: 'assignedUserId é obrigatório'
        });
    }

    const protocol = await protocolServiceSimplified.assignProtocol(
      id,
      assignedUserId,
      userId
    );

    return res.json({
      success: true,
      data: protocol,
      message: 'Protocolo atribuído com sucesso'
        });
  } catch (error: any) {
    console.error('Erro ao atribuir protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao atribuir protocolo'
        });
  }
});

// ========================================
// LISTAR PROTOCOLOS
// ========================================

/**
 * GET /api/protocols-simplified/department/:departmentId
 * Lista protocolos por departamento
 */
router.get('/department/:departmentId', async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    const filters = req.query as any;

    const protocols = await protocolServiceSimplified.listByDepartment(
      departmentId,
      filters
    );

    return res.json({
      success: true,
      data: protocols,
      count: protocols.length
        });
  } catch (error: any) {
    console.error('Erro ao listar protocolos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar protocolos'
        });
  }
});

/**
 * GET /api/protocols-simplified/module/:departmentId/:moduleType
 * Lista protocolos por módulo
 */
router.get('/module/:departmentId/:moduleType', async (req: Request, res: Response) => {
  try {
    const { departmentId, moduleType } = req.params;

    const protocols = await protocolServiceSimplified.listByModule(
      departmentId,
      moduleType
    );

    return res.json({
      success: true,
      data: protocols,
      count: protocols.length
        });
  } catch (error: any) {
    console.error('Erro ao listar protocolos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar protocolos'
        });
  }
});

/**
 * GET /api/protocols-simplified/module/:moduleType/pending (NOVO)
 * Listar protocolos pendentes de um módulo específico
 */
router.get(
  '/module/:moduleType/pending',
  requireMinRole(UserRole.USER),
  async (req, res) => {
    try {
      const authReq = req as AuthenticatedRequest;
      const { moduleType } = req.params;
      const { page = 1, limit = 20 } = req.query;

      const result = await protocolModuleService.getPendingProtocolsByModule(
        moduleType,
        Number(page),
        Number(limit)
      );

      return res.json({
        success: true,
        ...result
        });
    } catch (error) {
      console.error('Get pending protocols error:', error);
      return res.status(500).json({
        success: false,
        error: 'Erro ao buscar protocolos pendentes'
        });
    }
  }
);

/**
 * GET /api/protocols-simplified/citizen/:citizenId
 * Lista protocolos do cidadão
 */
router.get('/citizen/:citizenId', async (req: Request, res: Response) => {
  try {
    const { citizenId } = req.params;

    const protocols = await protocolServiceSimplified.listByCitizen(citizenId);

    return res.json({
      success: true,
      data: protocols,
      count: protocols.length
        });
  } catch (error: any) {
    console.error('Erro ao listar protocolos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar protocolos'
        });
  }
});

// ========================================
// HISTÓRICO
// ========================================

/**
 * GET /api/protocols-simplified/:id/history
 * Obtém histórico completo do protocolo
 */
router.get('/:id/history', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const history = await protocolServiceSimplified.getHistory(id);

    return res.json({
      success: true,
      data: history
        });
  } catch (error: any) {
    console.error('Erro ao buscar histórico:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar histórico'
        });
  }
});

// ========================================
// AVALIAÇÃO
// ========================================

/**
 * POST /api/protocols-simplified/:id/evaluate
 * Avalia protocolo
 */
router.post('/:id/evaluate', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { rating, comment, wouldRecommend } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: 'Rating deve ser entre 1 e 5'
        });
    }

    const evaluation = await protocolServiceSimplified.evaluateProtocol(
      id,
      rating,
      comment,
      wouldRecommend
    );

    return res.status(201).json({
      success: true,
      data: evaluation,
      message: 'Avaliação registrada com sucesso'
        });
  } catch (error: any) {
    console.error('Erro ao avaliar protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao avaliar protocolo'
        });
  }
});

// ========================================
// ESTATÍSTICAS
// ========================================

/**
 * GET /api/protocols-simplified/stats/:departmentId
 * Obtém estatísticas de protocolos por departamento
 */
router.get('/stats/:departmentId', async (req: Request, res: Response) => {
  try {
    const { departmentId } = req.params;
    const { startDate, endDate } = req.query;

    const stats = await protocolServiceSimplified.getDepartmentStats(
      departmentId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    return res.json({
      success: true,
      data: stats
        });
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar estatísticas'
        });
  }
});

// ========================================
// BUSCAR PROTOCOLO POR NÚMERO
// ========================================

/**
 * GET /api/protocols/by-number/:number
 * Busca protocolo por número
 * Rota específica para evitar conflito com /:id
 */
router.get('/by-number/:number', async (req: Request, res: Response) => {
  try {
    const { number } = req.params;

    const protocol = await protocolServiceSimplified.findByNumber(number);

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
        });
    }

    return res.json({
      success: true,
      data: protocol
        });
  } catch (error: any) {
    console.error('Erro ao buscar protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao buscar protocolo'
        });
  }
});

export default router;

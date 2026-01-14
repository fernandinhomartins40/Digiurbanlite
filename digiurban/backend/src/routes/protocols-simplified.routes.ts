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

    return res.status(201).json({
      success: true,
      data: {
        protocol: result.protocol,
        hasModule: result.hasModule,
        moduleType: result.protocol.moduleType || null
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
// LISTAR CHAMADOS RECEBIDOS (NOVO)
// ========================================

/**
 * GET /api/protocols/incoming-calls
 * Lista chamados criados por ADMIN/MANAGER para os departamentos
 * Apenas MANAGER e ADMIN podem acessar
 */
router.get('/incoming-calls', requireMinRole(UserRole.MANAGER), async (req, res) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const userId = authReq.userId;
    const user = authReq.user;

    const {
      status,
      priority,
      assignedFilter, // 'all' | 'assigned' | 'unassigned'
      page = '1',
      limit = '50'
    } = req.query;

    // Filtro base: protocolos criados por usuários (chamados)
    const where: any = {
      createdById: { not: null } // Marca que foi criado por admin/manager
    };

    // MANAGER vê apenas chamados do seu departamento
    if (user.role === UserRole.MANAGER && user.departmentId) {
      where.departmentId = user.departmentId;
    }
    // ADMIN vê todos os chamados

    // Filtros opcionais
    if (status && status !== 'all') {
      where.status = status;
    }

    if (priority && priority !== 'all') {
      where.priority = parseInt(priority as string);
    }

    // Filtro de atribuição
    if (assignedFilter === 'assigned') {
      where.assignedUserId = { not: null };
    } else if (assignedFilter === 'unassigned') {
      where.assignedUserId = null;
    }

    // Paginação
    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

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
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limitNum
      }),
      prisma.protocolSimplified.count({ where })
    ]);

    // Estatísticas adicionais
    const stats = {
      total,
      unassigned: await prisma.protocolSimplified.count({
        where: { ...where, assignedUserId: null }
      }),
      assigned: await prisma.protocolSimplified.count({
        where: { ...where, assignedUserId: { not: null } }
      })
    };

    return res.json({
      success: true,
      protocols,
      stats,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Erro ao listar chamados recebidos:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao listar chamados recebidos'
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
      include,     // ✅ NOVO: incluir dados adicionais (stages,documents,pendings)
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

    // ✅ NOVO: Montar includes dinamicamente baseado no parâmetro 'include'
    const includeArray = include ? (include as string).split(',').map(i => i.trim()) : [];
    const includeStages = includeArray.includes('stages');
    const includeDocuments = includeArray.includes('documents');
    const includePendings = includeArray.includes('pendings');

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
          // ✅ INCLUIR STAGES SE SOLICITADO
          ...(includeStages && {
            stages: {
              orderBy: {
                stageOrder: 'asc'
              }
            }
          }),
          // ✅ INCLUIR DOCUMENTS SE SOLICITADO
          ...(includeDocuments && {
            documentFiles: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          }),
          // ✅ INCLUIR PENDINGS SE SOLICITADO
          ...(includePendings && {
            pendings: {
              orderBy: {
                createdAt: 'desc'
              }
            }
          }),
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
 * Atribui protocolo a um usuário com validações completas
 */
router.patch('/:id/assign', requireMinRole(UserRole.MANAGER), async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const { id } = req.params;
    const { assignedUserId, comment } = req.body;

    if (!assignedUserId) {
      return res.status(400).json({
        success: false,
        error: 'assignedUserId é obrigatório'
        });
    }

    // Buscar protocolo com departamento
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id },
      include: {
        department: true,
        service: true,
        citizen: true
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // ✅ VALIDAR: servidor pertence ao departamento correto
    const assignedUser = await prisma.user.findFirst({
      where: {
        id: assignedUserId,
        departmentId: protocol.departmentId,
        isActive: true,
        role: { in: [UserRole.USER, UserRole.COORDINATOR, UserRole.MANAGER] }
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    if (!assignedUser) {
      return res.status(400).json({
        success: false,
        error: 'Servidor não encontrado ou não pertence ao departamento responsável pelo protocolo'
      });
    }

    // ✅ Verificar se MANAGER está atribuindo para seu próprio departamento
    if (authReq.user.role === UserRole.MANAGER && protocol.departmentId !== authReq.user.departmentId) {
      return res.status(403).json({
        success: false,
        error: 'Você só pode atribuir protocolos do seu departamento'
      });
    }

    // Atualizar protocolo
    const updatedProtocol = await prisma.protocolSimplified.update({
      where: { id },
      data: { assignedUserId },
      include: {
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        citizen: true,
        service: true,
        department: true
      }
    });

    // ✅ Registrar histórico
    await prisma.protocolHistorySimplified.create({
      data: {
        protocolId: id,
        action: 'ATRIBUIDO',
        comment: comment || `Protocolo atribuído para ${assignedUser.name} (${assignedUser.role})`,
        userId: authReq.userId
      }
    });

    // ✅ CRIAR NOTIFICAÇÃO para cidadão (informando sobre atribuição)
    // Nota: O servidor atribuído receberá notificação por outro meio (email, sistema interno)
    await prisma.notification.create({
      data: {
        citizenId: protocol.citizenId,
        title: 'Protocolo em Andamento',
        message: `Seu protocolo ${protocol.number} foi atribuído para o servidor ${assignedUser.name} e está sendo processado`,
        type: 'INFO',
        protocolId: protocol.id
      }
    });

    return res.json({
      success: true,
      data: updatedProtocol,
      message: `Protocolo atribuído com sucesso para ${assignedUser.name}`
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

// ========================================
// CONCLUIR PROTOCOLO
// ========================================

/**
 * POST /api/protocols/:id/complete
 * Marca o protocolo como concluído (finalizado)
 */
router.post('/:id/complete', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { id } = req.params;
    const { finalNotes, documentUrl } = req.body;

    // Buscar protocolo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id },
      include: {
        citizen: true,
        service: true
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Atualizar protocolo para COMPLETED
    const updatedProtocol = await prisma.protocolSimplified.update({
      where: { id },
      data: {
        status: ProtocolStatus.CONCLUIDO,
        concludedAt: new Date()
      },
      include: {
        citizen: true,
        service: true
      }
    });

    // Registrar interação
    const authReq = req as AuthenticatedRequest;
    await prisma.protocolInteraction.create({
      data: {
        protocolId: id,
        type: 'STATUS_CHANGED',
        message: `Protocolo concluído${finalNotes ? ': ' + finalNotes : ''}`,
        authorType: 'SERVER',
        authorId: authReq.userId,
        authorName: authReq.user?.name || 'Sistema',
        isInternal: false,
        metadata: {
          oldStatus: protocol.status,
          newStatus: 'CONCLUIDO',
          documentUrl: documentUrl || null,
          finalNotes: finalNotes || null
        }
      }
    });

    return res.json({
      success: true,
      data: updatedProtocol,
      message: `Protocolo ${protocol.number} concluído com sucesso`
    });
  } catch (error: any) {
    console.error('Erro ao concluir protocolo:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao concluir protocolo'
    });
  }
});

// ========================================
// RELATÓRIO COMPLETO DO PROTOCOLO
// ========================================

/**
 * GET /api/protocols/:id/report
 * Gerar relatório completo do protocolo (PDF ou JSON)
 */
router.get('/:id/report', requireMinRole(UserRole.USER), async (req, res) => {
  try {
    const { id } = req.params;
    const format = req.query.format as string || 'pdf';

    // Buscar todos os dados do protocolo
    const protocol = await prisma.protocolSimplified.findUnique({
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
          include: {
            department: true
          }
        },
        department: true,
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        history: {
          orderBy: { timestamp: 'asc' }
        },
        interactions: {
          orderBy: { createdAt: 'asc' }
        },
        documentFiles: {
          orderBy: { createdAt: 'asc' }
        },
        dataFields: {
          orderBy: { createdAt: 'asc' }
        },
        pendings: {
          orderBy: { createdAt: 'asc' }
        },
        stages: {
          orderBy: { stageOrder: 'asc' }
        },
        sla: true,
        citizenLinks: {
          include: {
            linkedCitizen: {
              select: {
                id: true,
                name: true,
                cpf: true,
                email: true
              }
            }
          }
        },
        generatedDocuments: {
          orderBy: { generatedAt: 'desc' }
        }
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Calcular estatísticas
    const stats = {
      totalDays: protocol.concludedAt || protocol.updatedAt
        ? Math.ceil(
            (new Date(protocol.concludedAt || protocol.updatedAt).getTime() -
              new Date(protocol.createdAt).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : 0,
      completedStages: protocol.stages.filter(s => s.status === 'COMPLETED').length,
      totalStages: protocol.stages.length,
      approvedDocs: protocol.documentFiles.filter(d => d.status === 'APPROVED').length,
      rejectedDocs: protocol.documentFiles.filter(d => d.status === 'REJECTED').length,
      totalDocs: protocol.documentFiles.length,
      generatedDocs: protocol.generatedDocuments.length,
      totalInteractions: protocol.interactions.length,
      citizenMessages: protocol.interactions.filter(i => i.authorType === 'CITIZEN').length,
      pendingsResolved: protocol.pendings.filter(p => p.status === 'RESOLVED').length,
      totalPendings: protocol.pendings.length
    };

    // Montar relatório completo
    const report = {
      protocol: {
        id: protocol.id,
        number: protocol.number,
        title: protocol.title,
        description: protocol.description,
        status: protocol.status,
        priority: protocol.priority,
        createdAt: protocol.createdAt,
        updatedAt: protocol.updatedAt,
        concludedAt: protocol.concludedAt,
        dueDate: protocol.dueDate
      },
      citizen: protocol.citizen,
      service: protocol.service,
      department: protocol.department,
      assignedUser: protocol.assignedUser,
      createdBy: protocol.createdBy,
      statistics: stats,
      timeline: {
        history: protocol.history,
        interactions: protocol.interactions,
        stages: protocol.stages,
        pendings: protocol.pendings
      },
      documents: {
        received: protocol.documentFiles,
        generated: protocol.generatedDocuments
      },
      dataFields: protocol.dataFields,
      sla: protocol.sla,
      citizenLinks: protocol.citizenLinks,
      generatedAt: new Date()
    };

    // Se formato for JSON, retornar como JSON
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="protocolo_${protocol.number}_relatorio.json"`);
      return res.json(report);
    }

    // Se formato for PDF, gerar com Playwright
    if (format === 'pdf') {
      const { chromium } = require('playwright');

      const browser = await chromium.launch({ headless: true });
      const page = await browser.newPage();

      // Gerar HTML do relatório
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
            h2 { color: #1e40af; margin-top: 30px; }
            .header { background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .stat-box { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 24px; font-weight: bold; color: #2563eb; }
            .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th { background: #2563eb; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
            .status { padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .status-concluido { background: #d1fae5; color: #065f46; }
            .status-cancelado { background: #fee2e2; color: #991b1b; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          </style>
        </head>
        <body>
          <h1>Relatório Completo do Protocolo</h1>

          <div class="header">
            <h2 style="margin-top: 0;">Protocolo #${protocol.number}</h2>
            <p><strong>Título:</strong> ${protocol.title || 'N/A'}</p>
            <p><strong>Status:</strong> <span class="status status-${protocol.status.toLowerCase()}">${protocol.status}</span></p>
            <p><strong>Data de Criação:</strong> ${new Date(protocol.createdAt).toLocaleString('pt-BR')}</p>
            ${protocol.concludedAt ? `<p><strong>Data de Conclusão:</strong> ${new Date(protocol.concludedAt).toLocaleString('pt-BR')}</p>` : ''}
          </div>

          <h2>Estatísticas</h2>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${stats.totalDays}</div>
              <div class="stat-label">Dias Totais</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.completedStages}/${stats.totalStages}</div>
              <div class="stat-label">Etapas Concluídas</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.approvedDocs}</div>
              <div class="stat-label">Docs Aprovados</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.generatedDocs}</div>
              <div class="stat-label">Docs Gerados</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.totalInteractions}</div>
              <div class="stat-label">Interações</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${stats.pendingsResolved}/${stats.totalPendings}</div>
              <div class="stat-label">Pendências Resolvidas</div>
            </div>
          </div>

          <h2>Informações do Cidadão</h2>
          <table>
            <tr><td><strong>Nome:</strong></td><td>${protocol.citizen?.name || 'N/A'}</td></tr>
            <tr><td><strong>CPF:</strong></td><td>${protocol.citizen?.cpf || 'N/A'}</td></tr>
            <tr><td><strong>Email:</strong></td><td>${protocol.citizen?.email || 'N/A'}</td></tr>
            <tr><td><strong>Telefone:</strong></td><td>${protocol.citizen?.phone || 'N/A'}</td></tr>
          </table>

          <h2>Serviço Solicitado</h2>
          <table>
            <tr><td><strong>Serviço:</strong></td><td>${protocol.service?.name || 'N/A'}</td></tr>
            <tr><td><strong>Departamento:</strong></td><td>${protocol.service?.department?.name || protocol.department?.name || 'N/A'}</td></tr>
          </table>

          ${protocol.documentFiles.length > 0 ? `
          <h2>Documentos Recebidos (${protocol.documentFiles.length})</h2>
          <table>
            <thead><tr><th>Documento</th><th>Status</th><th>Data de Envio</th></tr></thead>
            <tbody>
            ${protocol.documentFiles.map(doc => `
              <tr>
                <td>${doc.documentType}</td>
                <td>${doc.status}</td>
                <td>${doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString('pt-BR') : 'N/A'}</td>
              </tr>
            `).join('')}
            </tbody>
          </table>
          ` : ''}

          ${protocol.stages.length > 0 ? `
          <h2>Etapas do Processo (${protocol.stages.length})</h2>
          <table>
            <thead><tr><th>Etapa</th><th>Status</th><th>Início</th><th>Conclusão</th></tr></thead>
            <tbody>
            ${protocol.stages.map(stage => `
              <tr>
                <td>${stage.stageName}</td>
                <td>${stage.status}</td>
                <td>${stage.startedAt ? new Date(stage.startedAt).toLocaleString('pt-BR') : 'N/A'}</td>
                <td>${stage.completedAt ? new Date(stage.completedAt).toLocaleString('pt-BR') : '-'}</td>
              </tr>
            `).join('')}
            </tbody>
          </table>
          ` : ''}

          <div class="footer">
            <p>Relatório gerado em ${new Date().toLocaleString('pt-BR')}</p>
            <p>Sistema DigiUrban - Gestão de Protocolos</p>
          </div>
        </body>
        </html>
      `;

      await page.setContent(html);
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
      });

      await browser.close();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="protocolo_${protocol.number}_relatorio.pdf"`);
      return res.send(pdfBuffer);
    }

    return res.status(400).json({
      success: false,
      error: 'Formato não suportado. Use format=pdf ou format=json'
    });

  } catch (error: any) {
    console.error('Erro ao gerar relatório:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao gerar relatório'
    });
  }
});

/**
 * GET /api/protocols/:id/timeline/export
 * Exportar timeline do protocolo em PDF
 */
router.get('/:id/timeline/export', adminAuthMiddleware, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    // Buscar protocolo completo
    const protocol = await prisma.protocolSimplified.findUnique({
      where: { id },
      include: {
        stages: {
          orderBy: { stageOrder: 'asc' }
        },
        documentFiles: {
          orderBy: { uploadedAt: 'desc' }
        },
        pendings: {
          orderBy: { createdAt: 'desc' }
        },
        interactions: {
          orderBy: { createdAt: 'desc' }
        },
        history: {
          orderBy: { id: 'asc' }
        }
      }
    });

    if (!protocol) {
      return res.status(404).json({
        success: false,
        error: 'Protocolo não encontrado'
      });
    }

    // Montar eventos da timeline
    const timelineEvents = [];

    // Evento de criação do protocolo
    timelineEvents.push({
      type: 'protocol',
      timestamp: protocol.createdAt,
      title: 'Protocolo Criado',
      description: `Protocolo ${protocol.number} foi criado`,
      status: 'created'
    });

    // Eventos de etapas
    protocol.stages.forEach(stage => {
      if (stage.startedAt) {
        timelineEvents.push({
          type: 'stage',
          timestamp: stage.startedAt,
          title: `Etapa Iniciada: ${stage.stageName}`,
          description: stage.notes || '',
          status: 'started'
        });
      }
      if (stage.completedAt) {
        timelineEvents.push({
          type: 'stage',
          timestamp: stage.completedAt,
          title: `Etapa Concluída: ${stage.stageName}`,
          description: stage.notes || '',
          status: 'completed'
        });
      }
    });

    // Eventos de documentos
    protocol.documentFiles.forEach(doc => {
      timelineEvents.push({
        type: 'document',
        timestamp: doc.uploadedAt,
        title: `Documento Enviado: ${doc.documentType}`,
        description: doc.fileName,
        status: doc.status
      });
      if (doc.validatedAt) {
        timelineEvents.push({
          type: 'document',
          timestamp: doc.validatedAt,
          title: `Documento ${doc.status === 'APPROVED' ? 'Aprovado' : 'Rejeitado'}: ${doc.documentType}`,
          description: doc.rejectionReason || '',
          status: doc.status
        });
      }
    });

    // Eventos de pendências
    protocol.pendings.forEach(pending => {
      timelineEvents.push({
        type: 'pending',
        timestamp: pending.createdAt,
        title: `Pendência Criada`,
        description: pending.description,
        status: 'created'
      });
      if (pending.resolvedAt) {
        timelineEvents.push({
          type: 'pending',
          timestamp: pending.resolvedAt,
          title: `Pendência Resolvida`,
          description: pending.resolution || pending.description,
          status: pending.status
        });
      }
    });

    // Eventos de interações
    protocol.interactions.forEach(interaction => {
      timelineEvents.push({
        type: 'interaction',
        timestamp: interaction.createdAt,
        title: `${interaction.isFromCitizen ? 'Mensagem do Cidadão' : 'Mensagem da Equipe'}`,
        description: interaction.message,
        status: interaction.interactionType
      });
    });

    // Ordenar eventos por data
    timelineEvents.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    // Gerar PDF com Playwright
    const { chromium } = require('playwright');
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; }
          h1 { color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px; }
          h2 { color: #1e40af; margin-top: 30px; font-size: 18px; }
          .header { background: #eff6ff; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
          .timeline { position: relative; padding-left: 40px; }
          .timeline::before { content: ''; position: absolute; left: 15px; top: 0; bottom: 0; width: 2px; background: #e5e7eb; }
          .timeline-item { position: relative; margin-bottom: 25px; }
          .timeline-dot { position: absolute; left: -32px; width: 12px; height: 12px; border-radius: 50%; background: #3b82f6; border: 3px solid white; box-shadow: 0 0 0 2px #3b82f6; }
          .timeline-dot.created { background: #10b981; box-shadow: 0 0 0 2px #10b981; }
          .timeline-dot.completed { background: #10b981; box-shadow: 0 0 0 2px #10b981; }
          .timeline-dot.rejected { background: #ef4444; box-shadow: 0 0 0 2px #ef4444; }
          .timeline-dot.pending { background: #f59e0b; box-shadow: 0 0 0 2px #f59e0b; }
          .timeline-content { background: #f9fafb; padding: 15px; border-radius: 8px; border-left: 3px solid #3b82f6; }
          .timeline-title { font-weight: bold; color: #1f2937; margin-bottom: 5px; }
          .timeline-time { font-size: 11px; color: #6b7280; margin-bottom: 8px; }
          .timeline-description { font-size: 13px; color: #4b5563; }
          .status-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; margin-top: 5px; }
          .status-created { background: #d1fae5; color: #065f46; }
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-approved { background: #d1fae5; color: #065f46; }
          .status-rejected { background: #fee2e2; color: #991b1b; }
          .status-pending { background: #fef3c7; color: #92400e; }
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; }
          .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .summary-box { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-value { font-size: 24px; font-weight: bold; color: #2563eb; }
          .summary-label { font-size: 11px; color: #6b7280; margin-top: 5px; }
        </style>
      </head>
      <body>
        <h1>Timeline do Protocolo ${protocol.number}</h1>

        <div class="header">
          <p><strong>Protocolo:</strong> ${protocol.number}</p>
          <p><strong>Status Atual:</strong> ${protocol.status}</p>
          <p><strong>Criado em:</strong> ${new Date(protocol.createdAt).toLocaleString('pt-BR')}</p>
        </div>

        <h2>Resumo de Eventos</h2>
        <div class="summary">
          <div class="summary-box">
            <div class="summary-value">${timelineEvents.length}</div>
            <div class="summary-label">Total de Eventos</div>
          </div>
          <div class="summary-box">
            <div class="summary-value">${protocol.stages.length}</div>
            <div class="summary-label">Etapas</div>
          </div>
          <div class="summary-box">
            <div class="summary-value">${protocol.documentFiles.length}</div>
            <div class="summary-label">Documentos</div>
          </div>
        </div>

        <h2>Linha do Tempo Completa (${timelineEvents.length} eventos)</h2>
        <div class="timeline">
          ${timelineEvents.map(event => `
            <div class="timeline-item">
              <div class="timeline-dot ${event.status.toLowerCase()}"></div>
              <div class="timeline-content">
                <div class="timeline-title">${event.title}</div>
                <div class="timeline-time">${new Date(event.timestamp).toLocaleString('pt-BR')}</div>
                ${event.description ? `<div class="timeline-description">${event.description}</div>` : ''}
                <span class="status-badge status-${event.status.toLowerCase()}">${event.type.toUpperCase()}</span>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="footer">
          <p>Relatório de Timeline gerado em ${new Date().toLocaleString('pt-BR')}</p>
          <p>Sistema DigiUrban</p>
        </div>
      </body>
      </html>
    `;

    await page.setContent(html);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="timeline_protocolo_${protocol.number}_${Date.now()}.pdf"`);
    return res.send(pdfBuffer);

  } catch (error: any) {
    console.error('Erro ao exportar timeline:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Erro ao exportar timeline'
    });
  }
});

export default router;
